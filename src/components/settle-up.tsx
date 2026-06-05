"use client";

import { colorForNick, money, settleUp } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Avatar, SectionHead } from "./primitives";

// สีสถานะคงที่ (เขียว=จ่ายเกิน, แดง=ค้าง) ไม่ผูกธีมเป้า
const GREEN = "#059669";
const RED = "#e11d48";

/** การ์ดเทียบกันในกลุ่ม: ใครลงเกิน/ค้างเทียบค่าเฉลี่ย (ไว้เคลียร์กันตอนปิดทริป) */
export function SettleUp({ goal }: { goal: Goal }) {
  const { rows, fairShare, saved } = settleUp(goal);
  if (saved <= 0) return null;

  const allEqual = rows.every((r) => Math.abs(r.balance) < 1);

  return (
    <div style={{ margin: "18px 18px 0" }}>
      <SectionHead
        title="เทียบกันในกลุ่ม"
        sub={"เฉลี่ย " + money(fairShare, goal.currency) + "/คน"}
      />
      <div className="card" style={{ padding: "4px 16px" }}>
        {allEqual ? (
          <div
            style={{ padding: "16px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}
          >
            ทุกคนลงเท่ากันแล้ว 🎉
          </div>
        ) : (
          rows.map((r, i) => {
            const over = r.balance >= 0;
            const big = Math.abs(r.balance) >= 1;
            return (
              <div
                key={r.nick}
                className="between"
                style={{ padding: "12px 0", borderTop: i ? "1px solid var(--border)" : "none" }}
              >
                <div className="row" style={{ gap: 10, minWidth: 0 }}>
                  <Avatar nick={r.nick} color={colorForNick(r.nick)} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 650 }}>{r.nick}</div>
                    <div className="num muted" style={{ fontSize: 11.5 }}>
                      ลงแล้ว {money(r.paid, goal.currency)}
                    </div>
                  </div>
                </div>
                {big ? (
                  <span
                    className="num"
                    style={{ fontSize: 13.5, fontWeight: 750, color: over ? GREEN : RED, flex: "0 0 auto" }}
                  >
                    {over ? "+" : "−"}
                    {money(Math.abs(r.balance), goal.currency)}
                    <span style={{ fontSize: 10.5, fontWeight: 600, marginLeft: 4, color: "var(--muted)" }}>
                      {over ? "จ่ายเกิน" : "ค้าง"}
                    </span>
                  </span>
                ) : (
                  <span className="num muted" style={{ fontSize: 12, flex: "0 0 auto" }}>
                    เท่าเฉลี่ย
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      {!allEqual && (
        <div className="muted" style={{ fontSize: 11, margin: "8px 2px 0", lineHeight: 1.5 }}>
          คนที่ <b style={{ color: RED }}>ค้าง</b> โอนเพิ่มให้คนที่{" "}
          <b style={{ color: GREEN }}>จ่ายเกิน</b> เพื่อให้ทุกคนลงเท่ากัน
        </div>
      )}
    </div>
  );
}
