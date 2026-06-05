-- ============================================================
--  เป้าเงิน — กันส่งสลิปซ้ำ (เก็บเลขที่รายการของสลิป + ห้ามซ้ำ)
--  วางใน Supabase → SQL Editor → New query → Run (รันซ้ำได้ปลอดภัย)
-- ============================================================

-- เก็บ "เลขที่รายการ/รหัสอ้างอิง" ที่อ่านได้จากสลิป
alter table public.contributions add column if not exists slip_ref text;

-- ห้ามมี ref ซ้ำ (เฉพาะแถวที่มี ref — แถวเก่า/ไม่มี ref ยังเป็น null ได้)
-- ถ้าใครส่งสลิปเดิมซ้ำ insert จะ fail (รหัส 23505) → แอปจะขึ้น "สลิปนี้ถูกใช้ไปแล้ว"
create unique index if not exists contributions_slip_ref_uniq
  on public.contributions (slip_ref) where slip_ref is not null;

-- เสร็จแล้ว ✅
