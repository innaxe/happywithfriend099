"use client";

import { useState } from "react";
import { usePao } from "../pao-provider";
import { colorForNick, isSolo, money, monthsBetween, nowYM, ymAdd } from "@/lib/calc";
import { CURRENCIES, EMOJIS, THEMES } from "@/lib/constants";
import { Sheet } from "../sheet";
import { Avatar } from "../primitives";
import { Select } from "../select";
import { Icon } from "../icon";

type Mode = "group" | "solo";

export function GoalEditor() {
  const { goalDialog } = usePao();
  // remount ทุกครั้งที่เปิด/เปลี่ยนเป้า → useState initializer ตั้งค่าได้ตรง
  return (
    <GoalForm key={`${goalDialog.editing?.id ?? "new"}:${goalDialog.open}`} />
  );
}

function symbolToCode(sym: string): string {
  return CURRENCIES.find((c) => c.symbol === sym)?.code ?? "THB";
}

function GoalForm() {
  const { goalDialog, setGoalDialog, saveGoal, deleteGoal, people, busy } =
    usePao();
  const editing = goalDialog.editing;
  const close = () => setGoalDialog({ open: false, editing: null });

  const initStart = editing?.start ?? nowYM();
  const [mode, setMode] = useState<Mode>(
    editing ? (isSolo(editing) ? "solo" : "group") : "group",
  );
  const [emoji, setEmoji] = useState(editing?.emoji || "✈️");
  const [name, setName] = useState(editing?.name ?? "");
  const [amt, setAmt] = useState(
    editing ? editing.target.toLocaleString("en-US") : "",
  );
  const [curCode, setCurCode] = useState(
    editing ? symbolToCode(editing.currency) : "THB",
  );
  const [start, setStart] = useState(initStart);
  const [end, setEnd] = useState(editing?.end ?? ymAdd(initStart, 11));
  const [theme, setTheme] = useState(editing?.accent ?? THEMES[0]);
  const [sel, setSel] = useState<Set<string>>(
    new Set((editing?.members ?? []).filter((m) => m !== "ฉัน")),
  );

  const toggle = (nick: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(nick)) next.delete(nick);
      else next.add(nick);
      return next;
    });

  // ยอดต่อคน/ต่อเดือน (โชว์สดตอนกรอก เพื่อดูว่าไหวไหมก่อนสร้าง)
  const tgNum = Math.max(0, parseInt(amt.replace(/[^\d]/g, "")) || 0);
  const memCount = mode === "solo" ? 1 : Math.max(1, sel.size);
  const bdStart = start || nowYM();
  const bdEnd = end && end >= bdStart ? end : bdStart;
  const nMonths = monthsBetween(bdStart, bdEnd);
  const perPerson = tgNum / memCount;
  const perMonth = perPerson / nMonths;
  const curSym = CURRENCIES.find((c) => c.code === curCode)?.symbol ?? "฿";

  async function save() {
    if (busy) return;
    const nm = name.trim() || "เป้าหมายของฉัน";
    const tg = Math.max(1, parseInt(amt.replace(/[^\d]/g, "")) || 10000);
    const st = start || nowYM();
    let en = end || ymAdd(st, 11);
    if (en < st) en = st;
    let members = mode === "solo" ? ["ฉัน"] : Array.from(sel);
    if (!members.length) members = ["ฉัน"];
    const symbol = CURRENCIES.find((c) => c.code === curCode)?.symbol ?? "฿";
    await saveGoal(
      {
        name: nm,
        emoji: emoji.trim() || "🎯",
        accent: theme,
        currency: symbol,
        target: tg,
        start: st,
        end: en,
        members,
      },
      editing?.id ?? null,
    );
  }

  const foot = (
    <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>
      {editing ? "บันทึกการแก้ไข" : "สร้างเป้าหมาย"}
    </button>
  );

  return (
    <Sheet
      open={goalDialog.open}
      onClose={close}
      title={editing ? "แก้ไขเป้าหมาย" : "สร้างเป้าหมาย"}
      foot={foot}
    >
      <div className="seg" style={{ marginBottom: 18 }}>
        <button className={mode === "group" ? "on" : ""} onClick={() => setMode("group")}>
          👥 ออมเป็นกลุ่ม
        </button>
        <button className={mode === "solo" ? "on" : ""} onClick={() => setMode("solo")}>
          🙂 ออมคนเดียว
        </button>
      </div>

      <label className="field-label">ไอคอน</label>
      <div
        className="noscroll"
        style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 2 }}
      >
        {EMOJIS.map((e, i) => (
          <button
            key={e + i}
            onClick={() => setEmoji(e)}
            style={{
              flex: "0 0 auto",
              width: 46,
              height: 46,
              borderRadius: 13,
              fontSize: 22,
              display: "grid",
              placeItems: "center",
              background: emoji === e ? "var(--accent-soft)" : "var(--card)",
              border: "1px solid " + (emoji === e ? "var(--accent)" : "var(--border)"),
              transition: "all .14s",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <label className="field-label">ชื่อเป้าหมาย</label>
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="เช่น เที่ยวญี่ปุ่นด้วยกัน"
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10, marginBottom: 16 }}>
        <div>
          <label className="field-label">ยอดเป้าหมาย</label>
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
              {CURRENCIES.find((c) => c.code === curCode)?.symbol ?? "฿"}
            </span>
            <input
              className="input num"
              inputMode="numeric"
              value={amt}
              onChange={(e) => setAmt(e.target.value.replace(/[^\d,]/g, ""))}
              placeholder="450,000"
              style={{ paddingLeft: 26, fontWeight: 700 }}
            />
          </div>
        </div>
        <div>
          <label className="field-label">สกุลเงิน</label>
          <Select
            value={curCode}
            onChange={setCurCode}
            ariaLabel="สกุลเงิน"
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div>
          <label className="field-label">เดือนเริ่ม</label>
          <input
            className="input num"
            type="month"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">ถึงเป้าภายใน</label>
          <input
            className="input num"
            type="month"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {mode === "group" && (
        <>
          <label className="field-label">สมาชิกที่ร่วมออม · {sel.size} คน</label>
          {people.length === 0 ? (
            <div
              className="muted"
              style={{ fontSize: 12.5, marginBottom: 16, lineHeight: 1.5 }}
            >
              ยังไม่มีรายชื่อ — เพิ่มสมาชิกได้ที่เมนู “สมาชิก” (ไอคอนรูปคนด้านบน)
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {people.map((p) => {
                const on = sel.has(p.nick);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.nick)}
                    className={"chip pick" + (on ? " sel" : "")}
                    style={{ padding: "6px 12px 6px 6px", gap: 8 }}
                  >
                    <Avatar nick={p.nick} color={colorForNick(p.nick)} size={22} />
                    {p.nick}
                    {on && <Icon name="check" size={13} sw={2.6} />}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tgNum > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-soft-2)",
            borderRadius: 12,
            padding: "12px 13px",
            marginBottom: 16,
          }}
        >
          <span style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }}>
            <Icon name="info" size={16} />
          </span>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--accent-ink)" }}>
            <div>
              เป้าต่อคน <b className="num">{money(perPerson, curSym)}</b>
              {mode === "solo" ? "" : " · " + memCount + " คน"}
            </div>
            <div>
              เก็บ ~<b className="num">{money(perMonth, curSym)}</b>/คน/เดือน{" "}
              <span className="num" style={{ color: "var(--muted)" }}>
                ({nMonths} เดือน)
              </span>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
              ไหวไหม? ปรับยอด/เดือน/จำนวนคนได้เลยก่อนสร้าง
            </div>
          </div>
        </div>
      )}

      <label className="field-label">สีธีม</label>
      <div className="row" style={{ gap: 11, marginBottom: 6 }}>
        {THEMES.map((c) => (
          <button
            key={c}
            onClick={() => setTheme(c)}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: c,
              display: "grid",
              placeItems: "center",
              boxShadow: theme === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
              transition: "box-shadow .15s",
            }}
          >
            {theme === c && <Icon name="check" size={16} color="#fff" sw={2.8} />}
          </button>
        ))}
      </div>

      {editing && (
        <>
          <hr className="hr" style={{ margin: "18px 0 14px" }} />
          <button
            className="btn btn-block"
            onClick={() => deleteGoal(editing.id)}
            style={{ background: "var(--rose-soft)", color: "var(--rose)", fontWeight: 650 }}
          >
            <Icon name="trash" size={17} /> ลบเป้าหมายนี้
          </button>
        </>
      )}
    </Sheet>
  );
}
