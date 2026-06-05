// แจ้งเตือนเข้า Discord ผ่าน webhook (โพสต์จาก client ตรงไป Discord — รองรับ CORS)
import type { Goal, Person } from "./types";
import { money, ymLabel, tallies } from "./calc";

/** Webhook แยกตามห้อง Discord — ออมเงิน vs ไดอารี่ (เก็บส่วนกลางใน Supabase) */
export type Hook = "savings" | "diary";

// cache ในหน่วยความจำ — provider เติมค่าจากตาราง app_settings หลังโหลด
// (ฟังก์ชันแจ้งเตือนเรียกแบบ sync ได้เลย ไม่ต้อง await)
const hookCache: Record<Hook, string> = { savings: "", diary: "" };

/** provider เรียกหลังโหลดค่า webhook ส่วนกลางมาแล้ว */
export function applyWebhookCache(savings: string, diary: string): void {
  hookCache.savings = savings ?? "";
  hookCache.diary = diary ?? "";
}

/** แปลงสีธีม hex ของเป้า → ตัวเลขสีของ Discord embed */
function embedColor(accent: string): number {
  try {
    return parseInt((accent || "#059669").replace("#", ""), 16);
  } catch {
    return 24432;
  }
}

/** ชื่อที่จะโชว์ใน Discord: ใช้ชื่อจริงถ้ามี ไม่งั้นใช้ชื่อเล่น */
function dispName(people: Person[], nick: string): string {
  return people.find((p) => p.nick === nick)?.real || nick;
}

/** ยิง payload เข้า webhook ของห้องที่ระบุ (เงียบถ้าไม่มี url หรือ error) */
async function post(
  body: Record<string, unknown>,
  kind: Hook,
): Promise<boolean> {
  const url = getWebhook(kind);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "เป้าเงิน", ...body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** อ่าน webhook ส่วนกลางจาก cache (ใช้ในฟังก์ชันแจ้งเตือน) */
export function getWebhook(kind: Hook): string {
  return hookCache[kind] ?? "";
}

/** ยิง payload ไปยัง webhook URL ที่ระบุตรง ๆ (ใช้ตอนกดทดสอบค่าที่เพิ่งพิมพ์) */
async function postTo(
  url: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "เป้าเงิน", ...body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface NotifyPayload {
  name: string; // ชื่อเล่นของคนที่โอน
  month: string;
  amount: number;
  note: string;
}

/**
 * ส่ง embed เข้า Discord
 * @param goal เป้า "หลังรีโหลด" (มี contribution ใหม่รวมแล้ว เพื่อให้ยอดสะสมถูกต้อง)
 */
export async function notifyDiscord(
  goal: Goal,
  people: Person[],
  c: NotifyPayload,
  slipUrl: string,
): Promise<void> {
  if (!getWebhook("savings")) return;

  // ยอดของ "คนนั้น" เทียบเป้าต่อคน (ไม่ใช่ยอดรวมทั้งกลุ่ม)
  const { by } = tallies(goal);
  const memCount = Math.max(1, goal.members.length);
  const perPersonTarget = (goal.target || 0) / memCount;
  const personSaved = by[c.name] ?? 0;
  const pct =
    perPersonTarget > 0 ? Math.round((personSaved / perPersonTarget) * 100) : 0;

  const person = people.find((p) => p.nick === c.name);
  const disp = person?.real || c.name; // ชื่อที่โชว์เป็นหัวข้อความ
  const avatarUrl = person?.avatar_url || undefined; // รูปโปรไฟล์ Discord ของคนโอน

  const embed: Record<string, unknown> = {
    title: "✅ โอนแล้ว " + money(c.amount, goal.currency),
    color: embedColor(goal.accent),
    description:
      (goal.emoji || "🎯") +
      " " +
      goal.name +
      " · งวด " +
      ymLabel(c.month) +
      (c.note ? "\n📝 " + c.note : ""),
    fields: [
      {
        name: "ของ " + c.name + " (เทียบเป้าตัวเอง)",
        value:
          money(personSaved, goal.currency) +
          " / " +
          money(perPersonTarget, goal.currency) +
          " (" +
          pct +
          "%)" +
          (pct >= 100 ? " · ครบแล้ว 🎉" : ""),
      },
    ],
    footer: { text: "เป้าเงิน" },
    timestamp: new Date().toISOString(),
  };
  if (slipUrl) embed.image = { url: slipUrl };
  // username + avatar_url = โปรไฟล์คนโอน (โชว์เป็นหัวข้อความเหมือนคนนั้นส่งเอง)
  await post(
    { username: disp, avatar_url: avatarUrl, embeds: [embed] },
    "savings",
  );
}

/**
 * โพสต์ไดอารี่ → ส่งเข้าห้องไดอารี่แบบ "ข้อความแชทปกติ"
 * (โปรไฟล์ = รูป+ชื่อของคนโพสต์ · ข้อความตรง ๆ · รูปเป็นไฟล์แนบจริง)
 */
export async function notifyUpdate(
  people: Person[],
  author: string,
  text: string,
  imageUrl: string,
): Promise<void> {
  const url = getWebhook("diary");
  if (!url) return;

  const username = (dispName(people, author) || "สมาชิก").slice(0, 80);
  const avatarUrl = people.find((p) => p.nick === author)?.avatar_url || undefined;
  const content = text || "";

  // มีรูป → พยายามอัปเป็นไฟล์แนบจริง (ดูเหมือนแชทส่งรูป ไม่มีกล่อง embed)
  if (imageUrl) {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({ username, avatar_url: avatarUrl, content }),
      );
      form.append("files[0]", blob, "photo." + ext);
      const r = await fetch(url, { method: "POST", body: form });
      if (r.ok) return;
    } catch {
      // ดึงรูปไม่ได้ → ตกไปแนบลิงก์รูปท้ายข้อความแทน
    }
  }

  const finalContent = imageUrl
    ? content
      ? content + "\n" + imageUrl
      : imageUrl
    : content;
  if (!finalContent) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar_url: avatarUrl, content: finalContent }),
    });
  } catch {
    // เงียบ — แจ้งเตือนล้มเหลวไม่ควรทำให้การโพสต์ล้ม
  }
}

/** แจ้ง Discord เมื่อยอดสะสมแตะหมุดหมาย (25/50/75/100%) */
export async function notifyMilestone(
  goal: Goal,
  pct: number,
): Promise<void> {
  const { saved } = tallies(goal);
  const target = goal.target || 1;
  const headline =
    pct >= 100
      ? "🏆 ถึงเป้าแล้ว! 100%"
      : "🎉 ก้าวถึง " + pct + "% แล้ว!";
  const embed = {
    title: headline,
    color: embedColor(goal.accent),
    description:
      (goal.emoji || "🎯") +
      " " +
      goal.name +
      "\nยอดสะสม " +
      money(saved, goal.currency) +
      " / " +
      money(target, goal.currency) +
      (pct >= 100 ? "\n\nเก่งมากทุกคน 🥳" : "\n\nไปต่อกัน 💪"),
    footer: { text: "เป้าเงิน" },
    timestamp: new Date().toISOString(),
  };
  await post({ embeds: [embed] }, "savings"); // → ห้องประวัติออมเงิน
}

/** เตือนใน Discord ว่าใครยังไม่โอนเดือนนี้ */
export async function notifyNudge(
  goal: Goal,
  people: Person[],
  unpaid: string[],
): Promise<boolean> {
  if (!unpaid.length) return false;
  const names = unpaid.map((n) => dispName(people, n)).join(", ");
  const embed = {
    title: "🔔 เตือนงวดเดือนนี้",
    color: embedColor(goal.accent),
    description:
      (goal.emoji || "🎯") +
      " " +
      goal.name +
      "\nยังไม่ได้โอนงวดนี้: **" +
      names +
      "**\nอย่าลืมโอนแล้วบันทึกในแอปนะ 🙏",
    footer: { text: "เป้าเงิน" },
    timestamp: new Date().toISOString(),
  };
  return post({ embeds: [embed] }, "savings"); // → ห้องประวัติออมเงิน
}

/** ยิง embed ทดสอบเข้า webhook URL ที่ระบุ (ทดสอบค่าที่เพิ่งพิมพ์) */
export async function sendDiscordTest(kind: Hook, url: string): Promise<boolean> {
  const label = kind === "diary" ? "ไดอารี่กลุ่ม" : "ประวัติการออม";
  return postTo(url, {
    embeds: [
      {
        title: "🔔 ทดสอบ — " + label,
        description: "เชื่อมต่อ Discord ห้องนี้สำเร็จ ✅ การแจ้งเตือนจะเข้าห้องนี้",
        color: 24432,
        footer: { text: "เป้าเงิน" },
      },
    ],
  });
}
