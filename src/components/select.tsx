"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

export interface Option {
  value: string;
  label: string;
}

/**
 * Dropdown สไตล์แอป (แทน <select> native) — การ์ดขาว ขอบมน เงานุ่ม
 * เลือกรายการได้ ไฮไลต์ตัวที่เลือกด้วยสีธีม ปิดเมื่อคลิกนอก/กด Escape
 */
export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  numeric = false,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  numeric?: boolean; // ใช้ฟอนต์ตัวเลข tabular กับป้าย
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? value;

  // ปิดเมื่อคลิกนอก / กด Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // เลื่อนตัวที่เลือกให้อยู่ในจอตอนเปิด
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-sel="1"]');
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className={"input" + (numeric ? " num" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: "var(--muted-2)",
            flex: "0 0 auto",
            display: "inline-flex",
            transition: "transform .15s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          <Icon name="chevD" size={16} />
        </span>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="noscroll"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--card)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r)",
            boxShadow: "var(--sh-lg)",
            maxHeight: 248,
            overflowY: "auto",
            padding: 6,
          }}
        >
          {options.map((o) => {
            const sel = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={sel}
                data-sel={sel ? "1" : undefined}
                className={"selopt" + (numeric ? " num" : "")}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 14.5,
                  color: sel ? "var(--accent-ink)" : "var(--ink)",
                  fontWeight: sel ? 700 : 500,
                  ...(sel ? { background: "var(--accent-soft)" } : null),
                }}
              >
                <span>{o.label}</span>
                {sel && <Icon name="check" size={15} sw={2.4} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
