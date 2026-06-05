"use client";

import { useState } from "react";
import { usePao } from "./pao-provider";
import { colorForNick, unpaidThisMonth, ymLabel, nowYM } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Avatar } from "./primitives";
import { Icon } from "./icon";

/** แบนเนอร์เตือน: ใครยังไม่โอนงวดเดือนนี้ + ปุ่มเตือนใน Discord */
export function NudgeBanner({ goal }: { goal: Goal }) {
  const { nudgeUnpaid } = usePao();
  const [sending, setSending] = useState(false);
  const unpaid = unpaidThisMonth(goal);

  if (unpaid.length === 0) return null;

  async function send() {
    setSending(true);
    await nudgeUnpaid();
    setSending(false);
  }

  return (
    <div
      style={{
        margin: "14px 18px 0",
        padding: 15,
        borderRadius: "var(--r-lg)",
        background: "var(--amber-soft)",
        border: "1px solid color-mix(in srgb, var(--amber), white 70%)",
      }}
    >
      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
        <span style={{ color: "var(--amber)", flex: "0 0 auto" }}>
          <Icon name="bell" size={18} />
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--amber)" }}>
          ยังไม่โอนงวด {ymLabel(nowYM())}
        </span>
        <span
          className="num"
          style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: "var(--amber)" }}
        >
          {unpaid.length} คน
        </span>
      </div>

      <div
        className="noscroll"
        style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}
      >
        {unpaid.map((nick) => (
          <div
            key={nick}
            className="col"
            style={{ alignItems: "center", gap: 5, flex: "0 0 auto" }}
          >
            <Avatar nick={nick} color={colorForNick(nick)} size={40} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{nick}</span>
          </div>
        ))}
      </div>

      <button
        className="btn btn-block"
        style={{
          background: "var(--amber)",
          color: "#fff",
          padding: "11px 16px",
          boxShadow: "0 4px 12px color-mix(in srgb, var(--amber), transparent 70%)",
        }}
        disabled={sending}
        onClick={send}
      >
        <Icon name="bell" size={16} sw={2} />
        {sending ? "กำลังส่ง…" : "เตือนใน Discord"}
      </button>
    </div>
  );
}
