// แจ้งเตือนเข้า Discord ผ่าน webhook (โพสต์จาก client ตรงไป Discord — รองรับ CORS)
import type { Goal, Person } from "./types";
import { money, ymLabel, tallies } from "./calc";
import { WEBHOOK_KEY } from "./constants";

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

/** ยิง payload เข้า webhook ปัจจุบัน (เงียบถ้าไม่มี url หรือ error) */
async function post(body: Record<string, unknown>): Promise<boolean> {
  const url = getWebhook();
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

export function getWebhook(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(WEBHOOK_KEY) ?? "";
}

export function setWebhook(url: string): void {
  if (typeof window === "undefined") return;
  if (url) localStorage.setItem(WEBHOOK_KEY, url);
  else localStorage.removeItem(WEBHOOK_KEY);
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
  const url = getWebhook();
  if (!url) return;

  const { saved } = tallies(goal);
  const target = goal.target || 1;
  const pct = Math.round((saved / target) * 100);

  let color = 24432;
  try {
    color = parseInt((goal.accent || "#059669").replace("#", ""), 16);
  } catch {
    color = 24432;
  }

  const real = people.find((p) => p.nick === c.name)?.real ?? "";
  const disp = real || c.name;

  const embed: Record<string, unknown> = {
    title: "✅ " + disp + " โอนแล้ว " + money(c.amount, goal.currency),
    color,
    description:
      (goal.emoji || "🎯") +
      " " +
      goal.name +
      " · งวด " +
      ymLabel(c.month) +
      (real ? " · ชื่อเล่น " + c.name : "") +
      (c.note ? " · " + c.note : ""),
    fields: [
      {
        name: "ยอดสะสมตอนนี้",
        value:
          money(saved, goal.currency) +
          " / " +
          money(target, goal.currency) +
          " (" +
          pct +
          "%)",
      },
    ],
    footer: { text: "เป้าเงิน" },
    timestamp: new Date().toISOString(),
  };
  if (slipUrl) embed.image = { url: slipUrl };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "เป้าเงิน", embeds: [embed] }),
    });
  } catch {
    // เงียบไว้ — แจ้งเตือนล้มเหลวไม่ควรทำให้การบันทึกล้ม
  }
}

/** แจ้ง Discord เมื่อมีโพสต์ไดอารี่ใหม่ (เล่าว่าไปไหนทำอะไร + รูป) */
export async function notifyUpdate(
  goal: Goal,
  people: Person[],
  author: string,
  text: string,
  imageUrl: string,
): Promise<void> {
  const embed: Record<string, unknown> = {
    title: "📝 " + dispName(people, author) + " อัพเดทไดอารี่กลุ่ม",
    color: embedColor(goal.accent),
    description:
      (goal.emoji || "🎯") + " " + goal.name + (text ? "\n\n" + text : ""),
    footer: { text: "เป้าเงิน · ไดอารี่กลุ่ม" },
    timestamp: new Date().toISOString(),
  };
  if (imageUrl) embed.image = { url: imageUrl };
  await post({ embeds: [embed] });
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
  await post({ embeds: [embed] });
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
  return post({ embeds: [embed] });
}

/** ยิง embed ทดสอบเข้า webhook ปัจจุบัน (ปุ่ม "ทดสอบส่งแจ้งเตือน") */
export async function sendDiscordTest(): Promise<boolean> {
  const url = getWebhook();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "เป้าเงิน",
        embeds: [
          {
            title: "🔔 ทดสอบแจ้งเตือน",
            description:
              "การเชื่อมต่อ Discord ทำงานปกติ — เพื่อน ๆ จะได้รับแจ้งเตือนทุกครั้งที่มีคนบันทึกการออม",
            color: 24432,
            footer: { text: "เป้าเงิน" },
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
