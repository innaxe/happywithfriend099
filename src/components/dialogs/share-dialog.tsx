"use client";

import { useState } from "react";
import { usePao } from "../pao-provider";
import { Sheet } from "../sheet";
import { Icon } from "../icon";

export function ShareDialog() {
  const { shareOpen, setShareOpen } = usePao();
  return (
    <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="แชร์ & ตั้งค่า">
      <SettingsBody />
    </Sheet>
  );
}

function SettingsBody() {
  const { logout, showToast } = usePao();
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" ? window.location.origin : "paongern.app";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("คัดลอกไม่ได้", "error");
    }
  }

  return (
    <>
      <label className="field-label">ลิงก์เชิญเข้ากลุ่ม</label>
      <div className="row" style={{ gap: 9, marginBottom: 8 }}>
        <div
          className="input num"
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--muted)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {link}
        </div>
        <button
          className="btn btn-soft"
          style={{ padding: "13px 15px", flex: "0 0 auto" }}
          onClick={copy}
          aria-label="คัดลอกลิงก์"
        >
          <Icon name={copied ? "check" : "copy"} size={18} />
        </button>
      </div>
      <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>
        ส่งลิงก์นี้ให้เพื่อน → เข้าด้วย Discord แล้วตั้งชื่อตัวเอง
      </div>

      <hr className="hr" style={{ margin: "4px 0 16px" }} />

      <button
        className="btn btn-block"
        onClick={logout}
        style={{ background: "var(--rose-soft)", color: "var(--rose)", fontWeight: 650 }}
      >
        <Icon name="logout" size={18} /> ออกจากระบบ Discord
      </button>
      <div className="muted" style={{ textAlign: "center", fontSize: 11.5, marginTop: 14 }}>
        เป้าเงิน · เวอร์ชัน 2.0 · ล็อกอินด้วย Discord
      </div>
    </>
  );
}
