"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icon } from "./icon";

/** โลโก้ Discord (รูปทึบ) สำหรับปุ่มล็อกอิน */
export function DiscordMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

/** หน้าล็อกอิน — เข้าด้วยบัญชี Discord ของแต่ละคน (ตัวตนจริง) */
export function DiscordLogin() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function login() {
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        scopes: "identify email",
        redirectTo: window.location.origin,
      },
    });
    // สำเร็จ = redirect ออกไป Discord ทั้งหน้า (ไม่ต้องทำอะไรต่อ)
    if (error) {
      setErr("เปิด Discord ไม่สำเร็จ: " + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div
        className="app-scroll"
        style={{ display: "flex", flexDirection: "column", padding: "40px 26px 26px" }}
      >
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}
        >
          <div className="col appear" style={{ alignItems: "center", gap: 18, textAlign: "center" }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 22,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(150deg,#10b981,#047857)",
                boxShadow: "0 8px 22px rgba(5,150,105,.32)",
              }}
            >
              <Icon name="target" size={38} color="#fff" sw={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 27, fontWeight: 750, letterSpacing: "-.02em" }}>
                เป้าเงิน
              </div>
              <div className="muted" style={{ fontSize: 14.5, marginTop: 5, lineHeight: 1.5 }}>
                ออมเงินเข้าเป้าหมายร่วมกัน
                <br />
                เห็นความคืบหน้าตรงกันทุกคน
              </div>
            </div>
          </div>

          <div className="card appear" style={{ padding: 20, animationDelay: ".06s" }}>
            <button
              className="btn btn-block"
              style={{
                background: "#5865F2",
                color: "#fff",
                fontWeight: 700,
                boxShadow: "0 1px 2px rgba(88,101,242,.25), 0 6px 16px rgba(88,101,242,.28)",
              }}
              disabled={loading}
              onClick={login}
            >
              {loading ? (
                "กำลังเปิด Discord…"
              ) : (
                <>
                  <DiscordMark size={20} /> เข้าสู่ระบบด้วย Discord
                </>
              )}
            </button>

            <div
              style={{
                minHeight: 18,
                marginTop: 10,
                textAlign: "center",
                color: "var(--rose)",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {err}
            </div>

            <div
              className="row"
              style={{ justifyContent: "center", gap: 7, marginTop: 2, color: "var(--muted-2)", fontSize: 12 }}
            >
              <Icon name="lock" size={13} /> ยืนยันตัวตนจริง · โพสต์ในชื่อตัวเองเท่านั้น
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
