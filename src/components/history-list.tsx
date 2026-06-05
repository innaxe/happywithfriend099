"use client";

import { useState } from "react";
import { usePao } from "./pao-provider";
import { colorForNick, money, relativeTime, ymLabel } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { SectionHead } from "./primitives";
import { Icon } from "./icon";

export function Activity({ goal }: { goal: Goal }) {
  const { deleteContribution, setEditingContribution } = usePao();
  const [all, setAll] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const sorted = [...goal.contributions].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return (
      tb - ta ||
      b.month.localeCompare(a.month) ||
      String(b.id).localeCompare(String(a.id))
    );
  });
  const shown = all ? sorted : sorted.slice(0, 6);

  return (
    <div style={{ margin: "20px 18px 26px" }}>
      <SectionHead
        title="รายการล่าสุด"
        action={sorted.length > 6 ? (all ? "ย่อ" : "ดูทั้งหมด") : undefined}
        onAction={() => setAll((a) => !a)}
      />
      <div className="card" style={{ padding: "2px 16px" }}>
        {shown.length === 0 ? (
          <div
            style={{ padding: "18px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}
          >
            ยังไม่มีรายการ — เริ่มบันทึกได้เลย
          </div>
        ) : (
          shown.map((x, i) => {
            const when = relativeTime(x.created_at) || "งวด " + ymLabel(x.month);
            const note = x.note || "งวด " + ymLabel(x.month);
            return (
              <div
                key={x.id}
                className="row"
                style={{ gap: 11, padding: "13px 0", borderTop: i ? "1px solid var(--border)" : "none" }}
              >
                <span
                  className="av"
                  style={{ width: 38, height: 38, fontSize: 15, background: colorForNick(x.name) }}
                >
                  {(x.name || "?").slice(0, 1)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 650 }}>{x.name}</span>
                    {x.slip_url ? (
                      <button
                        onClick={() => setLightbox(x.slip_url)}
                        aria-label="ดูสลิป"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          overflow: "hidden",
                          flex: "0 0 auto",
                          border: "1px solid var(--border-strong)",
                          padding: 0,
                          lineHeight: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={x.slip_url}
                          alt=""
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </button>
                    ) : (
                      <span
                        className="row"
                        style={{
                          gap: 3,
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: "var(--amber)",
                          background: "var(--amber-soft)",
                          padding: "1px 6px",
                          borderRadius: 999,
                        }}
                      >
                        รอสลิป
                      </span>
                    )}
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 11.5,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {note} · {when}
                  </div>
                </div>
                <span
                  className="num"
                  style={{ fontSize: 14.5, fontWeight: 750, color: "var(--accent-ink)", flex: "0 0 auto" }}
                >
                  +{money(x.amount, goal.currency)}
                </span>
                <button
                  className="iconbtn"
                  style={{ width: 28, height: 28, color: "var(--muted-2)", flex: "0 0 auto" }}
                  onClick={() => setEditingContribution(x)}
                  aria-label="แก้ไขรายการ"
                >
                  <Icon name="pencilSm" size={15} />
                </button>
                <button
                  className="iconbtn"
                  style={{ width: 28, height: 28, color: "var(--muted-2)", flex: "0 0 auto" }}
                  onClick={() => deleteContribution(x.id)}
                  aria-label="ลบรายการ"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(15,23,42,.85)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            animation: "fade .2s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="สลิปโอนเงิน"
            style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 12, objectFit: "contain" }}
          />
          <button
            aria-label="ปิด"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="x" size={20} sw={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}
