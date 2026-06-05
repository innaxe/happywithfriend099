# เริ่มที่นี่ — วิธีไปต่อใน Claude Code

ในโฟลเดอร์นี้มี: `CLAUDE.md`, `SPEC.md`, `supabase-setup.sql`, `reference-app.html` (ต้นแบบที่ใช้งานได้)

## ขั้นตอน

1) ติดตั้ง Node.js (เวอร์ชัน LTS) จาก nodejs.org

2) ติดตั้ง Claude Code:
   ```
   npm install -g @anthropic-ai/claude-code
   ```

3) สร้างโฟลเดอร์โปรเจกต์ แล้ว**เอาไฟล์ทั้งหมดในชุดนี้ไปวางในโฟลเดอร์นั้น** เช่น:
   ```
   mkdir pao-ngern && cd pao-ngern
   # คัดลอก CLAUDE.md, SPEC.md, supabase-setup.sql, reference-app.html มาไว้ที่นี่
   ```

4) เปิด terminal ในโฟลเดอร์ แล้วรัน:
   ```
   claude
   ```

5) วาง prompt แรกนี้:

---
อ่าน CLAUDE.md และ SPEC.md ในโฟลเดอร์นี้ก่อน แล้วดู reference-app.html เป็นต้นแบบ
จากนั้น scaffold โปรเจกต์ใหม่ด้วย Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
ต่อ Supabase (ค่า config อยู่ใน CLAUDE.md ให้ใส่ใน .env.local)
ทำฟีเจอร์ตาม SPEC.md ให้ครบ: หน้ารหัสผ่านกลุ่ม, หลายเป้าหมาย, รายชื่อคน, บันทึกยอด+แนบสลิป(ขึ้น Storage),
แจ้ง Discord webhook, realtime sync, dashboard (วงแหวน/ชิป/การ์ดรายคน/กราฟ/ตาราง/ประวัติ)
คงดีไซน์โทน Light Fintech เดิม ทำทีละส่วนและให้ npm run build ผ่านทุกครั้ง
สุดท้ายเขียนวิธี deploy ขึ้น Vercel
---

## หมายเหตุ
- **รหัสผ่านกลุ่ม** (ของบัญชี bankthgg175@gmail.com) ไม่ได้อยู่ในไฟล์ — ใช้ตอนทดสอบล็อกอินเอง
- Supabase schema รันไว้แล้ว ถ้าจะรันซ้ำ/ดู โครงสร้างอยู่ใน supabase-setup.sql
- Deploy แนะนำ Vercel (ฟรี): push repo ขึ้น GitHub → import ที่ vercel.com → ใส่ env 2 ตัว → Deploy
- prototype ปัจจุบันยังออนไลน์อยู่ที่ https://innaxe.github.io/savings-goals/ (ใช้อ้างอิงหน้าตา/การทำงาน)
