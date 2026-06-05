// ชุดไอคอนเส้นบาง (Lucide-ish) พอร์ตตรงจาก handoff icons.jsx
import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "target" | "users" | "gear" | "plus" | "chevR" | "chevD" | "chevL"
  | "x" | "lock" | "check" | "clip" | "calendar" | "user" | "coins"
  | "trend" | "bell" | "edit" | "trash" | "share" | "logout" | "copy"
  | "wallet" | "sparkle" | "arrowUp" | "receipt" | "flag" | "info"
  | "pencilSm" | "book" | "image" | "send" | "comment";

export function Icon({
  name,
  size = 20,
  sw = 1.6,
  color = "currentColor",
  style,
}: {
  name: IconName;
  size?: number;
  sw?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const P: Record<IconName, ReactNode> = {
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
      </>
    ),
    users: (
      <>
        <path d="M16 19c0-2.5-1.8-4-4-4s-4 1.5-4 4" />
        <circle cx="12" cy="8.5" r="3" />
        <path d="M19.5 18c0-1.8-1-3-2.6-3.4" />
        <path d="M4.5 18c0-1.8 1-3 2.6-3.4" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevR: <path d="m9 6 6 6-6 6" />,
    chevD: <path d="m6 9 6 6 6-6" />,
    chevL: <path d="m15 6-6 6 6 6" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    lock: (
      <>
        <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7" />,
    clip: (
      <path d="M19 11.5 12 18.5a4 4 0 0 1-5.7-5.7l7.2-7.2a2.6 2.6 0 0 1 3.7 3.7l-7.1 7.1a1.2 1.2 0 0 1-1.7-1.7l6.4-6.4" />
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
        <path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
      </>
    ),
    coins: (
      <>
        <ellipse cx="9" cy="7" rx="5" ry="2.6" />
        <path d="M4 7v4c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V7" />
        <path d="M10 14.4c.6 1.2 2.6 2.1 5 2.1 2.8 0 5-1.2 5-2.6v-4" />
        <ellipse cx="15" cy="9.8" rx="5" ry="2.6" />
      </>
    ),
    trend: (
      <>
        <path d="M4 15l4.5-4.5 3 3L20 6" />
        <path d="M15 6h5v5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 16.5H6l1.2-2V11a4.8 4.8 0 0 1 9.6 0v3.5z" />
        <path d="M10 19.5a2 2 0 0 0 4 0" />
      </>
    ),
    edit: (
      <>
        <path d="M14 5.5l4.5 4.5M4.5 19.5l1-4 11-11 4 4-11 11-4 1z" />
      </>
    ),
    trash: (
      <path d="M5 7h14M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" />
    ),
    share: (
      <>
        <circle cx="6" cy="12" r="2.6" />
        <circle cx="17.5" cy="6" r="2.6" />
        <circle cx="17.5" cy="18" r="2.6" />
        <path d="m8.4 10.8 6.8-3.4M8.4 13.2l6.8 3.4" />
      </>
    ),
    logout: (
      <>
        <path d="M14 8V6.5A2.5 2.5 0 0 0 11.5 4h-4A2.5 2.5 0 0 0 5 6.5v11A2.5 2.5 0 0 0 7.5 20h4a2.5 2.5 0 0 0 2.5-2.5V16" />
        <path d="M10 12h10m0 0-3-3m3 3-3 3" />
      </>
    ),
    copy: (
      <>
        <rect x="8.5" y="8.5" width="11" height="11" rx="2.4" />
        <path d="M5.5 15.5h-.5A1.5 1.5 0 0 1 3.5 14V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5" />
      </>
    ),
    wallet: (
      <>
        <rect x="3.5" y="6" width="17" height="13" rx="2.6" />
        <path d="M3.5 9.5h17M16.5 13.5h1.5" />
      </>
    ),
    sparkle: (
      <path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4z" />
    ),
    arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
    receipt: (
      <>
        <path
          d="M6 3.5h12v17l-2.2-1.4-2.2 1.4-2.2-1.4L9.2 20.5 7 21.9V3.5z"
          transform="translate(0 -.5)"
        />
        <path d="M9 8h6M9 11.5h6M9 15h3.5" />
      </>
    ),
    flag: (
      <>
        <path d="M6 21V4M6 4.5h9l-1.5 3 1.5 3H6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    pencilSm: (
      <path d="M13 5.5l3.5 3.5M4 18l1-3.5 8.5-8.5 3 3L8 17.5 4 18z" />
    ),
    book: (
      <>
        <path d="M5 4.5h9a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17z" />
        <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5h9" />
        <path d="M8.5 8.5h5M8.5 11.5h5" />
      </>
    ),
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2.4" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="m5 17 4.5-4.5 3.5 3.5 2.5-2.5L20 17" />
      </>
    ),
    send: <path d="M5 12 20 5l-4.5 14-3.5-5.5L5 12z" />,
    comment: (
      <path d="M5 16.5V7a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 7v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5z" />
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
