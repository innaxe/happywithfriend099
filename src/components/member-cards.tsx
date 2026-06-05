"use client";

import { usePao } from "./pao-provider";
import { deriveGoalStats, money } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { PersonAvatar, Badge, Pbar, SectionHead } from "./primitives";
import { Icon } from "./icon";

export function MemberCards({ goal }: { goal: Goal }) {
  const { people } = usePao();
  const s = deriveGoalStats(goal);
  const per = s.perPersonTarget;
  const order = [...goal.members].sort((a, b) => (s.by[b] ?? 0) - (s.by[a] ?? 0));
  const realOf = (nick: string) => people.find((p) => p.nick === nick)?.real ?? "";
  const avatarOf = (nick: string) =>
    people.find((p) => p.nick === nick)?.avatar_url ?? null;

  return (
    <div style={{ margin: "18px 18px 0" }}>
      <SectionHead title="ความคืบหน้ารายคน" sub={goal.members.length + " คน"} />
      <div className="card" style={{ padding: "4px 16px" }}>
        {order.map((m, i) => {
          const saved = s.by[m] ?? 0;
          const pct = per ? saved / per : 0;
          const done = per > 0 && saved >= per * 0.999; // เก็บครบเป้าต่อคนแล้ว
          // ตามดีไซน์: ระดับความคืบหน้าเทียบเป้าต่อคน (เขียว/เหลือง/แดง)
          const kind: "ok" | "warn" | "late" =
            pct >= 0.55 ? "ok" : pct >= 0.4 ? "warn" : "late";
          const real = realOf(m);
          return (
            <div
              key={m}
              style={{ padding: "14px 0", borderTop: i ? "1px solid var(--border)" : "none" }}
            >
              <div className="between" style={{ marginBottom: 9 }}>
                <div className="row" style={{ gap: 10, minWidth: 0 }}>
                  <PersonAvatar nick={m} avatarUrl={avatarOf(m)} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.15 }}>{m}</div>
                    {real && (
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {real}
                      </div>
                    )}
                  </div>
                </div>
                {done ? (
                  <span className="badge ok">
                    <Icon name="check" size={12} sw={2.4} /> ครบแล้ว
                  </span>
                ) : (
                  <Badge kind={kind} />
                )}
              </div>
              <Pbar pct={pct} color={kind === "late" ? "#f59e0b" : undefined} />
              <div className="between num" style={{ marginTop: 7, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{money(saved, goal.currency)}</span>
                <span className="muted">
                  เป้า {money(per, goal.currency)} · {Math.round(pct * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
