"use client";

import { useRef, useState } from "react";
import { usePao } from "./pao-provider";
import { clampMonth, colorForNick, monthsList, nowYM, ymLabel } from "@/lib/calc";
import { compressImage } from "@/lib/image";
import type { Goal } from "@/lib/types";
import { Avatar } from "./primitives";
import { Select } from "./select";
import { Icon } from "./icon";

// remount ด้วย key={goal.id} จาก dashboard → state เริ่มต้นจาก goal ได้ตรง ๆ
export function ContributionForm({ goal }: { goal: Goal }) {
  const { addContribution, checkSlipUsed, busy, myNick, myAvatar } = usePao();
  const months = monthsList(goal);

  const [month, setMonth] = useState<string>(() => clampMonth(nowYM(), goal));
  const [amt, setAmt] = useState(""); // ยอดที่ดึงจากสลิป (อ่านอย่างเดียว)
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [readErr, setReadErr] = useState(false);
  const [slipRef, setSlipRef] = useState<string | null>(null); // เลขที่รายการ
  const [dup, setDup] = useState(false); // สลิปนี้เคยใช้แล้ว
  const fileRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  // แนบสลิป → ดึงยอด + เลขที่รายการจากสลิป + เช็กว่าเคยใช้ไหม
  async function readSlip(file: File) {
    setReading(true);
    setReadErr(false);
    setDup(false);
    setAmt("");
    setSlipRef(null);
    try {
      const img = await compressImage(file);
      const fd = new FormData();
      fd.append("file", img);
      const res = await fetch("/api/read-slip", { method: "POST", body: fd });
      const data = res.ok
        ? ((await res.json()) as {
            amount?: number | null;
            ref?: string | null;
          })
        : null;
      if (data?.amount && data.amount > 0) setAmt(String(data.amount));
      else setReadErr(true);
      const ref = data?.ref ?? null;
      setSlipRef(ref);
      if (ref && (await checkSlipUsed(ref))) setDup(true);
    } catch {
      setReadErr(true);
    } finally {
      setReading(false);
    }
  }

  const numAmt = Number(amt.replace(/,/g, ""));
  const valid = numAmt > 0 && !reading && !dup;

  async function submit() {
    if (!valid || busy || submitting.current) return;
    submitting.current = true;
    try {
      const file = fileRef.current?.files?.[0] ?? null;
      const ok = await addContribution({
        name: myNick, // บันทึกเป็นชื่อคนที่ล็อกอินเสมอ
        month,
        amount: String(numAmt),
        note,
        file,
        slipRef,
      });
      if (ok) {
        setAmt("");
        setNote("");
        setFileName("");
        setReadErr(false);
        setDup(false);
        setSlipRef(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <div className="card" style={{ margin: "14px 18px 0", padding: 18 }}>
      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <span style={{ color: "var(--accent)" }}>
          <Icon name="plus" size={18} sw={2.2} />
        </span>
        <span style={{ fontWeight: 700, fontSize: 15.5 }}>บันทึกการออม</span>
      </div>

      {/* บันทึกในชื่อตัวเอง (ไม่มี picker แล้ว) */}
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {myAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={myAvatar}
            alt=""
            width={26}
            height={26}
            style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <Avatar nick={myNick} color={colorForNick(myNick)} size={26} />
        )}
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          บันทึกในชื่อ <b style={{ color: "var(--ink)" }}>{myNick}</b>
        </span>
      </div>

      {/* แนบสลิป (ขับเคลื่อนยอดเงิน) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFileName(f?.name ?? "");
          if (f) void readSlip(f);
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="row"
        style={{
          width: "100%",
          gap: 9,
          padding: "12px 13px",
          marginBottom: 12,
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
            {reading
              ? "กำลังอ่านยอดจากสลิป…"
              : fileName
                ? "แนบสลิปแล้ว"
                : "แนบสลิปโอนเงิน"}
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
            {fileName || "แนบแล้วระบบจะอ่านยอดให้อัตโนมัติ"}
          </span>
        </span>
        {fileName && (
          <span className="muted" style={{ marginLeft: "auto" }}>
            <Icon name="receipt" size={18} />
          </span>
        )}
      </button>

      {/* เดือน + ยอด (ยอดอ่านจากสลิปอย่างเดียว แก้เองไม่ได้) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.05fr",
          gap: 10,
          marginBottom: dup || readErr ? 6 : 12,
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
          <label className="field-label">จำนวน (จากสลิป)</label>
          <div
            className="input num"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: 700,
              color: amt ? "var(--ink)" : "var(--muted-2)",
            }}
          >
            {reading
              ? "กำลังอ่าน…"
              : amt
                ? goal.currency + Number(amt).toLocaleString("en-US")
                : "— แนบสลิป"}
          </div>
        </div>
      </div>

      {dup ? (
        <div
          className="row"
          style={{ gap: 6, margin: "0 0 12px", fontSize: 11.5, color: "var(--rose)", fontWeight: 600 }}
        >
          <Icon name="info" size={13} /> สลิปนี้ถูกใช้ไปแล้ว — แนบสลิปอื่น
        </div>
      ) : readErr ? (
        <div
          className="row"
          style={{ gap: 6, margin: "0 0 12px", fontSize: 11.5, color: "var(--rose)" }}
        >
          <Icon name="info" size={13} /> อ่านยอดอัตโนมัติไม่สำเร็จ — ลองแนบอีกครั้ง
        </div>
      ) : null}

      <label className="field-label">หมายเหตุ</label>
      <input
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="เช่น งวดเดือนนี้ / เก็บเพิ่ม"
        style={{ marginBottom: 14 }}
      />

      <button
        className="btn btn-primary btn-block"
        disabled={!valid || busy}
        onClick={submit}
      >
        {reading
          ? "กำลังอ่านสลิป…"
          : dup
            ? "สลิปนี้ใช้ไปแล้ว"
            : amt
              ? "บันทึกการออม"
              : "แนบสลิปก่อนบันทึก"}
      </button>
    </div>
  );
}
