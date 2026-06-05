# เป้าเงิน (Pao-Ngern) — แอปออมเงินเข้าเป้าแบบกลุ่ม

> ไฟล์นี้ให้ Claude Code อ่านเป็น context หลักของโปรเจกต์

## เป้าหมาย
เว็บแอปช่วยกลุ่มเพื่อนออมเงินให้ถึงเป้า (เช่น ทริปญี่ปุ่นที่เก็บหลายปี) ทุกคนเห็นข้อมูลตรงกัน
เวลาใครโอนเงินก็บันทึก + แนบสลิป แล้วระบบแจ้งเข้า Discord ให้อัตโนมัติ

มีเวอร์ชันต้นแบบ (prototype) ทำไว้แล้วเป็น HTML ไฟล์เดียว ดูได้ที่ `reference-app.html`
**งานนี้คือเขียนใหม่ให้เป็นโปรเจกต์มาตรฐานมืออาชีพ** โดยคงฟีเจอร์/ดีไซน์เดิมไว้ทั้งหมด

## สแต็คที่ใช้ (มาตรฐานมืออาชีพปัจจุบัน)
- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Storage + Realtime) — ตั้งค่าไว้แล้ว
- Deploy: **Vercel** (ฟรี ต่อ GitHub แล้ว auto-build)
- State ฝั่ง client: React hooks / Context (หรือ Zustand ถ้าจำเป็น)

## Supabase (ตั้งค่าไว้แล้ว — ใช้ได้เลย)
- Project URL: `https://sronrfhcsvfsxqhowohv.supabase.co`
- anon public key:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb25yZmhjc3Zmc3hxaG93b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTcyMzQsImV4cCI6MjA5NjEzMzIzNH0.zzFBXvCFWYlURqUHDUmGP3H4RlwkZf0f8KHVY3qGpnQ`
  (ปลอดภัย ใส่ใน client ได้ ใช้คู่กับ RLS — เก็บใน `.env.local` เป็น `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- schema + RLS + storage bucket **รันไว้แล้ว** ดูที่ `supabase-setup.sql` (ตาราง: people, goals, contributions; bucket: slips)
- **service_role key ห้ามใส่ในโค้ด client เด็ดขาด**

## ระบบล็อกอิน (Discord OAuth — ยืนยันตัวตนจริง)
แต่ละคนล็อกอินด้วย **Discord ของตัวเอง** (`supabase.auth.signInWithOAuth({ provider: 'discord' })`)
- ผูก `auth.uid()` ↔ 1 ชื่อใน `people` (คอลัมน์ `auth_id`) — ครั้งแรกมีหน้า "claim ชื่อ"
- **RLS บังคับ** ว่าโพสไดอารี่/คอมเมนต์/รีแอกชันได้เฉพาะ `author = my_nick()` (ปลอมเป็นคนอื่นไม่ได้)
- อ่านยังเปิดให้ทุก `authenticated` · เงิน(contributions) ยังเปิด (มีสลิป)
- ตั้งค่า + rollout: ดู `DISCORD-AUTH-SETUP.md` · SQL: `migrate-discord-auth.sql` (PART A–D)
- *(ระบบเดิม "รหัสผ่านกลุ่มร่วม" + `SHARED_EMAIL` ถูกเลิกใช้แล้ว)*

## ดีไซน์ (คงโทนเดิม — "Light Fintech")
- พื้น `#f5f6f8`, การ์ดขาวขอบบาง `#e8ebef`, ตัวอักษร `#0f172a`
- Accent หลัก เขียวมรกต `#059669` (แต่ละเป้าตั้งสีเองได้)
- ฟอนต์ Inter (ตัวเลข/อังกฤษ) + IBM Plex Sans Thai (ไทย), ตัวเลข tabular-nums
- มินิมอล ขอบบาง เงานุ่ม ตัวเลขใหญ่คม

## คำสั่ง
- dev: `npm run dev` · build: `npm run build`
- ก่อน commit: `npm run lint` + `npm run build` ต้องผ่าน

## หลักการทำงาน
- เริ่มจากอ่าน `SPEC.md` (ฟีเจอร์ละเอียด) + `reference-app.html` (ตรรกะ/ดีไซน์อ้างอิง)
- ทำทีละส่วน ทดสอบ build ผ่านทุกครั้ง
- ไม่ commit secret · ใช้ env vars · พึ่ง RLS
