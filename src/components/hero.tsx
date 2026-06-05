"use client";

import { usePao } from "./pao-provider";
import { deriveGoalStats, money, ymLabel } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Ring } from "./primitives";
import { Icon } from "./icon";

export function Hero({ goal }: { goal: Goal }) {
  const { editGoal } = usePao();
  const s = deriveGoalStats(goal);
  const pctFrac = s.pct / 100;

  let pace: string;
  if (s.remain <= 0) {
    pace = "ถึงเป้าแล้ว 🎉 เยี่ยมมาก";
  } else if (s.left <= 0) {
    pace = "เลยกำหนดแล้ว · ยังขาดอีก " + money(s.remain, goal.currency);
  } else {
    const per = s.solo ? s.remain / s.left : s.remain / s.left / s.memCount;
    pace =
      (s.solo ? "ออมต่ออีก " : "อีกคนละ ~") +
      money(per, goal.currency) +
      "/เดือน ก็ทันเป้าพอดี";
  }

  return (
    <div className="card" style={{ margin: "12px 18px 0", padding: "24px 20px 18px" }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <div className="row" style={{ gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 22 }}>{goal.emoji}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {goal.name}
          </span>
        </div>
        <div className="row" style={{ gap: 6, flex: "0 0 auto" }}>
          {!s.solo && (
            <span className="chip" style={{ padding: "4px 9px", fontSize: 11.5 }}>
              <Icon name="users" size={13} /> {s.memCount} คน
            </span>
          )}
          <button
            className="iconbtn"
            style={{ width: 30, height: 30 }}
            onClick={editGoal}
            aria-label="แก้ไขเป้าหมาย"
          >
            <Icon name="pencilSm" size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 2px" }}>
        <Ring pct={pctFrac} size={186} stroke={16} accent={goal.accent}>
          <div className="eyebrow" style={{ fontSize: 10.5 }}>
            ยอดสะสม
          </div>
          <div
            className="num"
            style={{
              fontSize: 33,
              fontWeight: 760,
              letterSpacing: "-.02em",
              lineHeight: 1.05,
              marginTop: 3,
            }}
          >
            {money(s.saved, goal.currency)}
          </div>
          <div className="num muted" style={{ fontSize: 13, marginTop: 5 }}>
            จาก {money(s.target, goal.currency)}
          </div>
          <div
            className="num"
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--accent-ink)",
              marginTop: 4,
            }}
          >
            {Math.round(s.pct)}% · ภายใน {ymLabel(goal.end)}
          </div>
        </Ring>
      </div>

      <div
        style={{
          display: "flex",
          gap: 9,
          alignItems: "center",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-soft-2)",
          borderRadius: 12,
          padding: "11px 13px",
          marginTop: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "#fff",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
        >
          <Icon name="trend" size={17} color="var(--accent)" />
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--accent-ink)" }}>
          {pace}
        </div>
      </div>
    </div>
  );
}
