"use client";

import { deriveGoalStats, money } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Icon, type IconName } from "./icon";

export function StatChips({ goal }: { goal: Goal }) {
  const s = deriveGoalStats(goal);
  const cur = goal.currency;

  const items: { big: string; sub: string; icon: IconName }[] = s.solo
    ? [
        { big: money(s.planTotalMonthly, cur), sub: "แผน/เดือน", icon: "user" },
        { big: money(s.remain, cur), sub: "เหลืออีก", icon: "wallet" },
        { big: String(s.left), sub: "เดือนที่เหลือ", icon: "calendar" },
      ]
    : [
        { big: money(s.planPer, cur), sub: "ต่อคน/เดือน", icon: "user" },
        { big: s.onTrack + "/" + s.memCount, sub: "เก็บตามเป้า", icon: "check" },
        { big: String(s.left), sub: "เดือนที่เหลือ", icon: "calendar" },
      ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 9,
        margin: "12px 18px 0",
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="card"
          style={{ padding: "12px 11px", display: "flex", flexDirection: "column", gap: 4 }}
        >
          <span style={{ color: "var(--muted-2)" }}>
            <Icon name={it.icon} size={16} />
          </span>
          <span
            className="num"
            style={{ fontSize: 17, fontWeight: 750, letterSpacing: "-.01em" }}
          >
            {it.big}
          </span>
          <span className="muted" style={{ fontSize: 11, lineHeight: 1.2 }}>
            {it.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
