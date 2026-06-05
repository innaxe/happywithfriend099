"use client";

import { useState } from "react";
import { usePao } from "../pao-provider";
import { clampMonth, colorForNick, isSolo, monthsList, ymLabel } from "@/lib/calc";
import { Sheet } from "../sheet";
import { Select } from "../select";
import { Avatar } from "../primitives";
import { Icon } from "../icon";

export function EditContributionDialog() {
  const { editingContribution, setEditingContribution } = usePao();
  return (
    <Sheet
      open={!!editingContribution}
      onClose={() => setEditingContribution(null)}
      title="แก้ไขรายการ"
    >
      {editingContribution && <EditBody key={editingContribution.id} />}
    </Sheet>
  );
}

function EditBody() {
  const { editingContribution, goals, activeGoal, updateContribution, busy } =
    usePao();
  const c = editingContribution;

  const goal = goals.find((g) => g.id === c?.goal_id) ?? activeGoal;
  const solo = goal ? isSolo(goal) : true;
  const months = goal ? monthsList(goal) : c ? [c.month] : [];
  const members = goal?.members ?? [];
  const cur = goal?.currency ?? "฿";

  const [who, setWho] = useState(c?.name ?? "");
  const [month, setMonth] = useState(
    c ? (goal ? clampMonth(c.month, goal) : c.month) : "",
  );
  const [amt, setAmt] = useState(c ? String(c.amount) : "");
  const [note, setNote] = useState(c?.note ?? "");

  if (!c) return null;

  const numAmt = Number(amt.replace(/,/g, ""));
  const valid = !!amt && numAmt > 0;

  async function save() {
    if (!valid || busy) return;
    await updateContribution(c!.id, {
      name: solo ? c!.name : who,
      month,
      amount: numAmt,
      note: note.trim(),
    });
  }

  return (
    <>
      {!solo && members.length > 0 && (
        <>
          <label className="field-label">ใครโอน</label>
          <div
            className="noscroll"
            style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}
          >
            {members.map((m) => {
              const on = m === who;
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 10, marginBottom: 12 }}>
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
              {cur}
            </span>
            <input
              className="input num"
              inputMode="numeric"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d,]/g, ""))}
              style={{ paddingLeft: 26, fontWeight: 650 }}
            />
          </div>
        </div>
      </div>

      <label className="field-label">หมายเหตุ</label>
      <input
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="เช่น งวดเดือนนี้ / เก็บเพิ่ม"
        style={{ marginBottom: 16 }}
      />

      <button className="btn btn-primary btn-block" disabled={!valid || busy} onClick={save}>
        <Icon name="check" size={18} sw={2.4} /> บันทึกการแก้ไข
      </button>
      <div className="muted" style={{ textAlign: "center", fontSize: 11.5, marginTop: 10 }}>
        แก้ไขจะไม่ส่งแจ้งเตือน Discord ซ้ำ
      </div>
    </>
  );
}
