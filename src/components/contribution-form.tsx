"use client";

import { useRef, useState } from "react";
import { usePao } from "./pao-provider";
import {
  clampMonth,
  colorForNick,
  deriveGoalStats,
  isSolo,
  monthsList,
  nowYM,
  ymLabel,
} from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Avatar } from "./primitives";
import { Select } from "./select";
import { Icon } from "./icon";

// remount ด้วย key={goal.id} จาก dashboard → state เริ่มต้นจาก goal ได้ตรง ๆ
export function ContributionForm({ goal }: { goal: Goal }) {
  const { addContribution, busy } = usePao();
  const solo = isSolo(goal);
  const months = monthsList(goal);

  const [who, setWho] = useState(goal.members[0] ?? "ฉัน");
  const [month, setMonth] = useState<string>(() => clampMonth(nowYM(), goal));
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false); // กันกดซ้ำเร็ว ๆ แล้วลงเบิ้ล

  const safeWho =
    !solo && goal.members.length && !goal.members.includes(who)
      ? goal.members[0]
      : who;
  const numAmt = Number(amt.replace(/,/g, ""));
  const valid = !!amt && numAmt > 0;
  // เตือนเบา ๆ ถ้ายอดสูงผิดปกติ (เช่นพิมพ์ 35,000 แทน 3,500) — ไม่บล็อกการบันทึก
  const planPer = deriveGoalStats(goal).planPer;
  const highAmount = valid && planPer > 0 && numAmt > planPer * 5;

  async function submit() {
    if (!valid || busy || submitting.current) return;
    submitting.current = true;
    try {
      const file = fileRef.current?.files?.[0] ?? null;
      const ok = await addContribution({
        name: safeWho,
        month,
        amount: String(numAmt),
        note,
        file,
      });
      if (ok) {
        setAmt("");
        setNote("");
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <div className="card" style={{ margin: "14px 18px 0", padding: 18 }}>
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        <span style={{ color: "var(--accent)" }}>
          <Icon name="plus" size={18} sw={2.2} />
        </span>
        <span style={{ fontWeight: 700, fontSize: 15.5 }}>บันทึกการออม</span>
      </div>

      {!solo && (
        <>
          <label className="field-label">ใครโอน</label>
          <div
            className="noscroll"
            style={{
              display: "flex",
              gap: 7,
              overflowX: "auto",
              paddingBottom: 4,
              marginBottom: 14,
            }}
          >
            {goal.members.map((m) => {
              const on = m === safeWho;
              return (
                <button
                  key={m}
                  onClick={() => setWho(m)}
                  style={{
                    flex: "0 0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    padding: 2,
                    opacity: on ? 1 : 0.5,
                    transition: "opacity .15s",
                  }}
                >
                  <Avatar nick={m} color={colorForNick(m)} size={42} ring={on} />
                  <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 500 }}>{m}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.05fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <label className="field-label">เดือน</label>
          <Select
            value={month}
            onChange={setMonth}
            ariaLabel="เลือกเดือน"
            numeric
            options={months.map((ym) => ({ value: ym, label: ymLabel(ym) }))}
          />
        </div>
        <div>
          <label className="field-label">จำนวน</label>
          <div style={{ position: "relative" }}>
            <span
              className="num"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              {goal.currency}
            </span>
            <input
              className="input num"
              inputMode="numeric"
              value={amt}
              placeholder="3,500"
              onChange={(e) => setAmt(e.target.value.replace(/[^\d,]/g, ""))}
              style={{ paddingLeft: 26, fontWeight: 650 }}
            />
          </div>
        </div>
      </div>

      {highAmount && (
        <div
          className="row"
          style={{ gap: 6, margin: "-2px 0 12px", fontSize: 11.5, color: "var(--amber)" }}
        >
          <Icon name="info" size={13} /> ยอดสูงกว่าปกติ — เช็กอีกครั้งว่าถูกไหม
        </div>
      )}

      <label className="field-label">หมายเหตุ</label>
      <input
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="เช่น งวดเดือนนี้ / เก็บเพิ่ม"
        style={{ marginBottom: 12 }}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="row"
        style={{
          width: "100%",
          gap: 9,
          padding: "12px 13px",
          marginBottom: 14,
          border: "1px dashed " + (fileName ? "var(--accent)" : "var(--border-strong)"),
          borderRadius: 12,
          background: fileName ? "var(--accent-soft)" : "transparent",
          transition: "all .15s",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: fileName ? "var(--accent)" : "#eef1f4",
            color: fileName ? "#fff" : "var(--muted)",
            flex: "0 0 auto",
          }}
        >
          <Icon name={fileName ? "check" : "clip"} size={16} sw={fileName ? 2.4 : 1.7} />
        </span>
        <span style={{ textAlign: "left", lineHeight: 1.3, minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              fontWeight: 600,
              color: fileName ? "var(--accent-ink)" : "var(--ink)",
            }}
          >
            {fileName ? "แนบสลิปแล้ว" : "แนบสลิปโอนเงิน"}
          </span>
          <span
            className="muted"
            style={{
              display: "block",
              fontSize: 11.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fileName || "รูปภาพ PNG / JPG (ไม่บังคับ)"}
          </span>
        </span>
        {fileName && (
          <span className="muted" style={{ marginLeft: "auto" }}>
            <Icon name="receipt" size={18} />
          </span>
        )}
      </button>

      <button
        className="btn btn-primary btn-block"
        disabled={!valid || busy}
        onClick={submit}
      >
        บันทึกการออม
      </button>
    </div>
  );
}
