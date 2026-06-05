"use client";

import { useState } from "react";
import { usePao } from "../pao-provider";
import { getWebhook, sendDiscordTest, setWebhook } from "@/lib/discord";
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
  const [hook, setHook] = useState<string>(() => getWebhook());
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const link =
    typeof window !== "undefined" ? window.location.origin : "paongern.app";

  function onHookChange(v: string) {
    setHook(v);
    setWebhook(v.trim());
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("คัดลอกไม่ได้", "error");
    }
  }

  async function test() {
    if (!hook.trim()) {
      showToast("ใส่ Discord Webhook ก่อน", "error");
      return;
    }
    setTesting(true);
    const ok = await sendDiscordTest();
    setTesting(false);
    showToast(
      ok ? "ส่งทดสอบแล้ว — เช็คใน Discord ได้เลย" : "ส่งไม่สำเร็จ ตรวจ URL อีกครั้ง",
      ok ? "success" : "error",
    );
  }

  return (
    <>
      <label className="field-label">ลิงก์เชิญเข้ากลุ่ม</label>
      <div className="row" style={{ gap: 9, marginBottom: 18 }}>
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

      <label className="field-label">Discord Webhook</label>
      <input
        className="input"
        value={hook}
        onChange={(e) => onHookChange(e.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
        style={{ marginBottom: 8, fontSize: 13.5 }}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-soft-2)",
          borderRadius: 12,
          padding: "11px 13px",
          marginBottom: 8,
        }}
      >
        <span style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }}>
          <Icon name="info" size={16} />
        </span>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--accent-ink)" }}>
          ส่งแจ้งเตือนเข้า Discord ทุกครั้งที่มีคนบันทึกการออม — เพื่อน ๆ จะได้เห็นพร้อมกัน
          (ตั้งครั้งเดียวต่อเครื่อง)
        </span>
      </div>
      <button
        className="btn btn-ghost btn-block"
        style={{ marginBottom: 20 }}
        disabled={testing}
        onClick={test}
      >
        <Icon name="bell" size={17} /> {testing ? "กำลังส่ง…" : "ทดสอบส่งแจ้งเตือน"}
      </button>

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
