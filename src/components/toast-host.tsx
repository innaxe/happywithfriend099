"use client";

import { usePao } from "./pao-provider";
import { Icon } from "./icon";

/** Toast pill ลอยด้านล่าง (เขียว=สำเร็จ, แดง=ผิดพลาด) */
export function ToastHost() {
  const { toast } = usePao();
  if (!toast) return null;
  const err = toast.kind === "error";
  return (
    <div
      className="toast"
      key={toast.id}
      style={err ? { background: "var(--rose)" } : undefined}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: err ? "rgba(255,255,255,.2)" : "var(--accent)",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
        }}
      >
        <Icon name={err ? "info" : "check"} size={15} color="#fff" sw={2.6} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{toast.msg}</span>
    </div>
  );
}
