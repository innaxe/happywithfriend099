-- ============================================================
--  เป้าเงิน — Migration: shared-password  ->  per-person Discord OAuth
--  + server-side (RLS) author-impersonation lock.
--  Run in Supabase -> SQL Editor. Idempotent / safe to re-run.
--
--  Run order:
--    PART A + B + C now (non-breaking; nobody locked out).
--    PART D LAST, only AFTER everyone has logged in with Discord and
--    claimed their nick (it flips diary writes to author = my_nick()).
-- ============================================================


-- ============================================================
-- PRECHECK — duplicate nicks must be removed before the unique index.
-- If this returns any rows, fix them (merge/rename) BEFORE continuing.
-- ============================================================
-- select nick, count(*) from public.people group by nick having count(*) > 1;


-- ============================================================
-- PART A — identity columns on people (non-breaking)
-- One Discord user (auth.uid) maps to exactly ONE people row (one nick).
-- people is already the canonical nick registry (goals.members[], updates.author
-- all reference people.nick), so we add the link here instead of a new table.
-- ============================================================
alter table public.people add column if not exists auth_id    uuid;
alter table public.people add column if not exists discord_id text;
alter table public.people add column if not exists avatar_url text;

-- One Discord account claims at most one nick (NULLs allowed = legacy/unclaimed).
create unique index if not exists people_auth_id_key
  on public.people (auth_id) where auth_id is not null;

-- REQUIRED: nick must be unique so it is a stable 1:1 key for the author lock.
-- (Today uniqueness is only checked client-side in addPerson -> bypassable.)
-- This FAILS if duplicates exist -> run the PRECHECK above first.
create unique index if not exists people_nick_key on public.people (nick);


-- ============================================================
-- PART B — helper functions (non-breaking)
-- ============================================================

-- my_nick(): the caller's owned nick, or NULL if they have not claimed one.
-- plpgsql + SECURITY DEFINER + SET search_path. NOTE on the language choice:
-- a plain `language sql` body would ALSO be safe here, because Postgres never
-- inlines a SQL function that is SECURITY DEFINER or has a SET clause (this one
-- has both), and SELECT on people is open anyway -> no RLS recursion either way.
-- We use plpgsql purely as the belt-and-suspenders choice; it is never inlined.
create or replace function public.my_nick()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_nick text;
begin
  select nick into v_nick
  from public.people
  where auth_id = (select auth.uid())   -- (select ...) => cached once per statement
  limit 1;
  return v_nick;   -- NULL => all diary writes correctly fail until they claim
end;
$$;

revoke all on function public.my_nick() from public;
grant execute on function public.my_nick() to authenticated;

-- claim_nick(): one-time atomic claim of an existing nick after Discord login.
-- Race-safe: the UPDATE itself is guarded by `auth_id is null or auth_id = me`,
-- and we check the affected row count so two users racing for one nick -> loser
-- gets a clean error (not a silent steal). Also stamps discord_id / avatar_url.
create or replace function public.claim_nick(
  p_nick       text,
  p_discord_id text default null,
  p_avatar_url text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_owner uuid;
  v_rows  int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select auth_id into v_owner from public.people where nick = p_nick limit 1;
  if not found then
    raise exception 'no such nick: %', p_nick;          -- FOUND=false: nick missing
  end if;
  if v_owner is not null and v_owner <> v_uid then
    raise exception 'nick already claimed';             -- owned by someone else
  end if;

  -- release any other nick this user previously held (one nick per user)
  update public.people set auth_id = null
   where auth_id = v_uid and nick <> p_nick;

  -- guarded claim: only succeeds while the row is still unclaimed (or already mine)
  update public.people
     set auth_id    = v_uid,
         discord_id = coalesce(p_discord_id, discord_id),
         avatar_url = coalesce(p_avatar_url, avatar_url)
   where nick = p_nick
     and (auth_id is null or auth_id = v_uid);
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'nick already claimed';             -- lost the race
  end if;
end;
$$;

revoke all on function public.claim_nick(text, text, text) from public;
grant execute on function public.claim_nick(text, text, text) to authenticated;


-- ============================================================
-- PART C — people policies (non-breaking): reads open; claiming guarded.
-- Keeps roster add/edit working for the in-app People dialog, but prevents a
-- user from PATCHing auth_id to anything other than their own uid via REST.
-- ============================================================
drop policy if exists "auth all people" on public.people;

create policy "people read" on public.people
  for select to authenticated using (true);

-- Roster seeding (addPerson) and claim-by-create: a brand-new row may be inserted
-- only unclaimed (auth_id null) or owned by me. Blocks inserting a row pre-stamped
-- with someone else's uid.
create policy "people insert" on public.people
  for insert to authenticated
  with check (auth_id is null or auth_id = (select auth.uid()));

-- Edit/claim: may only land auth_id = my own uid (or leave it null). Prevents
-- attaching my row to another user's uid or stealing a claimed row.
create policy "people update" on public.people
  for update to authenticated
  using  (auth_id is null or auth_id = (select auth.uid()))
  with check (auth_id is null or auth_id = (select auth.uid()));

-- Deleting members stays open (in-app removePerson keeps working).
create policy "people delete" on public.people
  for delete to authenticated using (true);


-- ============================================================
-- PART D — ENFORCEMENT (BREAKING). Run LAST, after everyone has claimed.
-- Reads stay open to all authenticated members (shared group view + realtime).
-- Only NEW diary writes are constrained to author = my_nick(). Existing rows
-- are untouched (WITH CHECK runs on INSERT/UPDATE only).
-- DELETE = own-only (chosen default; see rollback note to re-open).
-- ============================================================

-- updates ---------------------------------------------------
drop policy if exists "auth all updates" on public.updates;
create policy "updates read"   on public.updates for select to authenticated using (true);
create policy "updates insert" on public.updates for insert to authenticated
  with check (author = public.my_nick());
create policy "updates update" on public.updates for update to authenticated
  using (author = public.my_nick()) with check (author = public.my_nick());
create policy "updates delete" on public.updates for delete to authenticated
  using (author = public.my_nick());

-- update_comments -------------------------------------------
drop policy if exists "auth all comments" on public.update_comments;
create policy "comments read"   on public.update_comments for select to authenticated using (true);
create policy "comments insert" on public.update_comments for insert to authenticated
  with check (author = public.my_nick());
create policy "comments update" on public.update_comments for update to authenticated
  using (author = public.my_nick()) with check (author = public.my_nick());
create policy "comments delete" on public.update_comments for delete to authenticated
  using (author = public.my_nick());

-- update_reactions ------------------------------------------
drop policy if exists "auth all reactions" on public.update_reactions;
create policy "reactions read"   on public.update_reactions for select to authenticated using (true);
create policy "reactions insert" on public.update_reactions for insert to authenticated
  with check (author = public.my_nick());
create policy "reactions delete" on public.update_reactions for delete to authenticated
  using (author = public.my_nick());

-- ============================================================
-- contributions / goals: LEFT OPEN on purpose (money authorship stays open;
-- slips are proof; logging on behalf of others must keep working). No change.
-- Storage buckets slips/feed: still `insert to authenticated` -> unchanged.
-- ============================================================

-- ============================================================
-- OPTIONAL pre-seed (recommended to prevent nick-grabbing): once you know each
-- member's Discord uid, claim on their behalf:
--   update public.people set auth_id = '<auth-uid>' where nick = 'ชื่อเล่น';
-- ============================================================

-- ============================================================
-- ROLLBACK of enforcement only (panic button, no redeploy) — re-open diary writes:
--   drop policy if exists "updates insert" on public.updates;  -- (and the rest)
--   create policy "auth all updates"   on public.updates          for all to authenticated using (true) with check (true);
--   create policy "auth all comments"  on public.update_comments  for all to authenticated using (true) with check (true);
--   create policy "auth all reactions" on public.update_reactions for all to authenticated using (true) with check (true);
-- To re-open DELETE to any member instead of own-only, replace the delete policy
-- using-clause with `using (true)`.
-- ============================================================
