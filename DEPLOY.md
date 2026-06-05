# Deploy เป้าเงิน ขึ้น Vercel (ให้ทั้งกลุ่มใช้จริง)

เช็กลิสต์ตามลำดับ — ทำครั้งเดียว แล้วหลังจากนั้น push ขึ้น `main` Vercel จะ build ให้เองอัตโนมัติ

---

## 1) Import เข้า Vercel
1. ไป https://vercel.com/new → **Login ด้วย GitHub**
2. เลือก repo **`innaxe/happywithfriend099`** → **Import**
3. Framework ตรวจเจอ **Next.js** อัตโนมัติ (ไม่ต้องแก้ Build/Output)

## 2) ตั้ง Environment Variables (ตอน import หรือ Project → Settings → Environment Variables)
| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sronrfhcsvfsxqhowohv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key เต็ม — ดูใน `.env.local` หรือ Supabase → Settings → API) |

> ค่า `NEXT_PUBLIC_*` ถูก inline ตอน build — ถ้าแก้ทีหลังต้อง **redeploy**
> (จริง ๆ มี fallback ฝังใน `src/lib/supabase.ts` อยู่แล้ว — **ถ้าไม่อยากเสี่ยงวางคีย์ไม่ครบ ข้ามขั้นนี้/ลบ env ไปเลยก็ได้** แอปจะใช้ค่าที่ฝังไว้)
>
> ⚠️ **กับดักที่เจอจริง:** ถ้า anon key ที่วางใน Vercel **ไม่ครบ/ถูกตัดหาง** → ล็อกอินบนเว็บจริงจะขึ้น `GET /auth/v1/user 401` (แต่ localhost ใช้ได้เพราะใช้ค่า fallback) · แก้: **ลบ env `NEXT_PUBLIC_SUPABASE_ANON_KEY` ออก แล้ว Redeploy** (ให้ใช้ fallback ที่ถูกต้อง) หรือวางคีย์เต็ม ~218 ตัวลงท้าย `...zqGpnQ`

## 3) กด Deploy → ได้ URL จริง
เช่น `https://happywithfriend099.vercel.app` — **จดไว้ใช้ขั้นต่อไป**

## 4) ⚠️ ต่อ Discord OAuth กับ URL จริง (ขั้นที่คนพลาดบ่อยสุด)
Supabase → **Authentication → URL Configuration**:
- **Site URL** → เปลี่ยนเป็น URL จริงจากข้อ 3 (เช่น `https://happywithfriend099.vercel.app`)
- **Redirect URLs** → กด Add: `https://happywithfriend099.vercel.app/**`
  - (เก็บ `http://localhost:3000/**` ไว้ด้วย เผื่อ dev ต่อ)

> ถ้าไม่ทำข้อนี้: กดล็อกอิน Discord บนเว็บจริงแล้วจะเด้งกลับมาเข้าไม่ได้ ("invalid redirect")
> *ไม่ต้องแก้ใน Discord Developer Portal* — callback ที่นั่นชี้ไป Supabase อยู่แล้ว ไม่เปลี่ยน

## 5) เปิดล็อกกันปลอมชื่อ (ถ้ายังไม่ได้รัน)
Supabase → SQL Editor → รัน **`migrate-2-lock.sql`** (หลังคนที่โพสต์ไดอารี่ล็อกอิน+ตั้งชื่อแล้ว)

## 6) ตั้ง Discord Webhook (ต่อเครื่อง)
เปิดเว็บจริง → เฟือง ⚙️ → วาง Webhook 2 ห้อง (ออมเงิน / ไดอารี่) → กดทดสอบ
> webhook เก็บใน localStorage ต่อเครื่อง — ตั้งที่เครื่องที่จะให้ยิงแจ้งเตือน (เช่นเครื่องเจ้าของ)

## 7) ส่งให้เพื่อน
ส่ง URL จริง → เพื่อน "เข้าด้วย Discord → ตั้งชื่อตัวเอง" → ใช้ได้เลย
(อย่าลืมเชิญทุกคนเข้า Discord server ด้วย)

---

## อัปเดตแอปหลัง deploy
แก้โค้ด → `npm run lint && npm run build` ผ่าน → `git push` → Vercel build ใหม่ให้เองทุกครั้ง
