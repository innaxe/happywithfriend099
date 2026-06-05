"use client";

import { usePao } from "./pao-provider";
import { money, pctOf, tallies } from "@/lib/calc";
import { MiniRing, PersonAvatar } from "./primitives";
import { Icon } from "./icon";

export function GoalBar() {
  const { goals, activeId, switchGoal, newGoal, people } = usePao();
  const avatarOf = (nick: string) =>
    people.find((p) => p.nick === nick)?.avatar_url ?? null;
  return (
    <div
      className="noscroll"
      style={{ display: "flex", gap: 9, overflowX: "auto", padding: "2px 18px 4px" }}
    >
      {goals.map((g) => {
        const saved = tallies(g).saved;
        const pct = pctOf(saved, g.target) / 100;
        const on = g.id === activeId;
        return (
          <button
            key={g.id}
            onClick={() => switchGoal(g.id)}
            style={{
              flex: "0 0 auto",
              width: 152,
              textAlign: "left",
              background: "var(--card)",
              border: "1px solid " + (on ? "var(--accent)" : "var(--border)"),
              borderRadius: 14,
              padding: "11px 12px",
              boxShadow: on
                ? "0 0 0 3px rgba(5,150,105,.12), var(--sh-sm)"
                : "var(--sh-sm)",
              transition: "all .16s ease",
            }}
          >
            <div className="row" style={{ gap: 9 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{g.emoji}</span>
              <MiniRing pct={pct} color={g.accent} />
              <span
                className="num"
                style={{
                  marginLeft: "auto",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: on ? "var(--accent-ink)" : "var(--muted)",
                }}
              >
                {Math.round(pct * 100)}%
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 650,
                marginTop: 9,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {g.name}
            </div>
            <div className="num muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              {money(saved, g.currency)} / {money(g.target, g.currency)}
            </div>
            {/* รูปสมาชิกในทริป (ซ้อนกัน) — เห็นว่าใครอยู่ทริปนี้บ้าง */}
            <div className="row" style={{ marginTop: 8 }}>
              {g.members.slice(0, 4).map((m, idx) => (
                <span
                  key={m}
                  style={{
                    marginLeft: idx ? -6 : 0,
                    border: "1.5px solid var(--card)",
                    borderRadius: "50%",
                    display: "inline-flex",
                  }}
                >
                  <PersonAvatar nick={m} avatarUrl={avatarOf(m)} size={20} />
                </span>
              ))}
              {g.members.length > 4 && (
                <span
                  className="num"
                  style={{
                    marginLeft: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--track)",
                    border: "1.5px solid var(--card)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  +{g.members.length - 4}
                </span>
              )}
            </div>
          </button>
        );
      })}
      <button
        onClick={newGoal}
        aria-label="เพิ่มเป้าหมาย"
        style={{
          flex: "0 0 auto",
          width: 52,
          borderRadius: 14,
          border: "1px dashed var(--border-strong)",
          background: "transparent",
          color: "var(--muted)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}
