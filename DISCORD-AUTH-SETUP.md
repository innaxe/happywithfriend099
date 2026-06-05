# เปลี่ยนระบบล็อกอิน → Discord (ยืนยันตัวตนจริง)

เปลี่ยนจาก "รหัสกลุ่มร่วม 1 บัญชี" → **แต่ละคนล็อกอินด้วย Discord ตัวเอง** และบังคับฝั่งเซิร์ฟเวอร์ (RLS)
ว่า **โพสไดอารี่/คอมเมนต์/รีแอกชันได้เฉพาะในชื่อตัวเอง** — ปลอมเป็นคนอื่นไม่ได้จริง

> เป้าหมาย: `ไปโพสแทนคนอื่นไม่ได้` — ทำได้จริงเพราะตัวตนผูกกับบัญชี Discord ส่วนตัว ไม่ใช่รหัสที่แชร์กัน

---

## ลำดับการ rollout (สำคัญ — อย่าสลับ ไม่งั้นมีคนถูกล็อกเอาต์)

1. ตั้ง Discord OAuth app + เปิด provider ใน Supabase (ข้อ 1–3 ด้านล่าง)
2. รัน SQL **PART A+B+C** (ยังไม่ล็อกใคร)
3. Deploy โค้ดใหม่ → ทุกคนล็อกอิน Discord + เลือกชื่อตัวเอง (claim ครั้งเดียว)
4. พอทุกคน claim ครบ → รัน SQL **PART D** (เปิดการล็อกของจริง)

ไฟล์ SQL: **`migrate-discord-auth.sql`** (รันใน Supabase → SQL Editor · รันซ้ำได้ปลอดภัย)

---

## ขั้นตอนที่ต้องทำเอง

### 1) สร้าง Discord OAuth app
1. เปิด https://discord.com/developers/applications → **New Application** → ตั้งชื่อ เช่น `เป้าเงิน` → **Create**
2. เมนูซ้าย **OAuth2** → หัวข้อ **Redirects** → **Add Redirect** วางลิงก์นี้ให้ตรงเป๊ะ
   (เป็น callback ของ **Supabase** ไม่ใช่ URL แอปเรา):
   ```
   https://sronrfhcsvfsxqhowohv.supabase.co/auth/v1/callback
   ```
   → **Save Changes**
3. หน้า OAuth2 เดิม หัวข้อ **Client information** → คัดลอก **Client ID** และ **Client Secret**
   (ถ้า Secret ซ่อนอยู่ กด **Reset Secret**) — *Secret ใส่แค่ใน Supabase ห้ามใส่ในโค้ด*
   - ไม่ต้องสร้าง bot / ไม่ต้องเปิด intent · scope `identify email` เป็นมาตรฐานอยู่แล้ว

### 2) เปิด Discord provider ใน Supabase
Dashboard → โปรเจกต์ `sronrfhcsvfsxqhowohv` → **Authentication → Sign In / Providers → Discord**
- เปิดสวิตช์ **Enable Sign in with Discord**
- วาง **Client ID** + **Client Secret** จากข้อ 1.3
- ช่อง **Callback URL** ต้องตรงกับที่ใส่ใน Discord
- **Save**

### 3) ตั้ง Site URL + Redirect allow-list (ถ้าพลาด: กดล็อกอินแล้วเงียบ)
Dashboard → **Authentication → URL Configuration**
- **Site URL**: ตอนนี้ตั้ง `http://localhost:3000` ก่อน (พอ deploy Vercel ค่อยเปลี่ยนเป็น URL จริง)
- **Redirect URLs** (กด Add ทุกอัน ต้องมี `/**` ต่อท้าย):
  - `http://localhost:3000/**`
  - `https://<ชื่อแอป>.vercel.app/**`  ← ใส่ตอน deploy จริง

### 4) รัน SQL — PART A+B+C
- เปิด **PRECHECK** ในไฟล์ (uncomment) เช็คว่าไม่มีชื่อเล่นซ้ำใน `people` (ถ้าซ้ำต้องแก้ก่อน)
- รัน **PART A + B + C** (ปลอดภัย ยังไม่ล็อกใคร)
- **ยังไม่รัน PART D**

### 5) ให้ทุกคน claim ชื่อตัวเอง (หลัง deploy โค้ดใหม่)
- เพื่อนเข้าแอป → "เข้าสู่ระบบด้วย Discord" → เลือกชื่อเล่นของตัวเองในหน้า "คุณคือใครในกลุ่ม"
- (กันคนแย่งชื่อ) ถ้ารู้ Discord uid อยู่แล้ว pre-seed ได้:
  ```sql
  update public.people set auth_id = '<auth-uid>' where nick = 'ชื่อเล่น';
  ```
  ดู uid ได้ที่ Authentication → Users

### 6) รัน SQL — PART D (เปิดการล็อก)
- เช็คว่า `auth_id` ของคนที่โพสต์ไดอารี่ผูกครบแล้ว
- รัน **PART D** → ตั้งแต่นี้ใครปลอมเป็นคนอื่นจะโดน DB ปฏิเสธ

### 7) ปิดทางบัญชีรหัสเก่า (ทำครั้งเดียว)
- Authentication → Users → `bankthgg175@gmail.com`: sign out sessions หรือ rotate รหัส
  (**อย่าลบทิ้ง** เผื่อต้อง rollback)
- ลบ env `NEXT_PUBLIC_SHARED_EMAIL` (มีผลรอบ build ถัดไป)

---

## ถ้าจะถอย (rollback)
- **ถอยเฉพาะการล็อก (ไม่ต้อง deploy ใหม่):** ใน SQL Editor drop policy PART D แล้วสร้าง
  `auth all updates/comments/reactions ... using(true) with check(true)` กลับ → ไดอารี่รับ author อะไรก็ได้เหมือนเดิม
- **ถอยกลับรหัสกลุ่มเต็มรูปแบบ:** deploy build เก่า + คืน env `NEXT_PUBLIC_SHARED_EMAIL` + คืน policy `auth all people`
- คอลัมน์/ฟังก์ชันที่เพิ่ม (auth_id, my_nick, claim_nick) ทิ้งไว้ได้ ไม่กระทบของเดิม · ข้อมูลเดิมไม่ถูกแตะ

## สิ่งที่โค้ดจะเปลี่ยน (ผมทำให้)
หน้าล็อกอิน → ปุ่ม "เข้าด้วย Discord" · หน้า "เลือกชื่อตัวเอง" ครั้งแรก · เอา picker "ฉันคือใคร" ออก
(ใช้ชื่อที่ยืนยันแล้วอัตโนมัติ) · โชว์รูปโปรไฟล์ Discord ใน header/ไดอารี่ · ปุ่มลบโพสต์โชว์เฉพาะโพสต์ตัวเอง
