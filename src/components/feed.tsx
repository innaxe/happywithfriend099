"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePao } from "./pao-provider";
import { colorForNick, relativeTime } from "@/lib/calc";
import { REACTIONS } from "@/lib/constants";
import type { Goal, Update } from "@/lib/types";
import { Avatar, SectionHead } from "./primitives";
import { Icon } from "./icon";

/** หน้าไดอารี่กลุ่ม: เลือกทริป + ช่องโพสต์ + ฟีดอัพเดท */
export function Feed({ goal }: { goal: Goal }) {
  const { updates } = usePao();

  const posts = useMemo(
    () =>
      updates
        .filter((u) => u.goal_id === goal.id)
        .sort((a, b) => {
          const ta = a.created_at ? Date.parse(a.created_at) : 0;
          const tb = b.created_at ? Date.parse(b.created_at) : 0;
          return tb - ta || String(b.id).localeCompare(String(a.id));
        }),
    [updates, goal.id],
  );

  return (
    <div style={{ padding: "4px 18px 24px" }}>
      <div style={{ margin: "8px 0 12px" }}>
        <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: "-.01em" }}>
          ไดอารี่กลุ่ม
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
          เลือกทริปเพื่อดูและบันทึกเรื่องราว แชร์รูปให้เพื่อน ๆ เห็น
        </div>
      </div>

      <TripPicker activeId={goal.id} />

      <Composer />

      <div style={{ marginTop: 18 }}>
        <SectionHead
          title="อัพเดทล่าสุด"
          sub={posts.length ? posts.length + " โพสต์" : undefined}
        />
        {posts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "30px 20px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            ยังไม่มีอัพเดท — เป็นคนแรกที่เล่าเรื่องราวของกลุ่ม ✨
          </div>
        ) : (
          <div className="col" style={{ gap: 14 }}>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** แถบเลือกทริป: เห็นทุกทริปที่มี + จำนวนโพสต์ไดอารี่ของแต่ละทริป */
function TripPicker({ activeId }: { activeId: string }) {
  const { goals, switchGoal, newGoal, updates } = usePao();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const countByGoal = useMemo(() => {
    const m: Record<string, number> = {};
    updates.forEach((u) => {
      if (u.goal_id) m[u.goal_id] = (m[u.goal_id] ?? 0) + 1;
    });
    return m;
  }, [updates]);

  // เลื่อนให้ทริปที่เลือกอยู่ในระยะมองเห็นแนวนอนเสมอ (เวลาสลับทริปหรือมีหลายทริป)
  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(
      '[data-active="1"]',
    );
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [activeId, goals.length]);

  if (goals.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      className="noscroll"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "3px 0 4px",
        marginBottom: 12,
      }}
    >
      {goals.map((g) => {
        const on = g.id === activeId;
        const n = countByGoal[g.id] ?? 0;
        return (
          <button
            key={g.id}
            onClick={() => switchGoal(g.id)}
            aria-pressed={on}
            data-active={on ? "1" : undefined}
            aria-label={n > 0 ? `${g.name}, ${n} โพสต์ในไดอารี่` : g.name}
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 13px",
              borderRadius: 999,
              border: "1px solid " + (on ? "var(--accent)" : "var(--border-strong)"),
              background: on ? "var(--accent-soft)" : "var(--card)",
              boxShadow: on
                ? "0 0 0 3px color-mix(in srgb, var(--accent), transparent 86%)"
                : "var(--sh-sm)",
              transition: "border .15s, background .15s, box-shadow .15s",
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>{g.emoji}</span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: on ? 700 : 600,
                color: on ? "var(--accent-ink)" : "var(--ink)",
                whiteSpace: "nowrap",
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {g.name}
            </span>
            {n > 0 && (
              <span
                className="row"
                style={{
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px 1px 5px",
                  borderRadius: 999,
                  background: on ? "var(--accent-soft-2)" : "var(--track)",
                  color: on ? "var(--accent-ink)" : "var(--muted)",
                }}
              >
                <Icon name="book" size={11} sw={1.9} />
                <span className="num">{n}</span>
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={newGoal}
        aria-label="เพิ่มทริปใหม่"
        style={{
          flex: "0 0 auto",
          width: 40,
          height: 40,
          borderRadius: 999,
          border: "1px dashed var(--border-strong)",
          color: "var(--muted)",
          display: "grid",
          placeItems: "center",
          background: "transparent",
        }}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

/** ช่องเขียนอัพเดท + แนบรูป (โพสต์ในชื่อที่ยืนยันจาก Discord) */
function Composer() {
  const { addUpdate, myNick, myAvatar, busy } = usePao();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false); // กันกดโพสต์ซ้ำเร็ว ๆ แล้วได้ 2 โพสต์

  function pickFile(f: File | null) {
    setFileName(f?.name ?? "");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const file = fileRef.current?.files?.[0] ?? null;
      const ok = await addUpdate({ text, file });
      if (ok) {
        setText("");
        pickFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      submitting.current = false;
    }
  }

  const canPost = (!!text.trim() || !!fileName) && !busy;

  return (
    <div className="card" style={{ padding: 15, marginTop: 12 }}>
      <div className="row" style={{ gap: 8, marginBottom: 11 }}>
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
        <span
          className="row"
          style={{ fontSize: 12.5, color: "var(--muted)", gap: 4, minWidth: 0 }}
        >
          โพสต์ในชื่อ
          <b
            style={{
              color: "var(--ink)",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {myNick}
          </b>
        </span>
      </div>
      <textarea
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"วันนี้กลุ่มเราทำอะไรมาบ้าง... เช่น ไปดูสถานที่จัดทริปมา 🚗"}
        rows={3}
        style={{ marginBottom: 11 }}
      />

      {preview && (
        <div style={{ position: "relative", marginBottom: 11 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="ตัวอย่างรูป"
            style={{
              width: "100%",
              maxHeight: 240,
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
            }}
          />
          <button
            onClick={() => {
              pickFile(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            aria-label="เอารูปออก"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(15,23,42,.6)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="x" size={15} sw={2.4} />
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      <div className="between">
        <button
          onClick={() => fileRef.current?.click()}
          className="row"
          style={{
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent-ink)",
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--accent-soft)",
          }}
        >
          <Icon name="image" size={17} /> {fileName ? "เปลี่ยนรูป" : "แนบรูป"}
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 18px" }}
          disabled={!canPost}
          onClick={submit}
        >
          <Icon name="send" size={16} sw={2} /> โพสต์
        </button>
      </div>
    </div>
  );
}

/** avatar ของผู้เขียน: ใช้รูป Discord ถ้ามี (lookup จาก people) ไม่งั้น fallback ตัวอักษร */
function AuthorAvatar({ nick, size }: { nick: string; size: number }) {
  const { people } = usePao();
  const [broken, setBroken] = useState(false);
  const url = people.find((p) => p.nick === nick)?.avatar_url ?? "";
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }}
      />
    );
  }
  return <Avatar nick={nick} color={colorForNick(nick)} size={size} />;
}

/** การ์ดอัพเดท 1 โพสต์: เนื้อหา + รูป + รีแอกชัน + คอมเมนต์ */
function PostCard({ post }: { post: Update }) {
  const { deleteUpdate, toggleReaction, myNick } = usePao();
  const [showComments, setShowComments] = useState(false);
  const mine = post.author === myNick; // ลบได้เฉพาะโพสต์ของตัวเอง

  // นับรีแอกชันต่ออิโมจิ + เช็คว่าฉันกดอันไหน
  const counts: Record<string, number> = {};
  const mineSet = new Set<string>();
  post.reactions.forEach((r) => {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    if (r.author === myNick) mineSet.add(r.emoji);
  });
  const when = relativeTime(post.created_at);
  const totalComments = post.comments.length;

  return (
    <div className="card" style={{ padding: 15 }}>
      <div className="row" style={{ gap: 10, marginBottom: post.text ? 10 : 8 }}>
        <AuthorAvatar nick={post.author} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
            {post.author}
          </div>
          <div className="muted" style={{ fontSize: 11.5 }}>
            {when}
          </div>
        </div>
        {mine && (
          <button
            className="iconbtn"
            style={{ width: 28, height: 28, color: "var(--muted-2)" }}
            onClick={() => deleteUpdate(post.id)}
            aria-label="ลบโพสต์"
          >
            <Icon name="trash" size={15} />
          </button>
        )}
      </div>

      {post.text && (
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            marginBottom: post.image_url ? 11 : 12,
          }}
        >
          {post.text}
        </div>
      )}

      {post.image_url && (
        <a href={post.image_url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="รูปอัพเดท"
            loading="lazy"
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
              marginBottom: 12,
            }}
          />
        </a>
      )}

      {/* แถวรีแอกชัน */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {REACTIONS.map((emo) => {
          const n = counts[emo] ?? 0;
          const on = mineSet.has(emo);
          return (
            <button
              key={emo}
              onClick={() => toggleReaction(post.id, emo)}
              className="reax"
              data-on={on ? "1" : undefined}
            >
              <span style={{ fontSize: 15 }}>{emo}</span>
              {n > 0 && <span className="num reax-n">{n}</span>}
            </button>
          );
        })}
      </div>

      {/* คอมเมนต์ */}
      <button
        onClick={() => setShowComments((s) => !s)}
        className="row"
        style={{
          gap: 6,
          marginTop: 11,
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--muted)",
        }}
      >
        <Icon name="comment" size={15} />
        {totalComments > 0
          ? totalComments + " ความคิดเห็น"
          : "แสดงความคิดเห็น"}
      </button>

      {showComments && <Comments post={post} />}
    </div>
  );
}

/** รายการคอมเมนต์ + ช่องเพิ่มคอมเมนต์ */
function Comments({ post }: { post: Update }) {
  const { addComment, deleteComment, myNick } = usePao();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await addComment(post.id, text);
    setSending(false);
    if (ok) setText("");
  }

  return (
    <div style={{ marginTop: 11 }}>
      <hr className="hr" style={{ marginBottom: 11 }} />
      {post.comments.length > 0 && (
        <div className="col" style={{ gap: 10, marginBottom: 11 }}>
          {post.comments.map((c) => (
            <div key={c.id} className="row" style={{ gap: 9, alignItems: "flex-start" }}>
              <AuthorAvatar nick={c.author} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.author}</span>
                  <span className="muted" style={{ fontSize: 10.5 }}>
                    {relativeTime(c.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                  {c.text}
                </div>
              </div>
              {c.author === myNick && (
                <button
                  className="iconbtn"
                  style={{ width: 24, height: 24, color: "var(--muted-2)", flex: "0 0 auto" }}
                  onClick={() => deleteComment(c.id)}
                  aria-label="ลบคอมเมนต์"
                >
                  <Icon name="x" size={13} sw={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="เขียนความคิดเห็น…"
          aria-label="เขียนความคิดเห็น กด Enter เพื่อส่ง"
          style={{ padding: "10px 12px", fontSize: 13.5 }}
        />
        <button
          className="btn btn-soft"
          style={{ padding: "10px 13px", flex: "0 0 auto" }}
          onClick={send}
          disabled={!text.trim() || sending}
          aria-label="ส่งความคิดเห็น"
        >
          <Icon name="send" size={16} sw={2} />
        </button>
      </div>
    </div>
  );
}
