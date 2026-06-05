"use client";

import { useId } from "react";
import { Icon } from "./icon";

/** หัวข้อ section + ตัวเลือกด้านขวา (sub หรือปุ่ม action) */
export function SectionHead({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="between" style={{ margin: "0 2px 10px" }}>
      <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-.01em" }}>
        {title}
      </span>
      {action ? (
        <button
          onClick={onAction}
          className="row"
          style={{
            gap: 3,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent-ink)",
          }}
        >
          {action}
          <Icon name="chevR" size={14} sw={2} />
        </button>
      ) : (
        sub && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            {sub}
          </span>
        )
      )}
    </div>
  );
}

/** วงกลม avatar ตัวอักษรแรกของชื่อเล่น */
export function Avatar({
  nick,
  color,
  size = 36,
  ring = false,
}: {
  nick: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  const fs = Math.round(size * 0.4);
  return (
    <span
      className="av"
      style={{
        width: size,
        height: size,
        fontSize: fs,
        background: color,
        boxShadow: ring
          ? `0 0 0 2px #fff, 0 0 0 3.5px ${color}33`
          : "none",
      }}
    >
      {(nick || "?").slice(0, 1)}
    </span>
  );
}

/** วงแหวนใหญ่ (hero) — รับสีธีมเป้า ทำ gradient จากสีอ่อน→สีเข้ม */
export function Ring({
  pct,
  size = 170,
  stroke = 15,
  accent = "var(--accent)",
  children,
}: {
  pct: number; // 0..1
  size?: number;
  stroke?: number;
  accent?: string;
  children?: React.ReactNode;
}) {
  const gid = "g" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(Math.max(pct, 0), 1));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }}
        />
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0"
              stopColor={`color-mix(in srgb, ${accent}, white 22%)`}
            />
            <stop offset="1" stopColor={accent} />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** วงแหวนเล็กสำหรับการ์ดสลับเป้า */
export function MiniRing({
  pct,
  size = 34,
  stroke = 4,
  color = "var(--accent)",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(Math.max(pct, 0), 1));
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flex: "0 0 auto" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--track)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
      />
    </svg>
  );
}

export function Pbar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="pbar">
      <i
        style={{
          width: Math.min(Math.max(pct, 0), 1) * 100 + "%",
          background: color || "var(--accent)",
        }}
      />
    </div>
  );
}

export function Badge({ kind }: { kind: "ok" | "warn" | "late" }) {
  const map: Record<typeof kind, [string, string]> = {
    ok: ["ตามเป้า", "ok"],
    warn: ["ใกล้ครบ", "warn"],
    late: ["ตกงวด", "late"],
  };
  const [t, c] = map[kind];
  return (
    <span className={"badge " + c}>
      {kind === "ok" && <Icon name="check" size={12} sw={2.4} />}
      {t}
    </span>
  );
}

/** กราฟเส้น: สะสมจริง (พื้นไล่สี ถึงเดือนปัจจุบัน) เทียบ แผน (เส้นประ เต็มช่วง) */
export function LineChart({
  saved,
  plan,
  labels,
  savedEnd,
  accent = "var(--accent)",
  w = 326,
  h = 150,
}: {
  saved: number[];
  plan: number[];
  labels: string[];
  savedEnd?: number; // index สุดท้ายของเส้นสะสมจริง (ดีฟอลต์=ตัวสุดท้าย)
  accent?: string;
  w?: number;
  h?: number;
}) {
  const gid = "g" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pad = { l: 6, r: 6, t: 14, b: 22 };
  const max = Math.max(...saved, ...plan, 1) * 1.06;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = Math.max(plan.length, saved.length, 1);
  const rawEnd = savedEnd ?? saved.length - 1;
  const end = Math.min(rawEnd, saved.length - 1);
  const showSaved = end >= 0; // ยังไม่เริ่มเป้า → ไม่วาดเส้นสะสมจริง
  const X = (i: number) => pad.l + (n > 1 ? (i / (n - 1)) * iw : 0);
  const Y = (v: number) => pad.t + ih - (v / max) * ih;
  const path = (arr: number[]) =>
    arr
      .map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1))
      .join(" ");
  const savedSlice = showSaved ? saved.slice(0, end + 1) : [];
  const lastX = X(Math.max(end, 0));
  const area = showSaved
    ? path(savedSlice) +
      ` L${lastX.toFixed(1)} ${(pad.t + ih).toFixed(1)} L${X(0).toFixed(1)} ${(
        pad.t + ih
      ).toFixed(1)} Z`
    : "";
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity=".18" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + ih * (1 - g)}
          y2={pad.t + ih * (1 - g)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray={g === 0 ? "0" : "3 4"}
        />
      ))}
      {showSaved && <path d={area} fill={`url(#${gid})`} />}
      <path
        d={path(plan)}
        fill="none"
        stroke="var(--muted-2)"
        strokeWidth="1.6"
        strokeDasharray="4 4"
      />
      {showSaved && (
        <path
          d={path(savedSlice)}
          fill="none"
          stroke={accent}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showSaved && (
        <circle
          cx={lastX}
          cy={Y(saved[end] ?? 0)}
          r="4"
          fill="#fff"
          stroke={accent}
          strokeWidth="2.6"
        />
      )}
      {labels.map((l, i) =>
        i % 2 === 0 ? (
          <text
            key={i}
            x={X(i)}
            y={h - 6}
            fontSize="9.5"
            fill="var(--muted-2)"
            textAnchor="middle"
            fontFamily="var(--latin)"
          >
            {l}
          </text>
        ) : null,
      )}
    </svg>
  );
}
