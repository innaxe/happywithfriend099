"use client";

import { useEffect, useRef } from "react";
import { usePao } from "./pao-provider";
import { colorForNick, memberMonthMatrix, money, nowYM } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Avatar, SectionHead } from "./primitives";
import { Icon } from "./icon";

// สีสถานะแบบคงที่ (ไม่ผูกกับธีมสีของเป้า — ขอเขียว/แดงชัด ๆ ตามที่ต้องการ)
const GREEN_INK = "#059669";
const GREEN_SOFT = "#ecfdf5";
const RED_INK = "#e11d48";
const RED_SOFT = "#fff1f2";

const NAME_W = 108; // ความกว้างคอลัมน์ชื่อ (ตรึงซ้าย)
const COL_W = 56; // ความกว้างคอลัมน์เดือน

export function MonthTable({ goal }: { goal: Goal }) {
  const { people } = usePao();
  const { months, rows, perMonth } = memberMonthMatrix(goal);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cur = nowYM();
  const realOf = (nick: string) => people.find((p) => p.nick === nick)?.real ?? "";

  // เลื่อนให้คอลัมน์เดือนปัจจุบันอยู่ในจอตอนเปิด/เปลี่ยนเป้า
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(
      '[data-current="1"]',
    );
    if (el) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [goal.id]);

  return (
    <div style={{ margin: "20px 18px 0" }}>
      <SectionHead title="ใครโอนเดือนไหน" sub={money(perMonth, goal.currency) + "/คน/เดือน"} />

      {/* คำอธิบายสี */}
      <div className="row" style={{ gap: 16, margin: "0 2px 10px" }}>
        <span className="row" style={{ gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: GREEN_INK }} />
          โอนครบงวด
        </span>
        <span className="row" style={{ gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: RED_INK }} />
          ยังไม่โอน
        </span>
        <span className="row" style={{ gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <span
            style={{ width: 11, height: 11, borderRadius: 4, background: "var(--track)" }}
          />
          ยังไม่ถึง
        </span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {months.length === 0 ? (
          <div
            style={{ padding: "18px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}
          >
            ยังไม่มีข้อมูลรายเดือน
          </div>
        ) : (
          <div ref={scrollRef} className="noscroll" style={{ overflowX: "auto" }}>
            <div style={{ width: "max-content", minWidth: "100%" }}>
              {/* แถวหัว: ชื่อเดือน + ยอดรวมเดือน */}
              <div
                className="row"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "#fafbfc",
                }}
              >
                <div
                  className="eyebrow"
                  style={{
                    width: NAME_W,
                    flex: "0 0 auto",
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: "#fafbfc",
                    padding: "10px 14px",
                    fontSize: 10.5,
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  สมาชิก
                </div>
                {months.map((m) => {
                  const isCur = m.ym === cur;
                  return (
                    <div
                      key={m.ym}
                      data-current={isCur ? "1" : undefined}
                      style={{
                        width: COL_W,
                        flex: "0 0 auto",
                        textAlign: "center",
                        padding: "8px 2px",
                        background: isCur ? "var(--accent-soft)" : undefined,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isCur ? "var(--accent-ink)" : "var(--ink)",
                        }}
                      >
                        {m.label}
                      </div>
                      <div className="num muted" style={{ fontSize: 9.5, marginTop: 1 }}>
                        {m.total > 0 ? money(m.total, goal.currency) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* แถวสมาชิก */}
              {rows.map((r, ri) => (
                <div
                  key={r.nick}
                  className="row"
                  style={{ borderTop: ri ? "1px solid var(--border)" : "none" }}
                >
                  <div
                    className="row"
                    style={{
                      width: NAME_W,
                      flex: "0 0 auto",
                      gap: 8,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      background: "var(--card)",
                      padding: "9px 12px",
                      borderRight: "1px solid var(--border)",
                      minWidth: 0,
                    }}
                  >
                    <Avatar nick={r.nick} color={colorForNick(r.nick)} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 650,
                          lineHeight: 1.1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={realOf(r.nick) || r.nick}
                      >
                        {r.nick}
                      </div>
                      <div className="num muted" style={{ fontSize: 10 }}>
                        ครบ {r.paidCount}/{r.startedCount}
                      </div>
                    </div>
                  </div>

                  {r.cells.map((c) => {
                    const isCur = c.ym === cur;
                    return (
                      <div
                        key={c.ym}
                        style={{
                          width: COL_W,
                          flex: "0 0 auto",
                          display: "grid",
                          placeItems: "center",
                          padding: "9px 0",
                          background: isCur
                            ? "color-mix(in srgb, var(--accent), transparent 94%)"
                            : undefined,
                        }}
                        title={
                          c.started
                            ? (c.paid ? "โอนครบงวด · " : "ยังไม่ครบ · ") +
                              money(c.amount, goal.currency)
                            : "ยังไม่ถึงเดือนนี้"
                        }
                      >
                        <Cell cell={c} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ช่องสถานะ 1 ช่อง: เขียว=ครบ, แดง=ยังไม่โอน, จาง=ยังไม่ถึง */
function Cell({ cell }: { cell: { amount: number; paid: boolean; started: boolean } }) {
  if (!cell.started) {
    return (
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--border-strong)",
        }}
      />
    );
  }
  const paid = cell.paid;
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        display: "grid",
        placeItems: "center",
        background: paid ? GREEN_SOFT : RED_SOFT,
        color: paid ? GREEN_INK : RED_INK,
      }}
    >
      <Icon name={paid ? "check" : "x"} size={16} sw={2.6} />
    </span>
  );
}
