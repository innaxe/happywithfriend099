-- ============================================================
--  เป้าเงิน — ไฟล์ที่ 2: เปิดล็อก "โพสต์ในชื่อตัวเองเท่านั้น"
--  *** รันทีหลัง *** หลังจากคนที่โพสต์ไดอารี่ล็อกอิน Discord + เลือกชื่อแล้ว
--  วิธีรัน: Supabase → SQL Editor → New query → วางทั้งไฟล์ → Run
--  ปลอดภัย: ของเก่าไม่กระทบ · ทุกคนยังอ่านเห็นเหมือนเดิม · รันซ้ำได้
--  ถ้าอยากถอยกลับ: ดูท้ายไฟล์
-- ============================================================

-- updates (โพสต์ไดอารี่) -------------------------------------
drop policy if exists "auth all updates" on public.updates;
create policy "updates read"   on public.updates for select to authenticated using (true);
create policy "updates insert" on public.updates for insert to authenticated
  with check (author = public.my_nick());
create policy "updates update" on public.updates for update to authenticated
  using (author = public.my_nick()) with check (author = public.my_nick());
create policy "updates delete" on public.updates for delete to authenticated
  using (author = public.my_nick());

-- คอมเมนต์ ---------------------------------------------------
drop policy if exists "auth all comments" on public.update_comments;
create policy "comments read"   on public.update_comments for select to authenticated using (true);
create policy "comments insert" on public.update_comments for insert to authenticated
  with check (author = public.my_nick());
create policy "comments update" on public.update_comments for update to authenticated
  using (author = public.my_nick()) with check (author = public.my_nick());
create policy "comments delete" on public.update_comments for delete to authenticated
  using (author = public.my_nick());

-- รีแอกชัน ---------------------------------------------------
drop policy if exists "auth all reactions" on public.update_reactions;
create policy "reactions read"   on public.update_reactions for select to authenticated using (true);
create policy "reactions insert" on public.update_reactions for insert to authenticated
  with check (author = public.my_nick());
create policy "reactions delete" on public.update_reactions for delete to authenticated
  using (author = public.my_nick());

-- เสร็จไฟล์ที่ 2 ✅ ตั้งแต่นี้ใครปลอมเป็นคนอื่นจะโดน DB ปฏิเสธ
-- (เงิน/contributions ปล่อยเปิดไว้ตามตั้งใจ เพราะมีสลิปเป็นหลักฐาน)

-- ============================================================
-- ถ้าจะถอยกลับ (ปลดล็อก ไดอารี่รับ author อะไรก็ได้เหมือนเดิม) วางอันนี้แล้ว Run:
--   drop policy if exists "updates insert"   on public.updates;
--   drop policy if exists "updates update"   on public.updates;
--   drop policy if exists "updates delete"   on public.updates;
--   drop policy if exists "comments insert"  on public.update_comments;
--   drop policy if exists "comments update"  on public.update_comments;
--   drop policy if exists "comments delete"  on public.update_comments;
--   drop policy if exists "reactions insert" on public.update_reactions;
--   drop policy if exists "reactions delete" on public.update_reactions;
--   create policy "auth all updates"   on public.updates          for all to authenticated using (true) with check (true);
--   create policy "auth all comments"  on public.update_comments  for all to authenticated using (true) with check (true);
--   create policy "auth all reactions" on public.update_reactions for all to authenticated using (true) with check (true);
-- ============================================================
