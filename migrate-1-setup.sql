-- ============================================================
--  เป้าเงิน — ไฟล์ที่ 1: ตั้งระบบ Discord (รันตอนนี้)
--  วิธีรัน: Supabase → SQL Editor → New query → วางทั้งไฟล์ → Run
--  ปลอดภัย: ยังไม่ล็อกใคร แอปใช้ได้ปกติ · รันซ้ำได้
--
--  ถ้า Run แล้วขึ้น error เรื่อง "duplicate / people_nick_key"
--  = มีชื่อเล่นซ้ำในตาราง people → แคปมาบอกได้ เดี๋ยวช่วยแก้
-- ============================================================

-- ---------- คอลัมน์ผูกตัวตน Discord บน people ----------
alter table public.people add column if not exists auth_id    uuid;
alter table public.people add column if not exists discord_id text;
alter table public.people add column if not exists avatar_url text;

-- 1 บัญชี Discord ผูกได้ 1 ชื่อ (ค่าว่างได้ = ยังไม่ผูก)
create unique index if not exists people_auth_id_key
  on public.people (auth_id) where auth_id is not null;

-- ชื่อเล่นห้ามซ้ำ (ใช้เป็นกุญแจผูกตัวตน) — ถ้ามีซ้ำอยู่เดิม คำสั่งนี้จะ error
create unique index if not exists people_nick_key on public.people (nick);

-- ---------- ฟังก์ชัน: my_nick() = ชื่อของคนที่ล็อกอินอยู่ ----------
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
  where auth_id = (select auth.uid())
  limit 1;
  return v_nick;
end;
$$;
revoke all on function public.my_nick() from public;
grant execute on function public.my_nick() to authenticated;

-- ---------- ฟังก์ชัน: claim_nick() = ผูกชื่อกับบัญชีตัวเอง (กันแย่งชื่อ) ----------
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
    raise exception 'no such nick: %', p_nick;
  end if;
  if v_owner is not null and v_owner <> v_uid then
    raise exception 'nick already claimed';
  end if;

  update public.people set auth_id = null
   where auth_id = v_uid and nick <> p_nick;

  update public.people
     set auth_id    = v_uid,
         discord_id = coalesce(p_discord_id, discord_id),
         avatar_url = coalesce(p_avatar_url, avatar_url)
   where nick = p_nick
     and (auth_id is null or auth_id = v_uid);
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'nick already claimed';
  end if;
end;
$$;
revoke all on function public.claim_nick(text, text, text) from public;
grant execute on function public.claim_nick(text, text, text) to authenticated;

-- ---------- นโยบาย people: อ่านได้ทุกคน · ผูกชื่อได้เฉพาะของตัวเอง ----------
drop policy if exists "auth all people" on public.people;

create policy "people read" on public.people
  for select to authenticated using (true);

create policy "people insert" on public.people
  for insert to authenticated
  with check (auth_id is null or auth_id = (select auth.uid()));

create policy "people update" on public.people
  for update to authenticated
  using  (auth_id is null or auth_id = (select auth.uid()))
  with check (auth_id is null or auth_id = (select auth.uid()));

create policy "people delete" on public.people
  for delete to authenticated using (true);

-- เสร็จไฟล์ที่ 1 ✅ (ตอนนี้ทุกคนล็อกอิน Discord + เลือกชื่อได้แล้ว ยังไม่ล็อกการปลอมชื่อ)
