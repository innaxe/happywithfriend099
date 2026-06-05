-- ============================================================
--  เป้าเงิน — ทำให้ Discord Webhook เป็นค่า "ส่วนกลาง" (ใช้ร่วมทั้งกลุ่ม)
--  เดิมเก็บใน localStorage ต่อเครื่อง → เพื่อนต้องตั้งเองทุกคน
--  ใหม่: เก็บในตารางกลาง ตั้งครั้งเดียว ทุกคนใช้ร่วมกัน
--  วางใน Supabase → SQL Editor → New query → Run (รันซ้ำได้ปลอดภัย)
-- ============================================================

create table if not exists public.app_settings (
  id              text primary key default 'global',
  discord_savings text default '',   -- webhook ห้องประวัติออมเงิน
  discord_diary   text default '',   -- webhook ห้องไดอารี่
  updated_at      timestamptz default now()
);

-- มีแถวเดียว id='global'
insert into public.app_settings (id) values ('global')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "settings read"   on public.app_settings;
drop policy if exists "settings insert" on public.app_settings;
drop policy if exists "settings update" on public.app_settings;

-- ทุกคนที่ล็อกอินอ่าน/แก้ได้ (กลุ่มเพื่อนเชื่อใจกัน)
create policy "settings read"   on public.app_settings for select to authenticated using (true);
create policy "settings insert" on public.app_settings for insert to authenticated with check (true);
create policy "settings update" on public.app_settings for update to authenticated using (true) with check (true);

-- เปิด realtime: ใครตั้ง webhook เครื่องอื่นเห็นทันที
alter publication supabase_realtime add table public.app_settings;

-- เสร็จแล้ว ✅
