"use client";

import { useState } from "react";
import { usePao } from "../pao-provider";
import { sendDiscordTest, type Hook } from "@/lib/discord";
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
  const { logout, showToast, webhooks, saveWebhooks } = usePao();
  const [savingsHook, setSavingsHook] = useState<string>(webhooks.savings);
  const [diaryHook, setDiaryHook] = useState<string>(webhooks.diary);
  const [testing, setTesting] = useState<Hook | null>(null);
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

  async function test(kind: Hook, value: string) {
    const url = value.trim();
    if (!url) {
      showToast("ใส่ Discord Webhook ของห้องนี้ก่อน", "error");
      return;
    }
    await saveWebhooks(kind, url); // บันทึกค่ากลางก่อนทดสอบ
    setTesting(kind);
    const ok = await sendDiscordTest(kind, url);
    setTesting(null);
    showToast(
      ok ? "ส่งทดสอบแล้ว — เช็คในห้อง Discord ได้เลย" : "ส่งไม่สำเร็จ ตรวจ URL อีกครั้ง",
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

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-soft-2)",
          borderRadius: 12,
          padding: "11px 13px",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }}>
          <Icon name="info" size={16} />
        </span>
        <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--accent-ink)" }}>
          แยกแจ้งเตือนเป็น 2 ห้อง — <b>บันทึกการออม</b> เข้าห้องประวัติ ·{" "}
          <b>โพสต์ไดอารี่</b> เข้าห้องไดอารี่ (วาง Webhook ของแต่ละห้อง)
          <br />
          <span style={{ color: "var(--accent-ink)", fontSize: 11.5, fontWeight: 600 }}>
            ✅ ตั้งครั้งเดียว ใช้ร่วมกันทั้งกลุ่ม (เก็บส่วนกลาง) — เพื่อนไม่ต้องตั้งเอง
          </span>
        </span>
      </div>

      <WebhookField
        title="Webhook — ออมเงิน (เข้าห้องประวัติการออม)"
        channel="ห้องออมเงิน"
        value={savingsHook}
        onChange={setSavingsHook}
        onSave={() => saveWebhooks("savings", savingsHook.trim())}
        onTest={() => test("savings", savingsHook)}
        busy={testing === "savings"}
      />

      <WebhookField
        title="Webhook — ไดอารี่ (เข้าห้องไดอารี่)"
        channel="ห้องไดอารี่"
        value={diaryHook}
        onChange={setDiaryHook}
        onSave={() => saveWebhooks("diary", diaryHook.trim())}
        onTest={() => test("diary", diaryHook)}
        busy={testing === "diary"}
      />

      <hr className="hr" style={{ margin: "6px 0 16px" }} />

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

/** ช่องกรอก Webhook 1 ห้อง + ปุ่มทดสอบ (บันทึกค่ากลางตอนคลิกออกจากช่อง) */
function WebhookField({
  title,
  channel,
  value,
  onChange,
  onSave,
  onTest,
  busy,
}: {
  title: string;
  channel: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onTest: () => void;
  busy: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">{title}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        placeholder="https://discord.com/api/webhooks/..."
        style={{ marginBottom: 8, fontSize: 13.5 }}
      />
      <button
        className="btn btn-ghost btn-block"
        disabled={busy}
        onClick={onTest}
      >
        <Icon name="bell" size={16} /> {busy ? "กำลังส่ง…" : "ทดสอบส่งเข้า " + channel}
      </button>
    </div>
  );
}
