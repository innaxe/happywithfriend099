# SPEC — ฟีเจอร์ละเอียด (เป้าเงิน)

อ้างอิงตรรกะ/ดีไซน์จริงได้จาก `reference-app.html` (prototype ที่ใช้งานได้)

## 1) Auth gate (รหัสผ่านกลุ่ม)
- เปิดแอปครั้งแรกเจอหน้าใส่รหัสผ่านกลุ่ม → `signInWithPassword({ email: SHARED_EMAIL, password })`
- ผิด → ขึ้น "รหัสผ่านไม่ถูกต้อง" · ถูก → เข้าแอป (session ค้างไว้)
- มีปุ่มออกจากระบบ (signOut)

## 2) เป้าหมาย (goals) — ตาราง `goals`
- หลายเป้าได้ · มีแถบสลับเป้าด้านบน (chip โชว์ %, ยอดสะสม)
- สร้าง/แก้/ลบ ผ่าน modal
- ฟิลด์: name, emoji, accent (สีธีม hex), currency (ดีฟอลต์ ฿), target (ยอดรวม),
  start_month + end_month (YYYY-MM), members (text[] = ชื่อเล่น)
- โหมด: "กลุ่ม" (เลือกสมาชิกหลายคน) / "เดี่ยว" (members = ["ฉัน"])
- ลบเป้า → ลบ contributions ของเป้านั้นด้วย (cascade)

## 3) รายชื่อคน (people roster) — ตาราง `people`
- คลังกลาง ใช้ข้ามทุกเป้า · ฟิลด์: nick (ชื่อเล่น), real (ชื่อจริงตามสลิป)
- จัดการได้จาก **ปุ่มรายชื่อคนบน header** (modal แยก: เพิ่ม/แก้ชื่อจริง/ลบ)
- ตอนสร้างเป้า: โชว์รายชื่อเป็น chip ให้ "แตะเลือก" (ไม่ต้องพิมพ์)
- ชื่อจริงใช้ตอนแจ้ง Discord (ตามสลิป) · ในแอปโชว์ชื่อเล่น

## 4) รายการออม (contributions) — ตาราง `contributions`
- ฟิลด์: goal_id, name (ชื่อเล่น), month (YYYY-MM), amount, note, slip_url
- ฟอร์มเพิ่ม: เลือกคน + เดือน + จำนวน + หมายเหตุ + **แนบสลิป (ไฟล์รูป)**
- สลิป → อัปขึ้น Supabase Storage bucket `slips` → ได้ public URL เก็บใน slip_url
- ลบรายการได้

## 5) แจ้งเตือน Discord (webhook)
- เก็บ webhook URL ต่อเครื่อง (localStorage) ตั้งในหน้า "แชร์ & ตั้งค่า"
- เวลาเพิ่มยอดสำเร็จ → POST embed เข้า webhook:
  - title: `✅ {ชื่อจริง||ชื่อเล่น} โอนแล้ว {ยอด}`
  - description: `{emoji} {ชื่อเป้า} · งวด {เดือนไทย} · ชื่อเล่น {nick} · {note}`
  - field: ยอดสะสม `{saved} / {target} ({pct}%)`
  - ถ้ามีสลิป: `embed.image.url = slip_url`
- (โพสต์จาก client ตรงไป Discord ได้ — Discord รองรับ CORS, ทดสอบแล้วได้ HTTP 204/200)

## 6) Realtime
- subscribe `postgres_changes` ทั้ง 3 ตาราง → refetch + re-render (debounce ~400ms)
- ทุกคนเห็นการเปลี่ยนแปลงสดพร้อมกัน

## 7) Dashboard (หน้าหลักเมื่อมีเป้า)
- **Hero**: วงแหวน % + ยอดสะสมตัวใหญ่ + "จาก {target} · ภายใน {เดือน}" + แถบ pace
  - pace: ถ้ายังไม่ถึงเป้า → "ออมต่ออีก {remaining/เดือนที่เหลือ}/เดือน ก็ทันเป้า" (กลุ่ม = หารจำนวนคน)
- **3 ชิป**: 
  - กลุ่ม: [ต่อคน/เดือน = target/คน/จำนวนเดือน] · [เก็บตามเป้า X/Y คน] · [เดือนที่เหลือ]
  - เดี่ยว: [แผน/เดือน = target/จำนวนเดือน] · [เหลืออีก {remaining}] · [เดือนที่เหลือ]
- **การ์ดรายคน** (โหมดกลุ่ม): avatar + ชื่อ + badge (ครบ/ตามเป้า/ตามอีก X) + progress bar + ยอด/เป้าต่อคน
- **กราฟ**: เส้นเงินสะสมจริง (สะสมรายเดือน) เทียบเส้นเป้าที่ควรถึง (linear) + จุดล่าสุด
- **ตารางรายเดือน**: แถว=เดือน, คอลัมน์=สมาชิก, ติ๊กถูกถ้าจ่ายครบยอด/เดือน (= target/คน/จำนวนเดือน)
- **ประวัติล่าสุด**: รายการโอนเรียงใหม่→เก่า + ลิงก์สลิป + ปุ่มลบ
- **Empty state**: ไม่มีเป้า → ปุ่ม "สร้างเป้าหมายแรก"

## 8) สูตรคำนวณ (พอร์ตจาก reference-app.html)
- `tallies`: รวมยอดต่อคน + ยอดรวม
- `monthsBetween(s,e)`: (ey-sy)*12+(em-sm)+1 (อย่างน้อย 1)
- `elapsedMonths`: นับเดือนที่ <= เดือนปัจจุบัน
- `leftMonths`: months - elapsed
- per-person target = target / จำนวนสมาชิก
- expectedPer = perPersonTarget * elapsed / months (ใช้เช็ก on-track)
- ป้ายเดือนไทย + ปี พ.ศ. 2 หลัก (เช่น "ก.ค. 69")

## 9) ดีไซน์
- ดู CSS เต็มใน reference-app.html (โทน Light Fintech)
- มือถือเป็นหลัก (กว้างสุด ~460px), ขอบโค้ง ~14-16px, การ์ดขอบ 1px + เงานุ่ม
- แนะนำใช้ shadcn/ui + Tailwind ทำให้เนี้ยบขึ้น แต่คงโทน/สีเดิม

## 10) Deploy
- Vercel: import repo → ใส่ env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) → deploy
- (เลือกได้: ทำเป็น PWA เพิ่ม manifest + service worker เพื่อ "ติดตั้งหน้าจอ")
