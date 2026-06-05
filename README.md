# เป้าเงิน (Pao-Ngern) — แอปออมเงินเข้าเป้าแบบกลุ่ม

เว็บแอปช่วยกลุ่มเพื่อนออมเงินให้ถึงเป้า (เช่น ทริปญี่ปุ่น, iPhone) ทุกคนเห็นข้อมูลตรงกันแบบเรียลไทม์
เวลาใครโอนก็บันทึก + แนบสลิป แล้วระบบแจ้งเข้า Discord ให้อัตโนมัติ

> เขียนใหม่จาก prototype HTML ให้เป็นโปรเจกต์มาตรฐาน แล้ว **re-skin ตามดีไซน์ใหม่จาก Claude Design**
> (โทน "Light Fintech" — วงแหวนใหญ่, การ์ดสลับเป้าแบบ mini-ring, ฟอร์มเลือกคนด้วย avatar, bottom-sheet modals)

### ฟีเจอร์เด่น
- **เป้าหมายกลุ่ม** — วงแหวนความคืบหน้า, การ์ดรายคน, กราฟแผน vs จริง, สรุปรายเดือน, ประวัติ
- **ไดอารี่กลุ่ม** (แท็บล่าง) — โพสต์เล่าว่าไปไหนทำอะไร + แนบรูป, กด **อิโมจิรีแอกชัน**, **คอมเมนต์**
- **ฉลองหมุดหมาย** — ยอดสะสมแตะ 25/50/75/100% → confetti ในแอป + แจ้ง Discord
- **เตือนงวดเดือนนี้** — แบนเนอร์โชว์คนที่ยังไม่โอน + ปุ่มเตือนเข้า Discord
- บันทึกการออม + แนบสลิป + แจ้ง Discord อัตโนมัติ · realtime ทุกคนเห็นพร้อมกัน

## สแต็ค

- **Next.js 16** (App Router) + **TypeScript** + **React 19** (build ด้วย Turbopack)
- **Tailwind CSS v4** + **design system แบบ CSS เอง** (โทน Light Fintech ใน `globals.css`) — ไอคอนเส้นบางพอร์ตเอง
- **Supabase** — Postgres + Auth + Storage + Realtime (ฝั่ง client ล้วน ใช้คู่ RLS)
- Deploy: **Vercel**

## โครงสร้าง

```
src/
  app/
    layout.tsx        # fonts (IBM Plex Sans Thai หลัก + Inter สำหรับตัวเลข), metadata, viewport
    page.tsx          # render <AppRoot/>
    globals.css       # design system "Light Fintech" (tokens + .card/.btn/.input/.sheet/.toast ฯลฯ)
  lib/
    types.ts          # Person / Goal / Contribution / Update / Reaction / Comment (+ แถวดิบ DB)
    constants.ts      # SHARED_EMAIL, ME_KEY, REACTIONS, MILESTONES, THMON, AV, THEMES, EMOJIS, CURRENCIES
    supabase.ts       # browser client
    calc.ts           # สูตร: deriveGoalStats, monthlySummary, chartSeries, crossedMilestones, unpaidThisMonth, relativeTime
    discord.ts        # ส่ง embed: notifyDiscord / notifyUpdate / notifyMilestone / notifyNudge + test
  components/
    app-root.tsx      # auth gate vs dashboard (+ onAuthStateChange)
    pao-provider.tsx  # state + actions + realtime + toast + meNick + celebration (context)
    icon.tsx          # ชุดไอคอนเส้นบาง · primitives.tsx (Avatar/Ring/MiniRing/Pbar/Badge/LineChart/SectionHead)
    sheet.tsx         # bottom-sheet modal · toast-host.tsx · busy-indicator.tsx
    header.tsx, goal-bar.tsx, hero.tsx, stat-chips.tsx, contribution-form.tsx,
    member-cards.tsx, savings-chart.tsx (ChartCard), monthly-grid.tsx (MonthTable),
    history-list.tsx (Activity), dashboard.tsx (+ แท็บล่าง), auth-gate.tsx
    feed.tsx          # ไดอารี่กลุ่ม: เลือกตัวตน + ช่องโพสต์+รูป + รีแอกชัน + คอมเมนต์
    nudge-banner.tsx  # แบนเนอร์เตือนคนยังไม่โอนงวดเดือนนี้
    celebrate.tsx     # overlay confetti ฉลองหมุดหมาย
    dialogs/{goal-editor (GoalModal), people-dialog (MembersModal), share-dialog (SettingsModal)}.tsx
reference/reference-app.html   # prototype ดั้งเดิม
supabase-setup.sql             # schema เต็ม (รวมไดอารี่) + RLS + storage
supabase-feed.sql              # migration เฉพาะส่วนไดอารี่ (รันเพิ่มบน DB เดิม)
```

## รันในเครื่อง (local)

1. ติดตั้ง dependencies
   ```bash
   npm install
   ```
2. สร้างไฟล์ `.env.local` (มีให้แล้วในชุดนี้ — ถ้าไม่มีให้ก็อปจาก `.env.example`)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://sronrfhcsvfsxqhowohv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   # anon key ปลอดภัยฝั่ง client (ใช้คู่ RLS)
   ```
3. ตั้งค่า **Discord OAuth** (ครั้งเดียว) ตาม `DISCORD-AUTH-SETUP.md` + รัน `migrate-discord-auth.sql`
4. รัน dev server
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000 → **เข้าสู่ระบบด้วย Discord** → เลือกชื่อตัวเองในกลุ่ม (ครั้งแรก)

## คำสั่ง

```bash
npm run dev      # โหมดพัฒนา
npm run build    # production build (ต้องผ่านก่อน deploy)
npm run start    # รัน production build ในเครื่อง
npm run lint     # ESLint (ต้องผ่านก่อน commit)
```

## ฐานข้อมูล (Supabase)

Schema + RLS + Storage bucket รันไว้แล้ว ดูได้ที่ `supabase-setup.sql`
- ตาราง: `people` (nick, real), `goals` (target, start_month, end_month, members[], …), `contributions` (goal_id, name, month, amount, note, slip_url)
- ไดอารี่: `updates` (goal_id, author, text, image_url), `update_reactions` (update_id, author, emoji — unique ต่อคน/อิโมจิ/โพสต์), `update_comments` (update_id, author, text)
- RLS: เฉพาะ role `authenticated` อ่าน/เขียนได้
- Storage bucket `slips` (รูปสลิป) + `feed` (รูปไดอารี่) — public ทั้งคู่
- รูปถูก **บีบอัดฝั่ง browser ก่อนอัป** (`src/lib/image.ts` · ย่อ ≤1600px, JPEG q0.8 → ~150–400KB/รูป) เพื่อประหยัดพื้นที่ 1GB
- ลบเป้า → ลบ contributions + updates ของเป้านั้นด้วย (FK `on delete cascade`); ลบ update → ลบ reactions/comments
- เปิด Realtime ไว้ทุกตาราง

ตั้ง Supabase ใหม่จากศูนย์: SQL Editor → New query → วาง `supabase-setup.sql` → Run
**อัปจาก DB เดิมที่ยังไม่มีไดอารี่:** วาง `supabase-feed.sql` → Run (รันครั้งเดียว ปลอดภัยถ้ารันซ้ำ)

## แจ้งเตือน Discord

ตั้งครั้งเดียวต่อเครื่อง (เก็บใน `localStorage`) ที่หน้า **"แชร์ & ตั้งค่า"**
1. ในห้อง Discord: แก้ไขห้อง → Integrations → Webhooks → New Webhook → Copy URL
2. วาง URL ในแอป → บันทึก
เวลาเพิ่มยอด ระบบจะ POST embed (ใครโอน + ยอด + งวด + ยอดสะสม + รูปสลิป) เข้าห้อง

## Deploy ขึ้น Vercel

1. **Push โค้ดขึ้น GitHub**
   ```bash
   git init            # ถ้ายังไม่ใช่ git repo
   git add .
   git commit -m "เป้าเงิน: Next.js app"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
   > `.gitignore` กัน `node_modules`, `.next`, และ `.env*` ให้แล้ว — secret จะไม่ถูก push

2. **Import เข้า Vercel**
   - ไปที่ https://vercel.com/new → เลือก repo ที่เพิ่ง push
   - Framework Preset: Vercel จะตรวจเจอ **Next.js** อัตโนมัติ (Build = `next build`, Output ปกติ)

3. **ตั้ง Environment Variables** (Project → Settings → Environment Variables) ใส่ค่าเดียวกับ `.env.local`:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://sronrfhcsvfsxqhowohv.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key เต็ม) |

   > ค่า `NEXT_PUBLIC_*` ถูก inline ตอน **build** — ถ้าแก้ env ต้อง **redeploy** ใหม่
   > หลัง deploy: เพิ่ม URL จริงใน Supabase → Auth → URL Configuration (Site URL + Redirect `…/**`)

4. กด **Deploy** → รอ build เสร็จ ได้ URL ใช้งานได้เลย ทุกครั้งที่ push ขึ้น `main` Vercel จะ auto-build ให้

### หมายเหตุ
- ล็อกอินด้วย **Discord OAuth** (ตัวตนจริง) — ตั้งค่าตาม `DISCORD-AUTH-SETUP.md`, RLS บังคับโพสในชื่อตัวเอง
- ไม่มีการใช้ `service_role` key ที่ไหนเลย — ความปลอดภัยพึ่ง RLS ของ Supabase
- (ออปชัน) ทำเป็น PWA ติดตั้งหน้าจอได้ โดยเพิ่ม `app/manifest.ts` + ไอคอน ภายหลัง
