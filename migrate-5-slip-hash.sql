-- ============================================================
--  เป้าเงิน — กันส่งสลิปซ้ำจาก "ตัวรูปสลิป" (hash) — เชื่อถือได้แม้ OCR อ่านไม่ออก
--  วางใน Supabase → SQL Editor → New query → Run (รันซ้ำได้ปลอดภัย)
-- ============================================================

alter table public.contributions add column if not exists slip_hash text;

create unique index if not exists contributions_slip_hash_uniq
  on public.contributions (slip_hash) where slip_hash is not null;

-- เสร็จแล้ว ✅
