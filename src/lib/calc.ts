// สูตรคำนวณทั้งหมด พอร์ตตรงจาก reference-app.html (ดู SPEC §8)
import type { Goal } from "./types";
import { AV, MILESTONES, THMON } from "./constants";

/** ใส่สัญลักษณ์สกุลเงิน + คั่นหลักพัน (ปัดเป็นจำนวนเต็ม) */
export function money(n: number, cur = "฿"): string {
  return cur + Math.round(n).toLocaleString("en-US");
}

/** บวกเดือน n เดือนเข้ากับ YYYY-MM */
export function ymAdd(ym: string, n: number): string {
  const [y0, m0] = ym.split("-").map(Number);
  let y = y0;
  let m = m0 - 1 + n;
  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return y + "-" + String(m + 1).padStart(2, "0");
}

/** ป้ายเดือนไทย + ปี พ.ศ. 2 หลัก เช่น "ก.ค. 69" */
export function ymLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return THMON[m - 1] + " " + String(y + 543).slice(-2);
}

/** เดือนปัจจุบันในรูปแบบ YYYY-MM */
export function nowYM(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

/** จำนวนเดือนระหว่าง start..end (รวมปลายทั้งสอง อย่างน้อย 1) */
export function monthsBetween(s: string, e: string): number {
  const [sy, sm] = s.split("-").map(Number);
  const [ey, em] = e.split("-").map(Number);
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
}

/** รายการเดือนทั้งหมดของเป้า */
export function monthsList(g: Pick<Goal, "start" | "end">): string[] {
  const n = monthsBetween(g.start, g.end);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(ymAdd(g.start, i));
  return out;
}

/** จำนวนเดือนที่ผ่านมาแล้ว (เดือนที่ <= ปัจจุบัน) */
export function elapsedMonths(g: Pick<Goal, "start" | "end">): number {
  const cur = nowYM();
  let n = 0;
  for (const ym of monthsList(g)) if (ym <= cur) n++;
  return n;
}

/** เดือนที่เหลือ */
export function leftMonths(g: Pick<Goal, "start" | "end">): number {
  return Math.max(0, monthsBetween(g.start, g.end) - elapsedMonths(g));
}

/** เป้าแบบเดี่ยว (สมาชิก <= 1 คน) */
export function isSolo(g: Pick<Goal, "members">): boolean {
  return (g.members ?? []).length <= 1;
}

/** รวมยอดต่อคน + ยอดรวม */
export function tallies(
  g: Pick<Goal, "members" | "contributions">,
): { by: Record<string, number>; saved: number } {
  const by: Record<string, number> = {};
  (g.members ?? []).forEach((m) => {
    by[m] = 0;
  });
  (g.contributions ?? []).forEach((x) => {
    if (!(x.name in by)) by[x.name] = 0;
    by[x.name] += Number(x.amount) || 0;
  });
  const saved = Object.keys(by).reduce((s, k) => s + by[k], 0);
  return { by, saved };
}

/** บีบเดือนให้อยู่ในช่วง start..end ของเป้า */
export function clampMonth(ym: string, g: Pick<Goal, "start" | "end">): string {
  const min = g.start;
  const max = g.end;
  return ym < min ? min : ym > max ? max : ym;
}

/** เปอร์เซ็นต์ความคืบหน้า (0..100) */
export function pctOf(saved: number, target: number): number {
  return Math.min(100, (saved / (target || 1)) * 100);
}

export interface GoalStats {
  by: Record<string, number>;
  saved: number;
  target: number;
  pct: number; // 0..100
  months: number;
  memCount: number;
  elapsed: number;
  left: number;
  remain: number;
  perPersonTarget: number;
  planPer: number; // ต่อคน/เดือน
  planTotalMonthly: number; // target/จำนวนเดือน
  expectedPer: number; // ที่ควรเก็บได้ต่อคน ณ ตอนนี้
  onTrack: number; // จำนวนคนที่เก็บตามเป้า
  solo: boolean;
}

/** รวมตัวเลขสรุปทั้งหมดของเป้า (พอร์ตจาก render() ใน reference) */
export function deriveGoalStats(g: Goal): GoalStats {
  const { by, saved } = tallies(g);
  const target = g.target || 1;
  const pct = Math.min(100, (saved / target) * 100);
  const months = monthsBetween(g.start, g.end);
  const memCount = Math.max(1, (g.members ?? []).length);
  const elapsed = elapsedMonths(g);
  const left = leftMonths(g);
  const remain = Math.max(0, target - saved);
  const perPersonTarget = target / memCount;
  const planPer = perPersonTarget / months;
  const planTotalMonthly = target / months;
  const expectedPer = (perPersonTarget * elapsed) / months;
  // ยังไม่เริ่มเป้า (elapsed=0 → expectedPer=0) ไม่นับว่าใครเก็บตามเป้า
  let onTrack = 0;
  if (expectedPer > 0) {
    (g.members ?? []).forEach((m) => {
      if ((by[m] ?? 0) >= expectedPer * 0.999) onTrack++;
    });
  }
  return {
    by,
    saved,
    target,
    pct,
    months,
    memCount,
    elapsed,
    left,
    remain,
    perPersonTarget,
    planPer,
    planTotalMonthly,
    expectedPer,
    onTrack,
    solo: isSolo(g),
  };
}

/** สีประจำคนจากชื่อเล่น (คงที่ ไม่ขึ้นกับลำดับ) */
export function colorForNick(nick: string): string {
  let h = 0;
  for (let i = 0; i < nick.length; i++) {
    h = (h * 31 + nick.charCodeAt(i)) >>> 0;
  }
  return AV[h % AV.length];
}

export interface MonthRow {
  ym: string;
  label: string;
  total: number; // ยอดรวมเดือนนั้น
  paid: number; // จำนวนคนที่จ่ายครบงวด
  memCount: number;
  status: "ok" | "warn";
}

/** สรุปรายเดือน (ยอดรวม + จำนวนคนที่โอนครบ + สถานะ) เรียงใหม่→เก่า */
export function monthlySummary(g: Goal): MonthRow[] {
  const members = g.members.length ? g.members : ["ฉัน"];
  const memCount = members.length;
  const months = monthsList(g);
  const perMonth = (g.target || 0) / Math.max(1, memCount) / months.length;

  const map: Record<string, Record<string, number>> = {};
  members.forEach((m) => {
    map[m] = {};
  });
  g.contributions.forEach((x) => {
    if (!map[x.name]) map[x.name] = {};
    map[x.name][x.month] = (map[x.name][x.month] ?? 0) + (Number(x.amount) || 0);
  });

  const cur = nowYM();
  const rows: MonthRow[] = [];
  months.forEach((ym) => {
    if (ym > cur) return; // เฉพาะเดือนที่ถึงแล้ว
    let total = 0;
    let paid = 0;
    members.forEach((m) => {
      const v = map[m]?.[ym] ?? 0;
      total += v;
      if (perMonth > 0 && v >= perMonth * 0.999) paid++;
    });
    rows.push({
      ym,
      label: ymLabel(ym),
      total,
      paid,
      memCount,
      status: paid >= memCount ? "ok" : "warn",
    });
  });
  return rows.reverse();
}

export interface MMCell {
  ym: string;
  amount: number; // ยอดที่คนนี้โอนในเดือนนี้
  paid: boolean; // โอนครบงวด (>= เป้าต่อคน/เดือน) และเดือนนี้ถึงแล้ว
  started: boolean; // เดือนนี้มาถึงแล้ว (<= ปัจจุบัน)
}
export interface MMRow {
  nick: string;
  cells: MMCell[];
  paidCount: number; // จำนวนเดือน (ที่ถึงแล้ว) ที่โอนครบ
  startedCount: number; // จำนวนเดือนที่ถึงแล้วทั้งหมด
}
export interface MemberMonthMatrix {
  months: { ym: string; label: string; started: boolean; total: number }[];
  rows: MMRow[];
  perMonth: number; // เป้าต่อคน/เดือน
}

/**
 * ตารางรายคน × รายเดือน: ใครโอนครบงวดเดือนไหน (เขียว) / ยังไม่โอน (แดง)
 * - "ครบงวด" = ยอดเดือนนั้นของคนนั้น >= เป้าต่อคน/เดือน
 * - เดือนอนาคต (ยังไม่ถึง) = started:false → โชว์เป็นกลาง ไม่นับแดง
 */
export function memberMonthMatrix(g: Goal): MemberMonthMatrix {
  const members = g.members.length ? g.members : ["ฉัน"];
  const monthsArr = monthsList(g);
  const cur = nowYM();
  const perMonth = (g.target || 0) / members.length / monthsArr.length;

  // map[nick][ym] = ยอดรวมของคนนั้นในเดือนนั้น
  const map: Record<string, Record<string, number>> = {};
  members.forEach((m) => {
    map[m] = {};
  });
  g.contributions.forEach((x) => {
    if (!map[x.name]) map[x.name] = {};
    map[x.name][x.month] = (map[x.name][x.month] ?? 0) + (Number(x.amount) || 0);
  });

  const monthsMeta = monthsArr.map((ym) => {
    const started = ym <= cur;
    let total = 0;
    members.forEach((m) => {
      total += map[m]?.[ym] ?? 0;
    });
    return { ym, label: ymLabel(ym), started, total };
  });

  const rows: MMRow[] = members.map((nick) => {
    let paidCount = 0;
    let startedCount = 0;
    const cells = monthsArr.map((ym) => {
      const started = ym <= cur;
      const amount = map[nick]?.[ym] ?? 0;
      const paid = started && perMonth > 0 && amount >= perMonth * 0.999;
      if (started) startedCount++;
      if (paid) paidCount++;
      return { ym, amount, paid, started };
    });
    return { nick, cells, paidCount, startedCount };
  });

  return { months: monthsMeta, rows, perMonth };
}

/** ซีรีส์สำหรับกราฟ: เส้นแผน (linear) + เส้นสะสมจริง (หยุดที่เดือนปัจจุบัน) */
export function chartSeries(g: Goal): {
  labels: string[];
  plan: number[];
  saved: number[];
  savedEnd: number;
} {
  const months = monthsList(g);
  const cur = nowYM();
  const n = months.length;
  const target = g.target || 1;
  const monthSum: Record<string, number> = {};
  g.contributions.forEach((x) => {
    monthSum[x.month] = (monthSum[x.month] ?? 0) + (Number(x.amount) || 0);
  });
  const labels = months.map(ymLabel);
  const plan = months.map((_, i) => (target * (i + 1)) / n);
  const saved: number[] = [];
  let cum = 0;
  let savedEnd = -1; // -1 = ยังไม่เริ่มเป้า (ไม่มีเดือนที่ถึงแล้ว)
  for (let i = 0; i < n; i++) {
    if (months[i] <= cur) {
      cum += monthSum[months[i]] ?? 0;
      savedEnd = i;
    }
    saved.push(cum);
  }
  return { labels, plan, saved, savedEnd };
}

/** เวลาแบบสัมพัทธ์ภาษาไทย เช่น "วันนี้ 14:22", "เมื่อวาน 20:10", "2 มี.ค. 09:48" */
export function relativeTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffSec = (now.getTime() - d.getTime()) / 1000;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (diffSec < 60) return "เมื่อสักครู่";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + " นาทีที่แล้ว";
  if (d.toDateString() === now.toDateString()) return "วันนี้ " + hh + ":" + mm;
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString())
    return "เมื่อวาน " + hh + ":" + mm;
  return d.getDate() + " " + THMON[d.getMonth()] + " " + hh + ":" + mm;
}

/**
 * หมุดหมาย (%) ที่ "เพิ่งข้าม" จากยอด before → after
 * ใช้ตอนบันทึกการออม เพื่อฉลอง + แจ้ง Discord
 */
export function crossedMilestones(
  before: number,
  after: number,
  target: number,
): number[] {
  const t = target || 1;
  const b = (before / t) * 100;
  const a = (after / t) * 100;
  return MILESTONES.filter((m) => b < m && a >= m);
}

/**
 * สมาชิกที่ยัง "ไม่โอนครบงวด" ของเดือนปัจจุบัน
 * - คืน [] ถ้าเป็นเป้าเดี่ยว หรือเดือนนี้อยู่นอกช่วงเป้า
 * - เกณฑ์ครบงวด = ยอดเดือนนี้ >= เป้าต่อคน/เดือน
 */
export function unpaidThisMonth(g: Goal): string[] {
  const members = g.members ?? [];
  if (members.length <= 1) return [];
  const cur = nowYM();
  if (cur < g.start || cur > g.end) return [];
  const months = monthsBetween(g.start, g.end);
  const perMonth = (g.target || 0) / members.length / months;
  if (perMonth <= 0) return [];
  const paidBy: Record<string, number> = {};
  g.contributions.forEach((x) => {
    if (x.month === cur)
      paidBy[x.name] = (paidBy[x.name] ?? 0) + (Number(x.amount) || 0);
  });
  return members.filter((m) => (paidBy[m] ?? 0) < perMonth * 0.999);
}
