"use client";

import { useEffect } from "react";
import { Icon } from "./icon";

/** Bottom-sheet modal (พอร์ตจาก handoff .sheet) — เปิด/ปิดด้วย open/onClose */
export function Sheet({
  open,
  onClose,
  title,
  children,
  foot,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-scrim" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>
            {title}
          </span>
          <button className="iconbtn" onClick={onClose} aria-label="ปิด">
            <Icon name="x" size={19} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {foot && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            {foot}
          </div>
        )}
      </div>
    </div>
  );
}
