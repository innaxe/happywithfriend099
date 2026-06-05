-- ============================================================
--  เป้าเงิน — Supabase setup
--  วางทั้งหมดนี้ใน Supabase → SQL Editor → New query → Run
--  (รันครั้งเดียว ปลอดภัยถ้ารันซ้ำ)
-- ============================================================

-- ---------- ตาราง: รายชื่อคน ----------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  nick        text not null,
  real        text default '',
  created_at  timestamptz default now()
);

-- ---------- ตาราง: เป้าหมาย ----------
create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  emoji        text default '🎯',
  accent       text default '#059669',
  currency     text default '฿',
  target       numeric not null default 10000,
  start_month  text not null,            -- รูปแบบ YYYY-MM
  end_month    text not null,            -- รูปแบบ YYYY-MM
  members      text[] default '{}',      -- เก็บ "ชื่อเล่น" ของสมาชิก
  created_at   timestamptz default now()
);

-- ---------- ตาราง: รายการโอน/ออม ----------
create table if not exists public.contributions (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid references public.goals(id) on delete cascade,
  name        text not null,             -- ชื่อเล่นของคนที่โอน
  month       text not null,             -- YYYY-MM
  amount      numeric not null,
  note        text default '',
  slip_url    text default '',           -- ลิงก์รูปสลิปใน Storage
  created_at  timestamptz default now()
);

-- ---------- เปิด Row Level Security ----------
alter table public.people        enable row level security;
alter table public.goals         enable row level security;
alter table public.contributions enable row level security;

-- ---------- นโยบาย: เฉพาะคนที่ล็อกอินแล้วเท่านั้นที่อ่าน/เขียนได้ ----------
-- (คนนอกที่มีแค่ลิงก์/anon key จะแตะข้อมูลไม่ได้)
drop policy if exists "auth all people"        on public.people;
drop policy if exists "auth all goals"         on public.goals;
drop policy if exists "auth all contributions" on public.contributions;

create policy "auth all people"        on public.people        for all to authenticated using (true) with check (true);
create policy "auth all goals"         on public.goals         for all to authenticated using (true) with check (true);
create policy "auth all contributions" on public.contributions for all to authenticated using (true) with check (true);

-- ---------- เปิด Realtime (ทุกคนเห็นอัปเดตสด) ----------
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.contributions;

-- ---------- Storage: ที่เก็บรูปสลิป ----------
insert into storage.buckets (id, name, public)
values ('slips', 'slips', true)
on conflict (id) do nothing;

drop policy if exists "slips read"   on storage.objects;
drop policy if exists "slips upload" on storage.objects;

create policy "slips read"   on storage.objects for select using (bucket_id = 'slips');
create policy "slips upload" on storage.objects for insert to authenticated with check (bucket_id = 'slips');

-- ============================================================
--  ไดอารี่กลุ่ม (อัพเดท + รีแอกชัน + คอมเมนต์)
--  หมายเหตุ: ส่วนนี้เหมือนกับ supabase-feed.sql ทุกอย่าง
--  (รวมไว้ที่นี่เพื่อให้ตั้งจากศูนย์ได้ครบในไฟล์เดียว)
-- ============================================================

create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid references public.goals(id) on delete cascade,
  author      text not null,
  text        text default '',
  image_url   text default '',
  created_at  timestamptz default now()
);

create table if not exists public.update_reactions (
  id          uuid primary key default gen_random_uuid(),
  update_id   uuid references public.updates(id) on delete cascade,
  author      text not null,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique (update_id, author, emoji)
);

create table if not exists public.update_comments (
  id          uuid primary key default gen_random_uuid(),
  update_id   uuid references public.updates(id) on delete cascade,
  author      text not null,
  text        text not null,
  created_at  timestamptz default now()
);

alter table public.updates          enable row level security;
alter table public.update_reactions enable row level security;
alter table public.update_comments  enable row level security;

drop policy if exists "auth all updates"   on public.updates;
drop policy if exists "auth all reactions" on public.update_reactions;
drop policy if exists "auth all comments"  on public.update_comments;

create policy "auth all updates"   on public.updates          for all to authenticated using (true) with check (true);
create policy "auth all reactions" on public.update_reactions for all to authenticated using (true) with check (true);
create policy "auth all comments"  on public.update_comments  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.updates;
alter publication supabase_realtime add table public.update_reactions;
alter publication supabase_realtime add table public.update_comments;

insert into storage.buckets (id, name, public)
values ('feed', 'feed', true)
on conflict (id) do nothing;

drop policy if exists "feed read"   on storage.objects;
drop policy if exists "feed upload" on storage.objects;

create policy "feed read"   on storage.objects for select using (bucket_id = 'feed');
create policy "feed upload" on storage.objects for insert to authenticated with check (bucket_id = 'feed');

-- เสร็จแล้ว ✅
