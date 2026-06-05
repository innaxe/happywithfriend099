"use client";

import { useRef, useState } from "react";
import { usePao } from "../pao-provider";
import { colorForNick } from "@/lib/calc";
import { Sheet } from "../sheet";
import { Avatar } from "../primitives";
import { Icon } from "../icon";

export function PeopleDialog() {
  const { peopleOpen, setPeopleOpen } = usePao();
  return (
    <Sheet open={peopleOpen} onClose={() => setPeopleOpen(false)} title="สมาชิกในกลุ่ม">
      <MembersBody />
    </Sheet>
  );
}

function MembersBody() {
  const { people, addPerson, updatePersonReal, removePerson } = usePao();
  const [add, setAdd] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const cancelRef = useRef(false); // กันไม่ให้ commit ตอนกด Escape

  async function addOne() {
    const ok = await addPerson(add, "");
    if (ok) setAdd("");
  }

  return (
    <>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 14, marginTop: -2 }}>
        {people.length} คน · แตะดินสอเพื่อแก้ชื่อจริง (ตามสลิป)
      </div>
      <div className="card" style={{ padding: "2px 14px", marginBottom: 16 }}>
        {people.length === 0 ? (
          <div
            style={{ padding: "16px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}
          >
            ยังไม่มีรายชื่อ — เพิ่มด้านล่างได้เลย
          </div>
        ) : (
          people.map((m, i) => (
            <div
              key={m.id}
              className="row"
              style={{ gap: 11, padding: "11px 0", borderTop: i ? "1px solid var(--border)" : "none" }}
            >
              <Avatar nick={m.nick} color={colorForNick(m.nick)} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editing === m.id ? (
                  <input
                    className="input"
                    defaultValue={m.real}
                    autoFocus
                    placeholder="ชื่อจริง (ตามสลิป)"
                    onBlur={(e) => {
                      if (cancelRef.current) {
                        cancelRef.current = false;
                        setEditing(null);
                        return;
                      }
                      void updatePersonReal(m.id, e.target.value);
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        cancelRef.current = true;
                        e.currentTarget.blur();
                      }
                    }}
                    style={{ padding: "7px 10px", fontSize: 14 }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.15 }}>
                      {m.nick}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {m.real || "ยังไม่ใส่ชื่อจริง"}
                    </div>
                  </>
                )}
              </div>
              <button
                className="iconbtn"
                onClick={() => setEditing(m.id)}
                style={{ width: 32, height: 32 }}
                aria-label="แก้ชื่อจริง"
              >
                <Icon name="pencilSm" size={16} />
              </button>
              <button
                className="iconbtn"
                onClick={() => removePerson(m.id)}
                style={{ width: 32, height: 32, color: "var(--rose)" }}
                aria-label="ลบสมาชิก"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <label className="field-label">เพิ่มสมาชิก</label>
      <div className="row" style={{ gap: 9 }}>
        <input
          className="input"
          value={add}
          placeholder="ชื่อเล่น เช่น มุก"
          onChange={(e) => setAdd(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOne()}
        />
        <button
          className="btn btn-soft"
          style={{ padding: "13px 16px", flex: "0 0 auto" }}
          onClick={addOne}
          aria-label="เพิ่ม"
        >
          <Icon name="plus" size={18} sw={2.2} />
        </button>
      </div>
    </>
  );
}
