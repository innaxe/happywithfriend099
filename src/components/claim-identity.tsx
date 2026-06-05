"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colorForNick } from "@/lib/calc";
import type { Person, PersonRow } from "@/lib/types";
import { Avatar } from "./primitives";
import { Icon } from "./icon";

function toPerson(r: PersonRow): Person {
  return {
    id: r.id,
    nick: r.nick,
    real: r.real ?? "",
    auth_id: r.auth_id ?? null,
    discord_id: r.discord_id ?? null,
    avatar_url: r.avatar_url ?? null,
  };
}

/** ดึงข้อมูลตัวตนจาก Discord ที่ Supabase แนบมาใน user_metadata */
function discordInfo(session: Session) {
  const m = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (m.full_name as string) ||
    (m.name as string) ||
    (m.global_name as string) ||
    (m.user_name as string) ||
    "เพื่อน";
  return {
    uid: session.user.id,
    name,
    avatar: (m.avatar_url as string) || "",
    discordId: (m.provider_id as string) || (m.sub as string) || null,
  };
}

/** หน้าผูกตัวตนครั้งแรก: เลือกชื่อเล่นของตัวเองในกลุ่ม (หรือสร้างใหม่) */
export function ClaimIdentity({
  session,
  onClaimed,
  onLogout,
}: {
  session: Session;
  onClaimed: (p: Person) => void;
  onLogout: () => void;
}) {
  const me = discordInfo(session);
  const [roster, setRoster] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [pickId, setPickId] = useState<string | null>(null);
  const [newNick, setNewNick] = useState("");
  const [newReal, setNewReal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // โหลดรายชื่อที่ยังไม่ถูกผูก (auth_id เป็น null)
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .is("auth_id", null)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        setErr("โหลดรายชื่อไม่ได้: " + error.message);
        setLoading(false);
        return;
      }
      const rows = ((data ?? []) as PersonRow[]).map(toPerson);
      setRoster(rows);
      setMode(rows.length ? "pick" : "create");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function finishWithOwnRow() {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("auth_id", me.uid)
      .maybeSingle();
    if (error || !data) {
      setBusy(false);
      setErr("ยืนยันแล้วแต่โหลดข้อมูลไม่ได้ ลองรีเฟรชหน้า — " + (error?.message ?? ""));
      return;
    }
    onClaimed(toPerson(data as PersonRow));
  }

  async function claimExisting() {
    if (!pickId || busy) return;
    const person = roster.find((p) => p.id === pickId);
    if (!person) return;
    setErr("");
    setBusy(true);
    const { error } = await supabase.rpc("claim_nick", {
      p_nick: person.nick,
      p_discord_id: me.discordId,
      p_avatar_url: me.avatar || null,
    });
    if (error) {
      setBusy(false);
      setErr("ชื่อนี้อาจถูกใช้ไปแล้ว — " + error.message);
      // รีโหลดรายชื่อ เผื่อมีคนเพิ่งจองไป
      const { data } = await supabase
        .from("people")
        .select("*")
        .is("auth_id", null)
        .order("created_at", { ascending: true });
      setRoster(((data ?? []) as PersonRow[]).map(toPerson));
      setPickId(null);
      return;
    }
    await finishWithOwnRow();
  }

  async function createNew() {
    const nick = newNick.trim();
    if (!nick || busy) return;
    setErr("");
    setBusy(true);
    const { data, error } = await supabase
      .from("people")
      .insert({
        nick,
        real: newReal.trim(),
        auth_id: me.uid,
        discord_id: me.discordId,
        avatar_url: me.avatar || null,
      })
      .select()
      .single();
    if (error) {
      setBusy(false);
      setErr(
        /duplicate|unique/i.test(error.message)
          ? "มีชื่อเล่นนี้แล้ว — เลือกจากรายการ หรือใช้ชื่ออื่น"
          : "สร้างไม่สำเร็จ: " + error.message,
      );
      return;
    }
    onClaimed(toPerson(data as PersonRow));
  }

  return (
    <div className="app">
      <div className="app-scroll" style={{ padding: "30px 24px 26px", display: "flex", flexDirection: "column" }}>
        {/* หัว: รูป + ทักทายจาก Discord */}
        <div className="col appear" style={{ alignItems: "center", gap: 12, textAlign: "center", marginBottom: 22 }}>
          {me.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatar}
              alt="โปรไฟล์ Discord"
              width={64}
              height={64}
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <Avatar nick={me.name} color={colorForNick(me.name)} size={64} />
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-.01em" }}>
              สวัสดี {me.name} 👋
            </div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
              เลือกว่าคุณคือใครในกลุ่ม (ทำครั้งเดียว)
              <br />
              จะผูกกับบัญชี Discord นี้ถาวร
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
            <div className="col" style={{ alignItems: "center", gap: 10 }}>
              <Icon
                name="gear"
                size={24}
                color="var(--muted-2)"
                style={{ animation: "spin 1.4s linear infinite" }}
              />
              <span style={{ color: "var(--muted)", fontSize: 13 }}>กำลังโหลดรายชื่อ…</span>
            </div>
          </div>
        ) : mode === "pick" ? (
          <>
            <label className="field-label">เลือกชื่อเล่นของคุณ</label>
            <div
              className="card appear noscroll"
              style={{ padding: "4px 14px", marginBottom: 14, animationDelay: ".05s", maxHeight: "44vh", overflowY: "auto" }}
            >
              {roster.map((p, i) => {
                const on = p.id === pickId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPickId(p.id)}
                    className="row"
                    style={{
                      width: "100%",
                      gap: 11,
                      padding: "12px 4px",
                      borderTop: i ? "1px solid var(--border)" : "none",
                      textAlign: "left",
                    }}
                  >
                    <Avatar nick={p.nick} color={colorForNick(p.nick)} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 650 }}>{p.nick}</div>
                      {p.real && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.real}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flex: "0 0 auto",
                        display: "grid",
                        placeItems: "center",
                        background: on ? "var(--accent)" : "transparent",
                        border: on ? "none" : "2px solid var(--border-strong)",
                      }}
                    >
                      {on && <Icon name="check" size={13} color="#fff" sw={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="muted"
              style={{ fontSize: 11.5, textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}
            >
              ยืนยันแล้วจะผูกกับบัญชี Discord นี้ถาวร
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={!pickId || busy}
              onClick={claimExisting}
            >
              {busy ? "กำลังยืนยัน…" : "ยืนยันว่านี่คือฉัน"}
            </button>

            <button
              onClick={() => {
                setErr("");
                setMode("create");
              }}
              style={{ margin: "14px auto 0", display: "block", fontSize: 13, fontWeight: 600, color: "var(--accent-ink)" }}
            >
              ไม่มีชื่อฉัน — สร้างใหม่
            </button>
          </>
        ) : (
          <>
            <label className="field-label">ชื่อเล่น (โชว์ในแอป)</label>
            <input
              className="input"
              value={newNick}
              autoFocus
              onChange={(e) => setNewNick(e.target.value)}
              placeholder="เช่น แบงค์"
              style={{ marginBottom: 12 }}
            />
            <label className="field-label">ชื่อจริง (ตามสลิป · ไม่บังคับ)</label>
            <input
              className="input"
              value={newReal}
              onChange={(e) => setNewReal(e.target.value)}
              placeholder="เช่น ธนกร ใจดี"
              style={{ marginBottom: 16 }}
            />
            <button
              className="btn btn-primary btn-block"
              disabled={!newNick.trim() || busy}
              onClick={createNew}
            >
              {busy ? "กำลังสร้าง…" : "สร้างและเข้าใช้งาน"}
            </button>
            {roster.length > 0 && (
              <button
                onClick={() => {
                  setErr("");
                  setMode("pick");
                }}
                style={{ margin: "14px auto 0", display: "block", fontSize: 13, fontWeight: 600, color: "var(--accent-ink)" }}
              >
                ← กลับไปเลือกจากรายชื่อ
              </button>
            )}
          </>
        )}

        <div
          style={{ minHeight: 18, marginTop: 12, textAlign: "center", color: "var(--rose)", fontSize: 12.5, fontWeight: 600 }}
        >
          {err}
        </div>

        <button
          onClick={onLogout}
          style={{ margin: "8px auto 0", display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
