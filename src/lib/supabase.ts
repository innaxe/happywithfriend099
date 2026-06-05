import { createClient } from "@supabase/supabase-js";

// ค่า fallback เป็นค่าสาธารณะของโปรเจกต์ (anon key ปลอดภัยฝั่ง client + ใช้คู่ RLS)
// ใน production ให้ตั้งผ่าน env บน Vercel
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://sronrfhcsvfsxqhowohv.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb25yZmhjc3Zmc3hxaG93b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTcyMzQsImV4cCI6MjA5NjEzMzIzNH0.zzFBXvCFWYlURqUHDUmGP3H4RlwkZf0f8KHVY3qGpnQ";

// ออปชัน auth สำหรับ OAuth แบบ SPA (Discord) — PKCE + อ่าน session จาก URL หลัง redirect กลับ
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
