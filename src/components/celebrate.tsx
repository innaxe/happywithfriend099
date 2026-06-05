"use client";

import { useEffect, useState } from "react";
import { usePao } from "./pao-provider";

const CONFETTI_COLORS = [
  "#059669", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ec4899", "#ef4444", "#14b8a6", "#facc15",
];

interface Piece {
  left: number; // %
  delay: number; // s
  dur: number; // s
  color: string;
  size: number;
  rot: number;
}

/** สร้างชิ้น confetti ครั้งเดียวตอน mount (สุ่มได้ — เป็น client เท่านั้น) */
function makePieces(n: number): Piece[] {
  const out: Piece[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 2.4 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 6,
      rot: Math.random() * 360,
    });
  }
  return out;
}

/** Overlay ฉลองเมื่อยอดสะสมแตะหมุดหมาย — โผล่จาก context (celebration) */
export function Celebrate() {
  const { celebration, clearCelebration } = usePao();
  const [pieces] = useState(() => makePieces(48));

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(clearCelebration, 3600);
    return () => clearTimeout(t);
  }, [celebration, clearCelebration]);

  if (!celebration) return null;

  const done = celebration.pct >= 100;
  const headline = done ? "ถึงเป้าแล้ว!" : "ก้าวถึง " + celebration.pct + "%";
  const sub = done
    ? "เก่งมากทุกคน ทำสำเร็จแล้ว 🥳"
    : "อีกนิดเดียว ไปต่อกันนะ 💪";

  return (
    <div className="celebrate-scrim" onClick={clearCelebration}>
      <div className="confetti-wrap" aria-hidden="true">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: p.left + "%",
              width: p.size,
              height: p.size * 0.5,
              background: p.color,
              animationDelay: p.delay + "s",
              animationDuration: p.dur + "s",
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
      </div>
      <div className="celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 54, lineHeight: 1 }}>{done ? "🏆" : "🎉"}</div>
        <div
          style={{
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: "-.01em",
            marginTop: 12,
          }}
        >
          {headline}
        </div>
        <div
          className="muted"
          style={{ fontSize: 14, marginTop: 6, lineHeight: 1.5 }}
        >
          {sub}
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 18, padding: "11px 26px" }}
          onClick={clearCelebration}
        >
          เย้! 🙌
        </button>
      </div>
    </div>
  );
}
