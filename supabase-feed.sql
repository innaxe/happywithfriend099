-- ============================================================
--  เป้าเงิน — migration: ไดอารี่กลุ่ม (อัพเดท + รีแอกชัน + คอมเมนต์)
--  วางทั้งหมดนี้ใน Supabase → SQL Editor → New query → Run
--  (รันครั้งเดียวพอ ปลอดภัยถ้ารันซ้ำ — ใช้ if not exists / on conflict)
--  *** ต้องรัน supabase-setup.sql มาก่อนแล้ว ***
-- ============================================================

-- ---------- ตาราง: อัพเดท/ไดอารี่ (เล่าว่าไปไหนทำอะไร + รูป) ----------
create table if not exists public.updates (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid references public.goals(id) on delete cascade,
  author      text not null,             -- ชื่อเล่นของคนโพสต์
  text        text default '',
  image_url   text default '',           -- ลิงก์รูปใน Storage (bucket: feed)
  created_at  timestamptz default now()
);

-- ---------- ตาราง: อิโมจิรีแอกชันของอัพเดท ----------
create table if not exists public.update_reactions (
  id          uuid primary key default gen_random_uuid(),
  update_id   uuid references public.updates(id) on delete cascade,
  author      text not null,             -- ใครกดรีแอกชัน (ชื่อเล่น)
  emoji       text not null,
  created_at  timestamptz default now(),
  unique (update_id, author, emoji)      -- 1 คน/1 อิโมจิ/1 โพสต์ (กดสลับ)
);

-- ---------- ตาราง: คอมเมนต์ของอัพเดท ----------
create table if not exists public.update_comments (
  id          uuid primary key default gen_random_uuid(),
  update_id   uuid references public.updates(id) on delete cascade,
  author      text not null,             -- ชื่อเล่นของคนคอมเมนต์
  text        text not null,
  created_at  timestamptz default now()
);

-- ---------- เปิด Row Level Security ----------
alter table public.updates          enable row level security;
alter table public.update_reactions enable row level security;
alter table public.update_comments  enable row level security;

-- ---------- นโยบาย: เฉพาะคนที่ล็อกอินแล้วเท่านั้น อ่าน/เขียนได้ ----------
drop policy if exists "auth all updates"   on public.updates;
drop policy if exists "auth all reactions" on public.update_reactions;
drop policy if exists "auth all comments"  on public.update_comments;

create policy "auth all updates"   on public.updates          for all to authenticated using (true) with check (true);
create policy "auth all reactions" on public.update_reactions for all to authenticated using (true) with check (true);
create policy "auth all comments"  on public.update_comments  for all to authenticated using (true) with check (true);

-- ---------- เปิด Realtime (ทุกคนเห็นอัปเดตสด) ----------
-- (ถ้าตารางถูก add ไว้แล้วจะ error เบา ๆ — ข้ามได้)
alter publication supabase_realtime add table public.updates;
alter publication supabase_realtime add table public.update_reactions;
alter publication supabase_realtime add table public.update_comments;

-- ---------- Storage: ที่เก็บรูปของไดอารี่ ----------
insert into storage.buckets (id, name, public)
values ('feed', 'feed', true)
on conflict (id) do nothing;

drop policy if exists "feed read"   on storage.objects;
drop policy if exists "feed upload" on storage.objects;

create policy "feed read"   on storage.objects for select using (bucket_id = 'feed');
create policy "feed upload" on storage.objects for insert to authenticated with check (bucket_id = 'feed');

-- เสร็จแล้ว ✅
