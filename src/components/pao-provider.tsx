"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  applyWebhookCache,
  getWebhook,
  notifyDiscord,
  notifyMilestone,
  notifyNudge,
  notifyUpdate,
} from "@/lib/discord";
import {
  crossedMilestones,
  isSolo,
  nowYM,
  tallies,
  unpaidThisMonth,
} from "@/lib/calc";
import { compressImage } from "@/lib/image";
import type {
  Comment,
  CommentRow,
  Contribution,
  ContributionRow,
  Goal,
  GoalDraft,
  GoalRow,
  Person,
  PersonRow,
  Reaction,
  ReactionRow,
  Update,
  UpdateRow,
} from "@/lib/types";

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e)
    return String((e as { message: unknown }).message);
  return String(e);
}

/** ตรวจว่าเป็น error "คีย์ซ้ำ" (unique constraint) จาก Postgres ไหม */
function isDupErr(e: unknown): boolean {
  const code = (e as { code?: string } | null)?.code;
  return code === "23505" || /duplicate key|unique constraint/i.test(errMsg(e));
}

/** ข้อความ error ที่เป็นมิตร: ถ้าโดน RLS ปฏิเสธ (ปลอมชื่อ) ให้บอกชัด ๆ */
function rlsMsg(e: unknown, friendlyRls: string): string {
  const m = errMsg(e);
  const code = (e as { code?: string } | null)?.code;
  if (code === "42501" || /row.?level.?security|policy/i.test(m))
    return friendlyRls;
  return "ทำรายการไม่สำเร็จ: " + m;
}

interface LoadedData {
  people: Person[];
  goals: Goal[];
  updates: Update[];
}

export interface AddContributionInput {
  name: string;
  month: string;
  amount: string; // ดิบจาก input
  note: string;
  file: File | null;
  slipRef?: string | null; // เลขที่รายการจากสลิป (กันส่งซ้ำ)
}

export interface AddUpdateInput {
  text: string;
  file: File | null;
}

/** สถานะฉลองหมุดหมาย (โชว์ confetti overlay) */
export interface Celebration {
  pct: number;
}

interface GoalDialogState {
  open: boolean;
  editing: Goal | null;
}

export interface ToastState {
  id: number;
  msg: string;
  kind: "success" | "error";
}

interface PaoContextValue {
  // ข้อมูล
  people: Person[];
  goals: Goal[];
  updates: Update[];
  activeId: string | null;
  activeGoal: Goal | null;
  busy: boolean;
  // ตัวตน "ฉัน" จาก Discord (ยืนยันแล้ว — ผูกกับ auth.uid())
  myNick: string;
  myAvatar: string;
  // ฉลองหมุดหมาย
  celebration: Celebration | null;
  clearCelebration: () => void;
  // toast
  toast: ToastState | null;
  showToast: (msg: string, kind?: "success" | "error") => void;
  // นำทาง
  switchGoal: (id: string) => void;
  // mutations
  reload: (preferActiveId?: string) => Promise<LoadedData>;
  addContribution: (input: AddContributionInput) => Promise<boolean>;
  checkSlipUsed: (ref: string) => Promise<boolean>;
  deleteContribution: (id: string) => Promise<void>;
  updateContribution: (
    id: string,
    fields: { name: string; month: string; amount: number; note: string },
  ) => Promise<void>;
  // แก้ไขรายการ (dialog)
  editingContribution: Contribution | null;
  setEditingContribution: (c: Contribution | null) => void;
  // ไดอารี่กลุ่ม
  addUpdate: (input: AddUpdateInput) => Promise<boolean>;
  deleteUpdate: (id: string) => Promise<void>;
  toggleReaction: (updateId: string, emoji: string) => Promise<void>;
  addComment: (updateId: string, text: string) => Promise<boolean>;
  deleteComment: (id: string) => Promise<void>;
  nudgeUnpaid: () => Promise<void>;
  // Discord webhook ส่วนกลาง (ใช้ร่วมทั้งกลุ่ม)
  webhooks: { savings: string; diary: string };
  saveWebhooks: (kind: "savings" | "diary", url: string) => Promise<void>;
  saveGoal: (draft: GoalDraft, editingId: string | null) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addPerson: (nick: string, real: string) => Promise<boolean>;
  updatePersonReal: (id: string, real: string) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  // dialogs
  goalDialog: GoalDialogState;
  setGoalDialog: (s: GoalDialogState) => void;
  newGoal: () => void;
  editGoal: () => void;
  peopleOpen: boolean;
  setPeopleOpen: (b: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (b: boolean) => void;
  // auth
  logout: () => void;
}

const PaoContext = createContext<PaoContextValue | null>(null);

export function usePao(): PaoContextValue {
  const ctx = useContext(PaoContext);
  if (!ctx) throw new Error("usePao must be used within <PaoProvider>");
  return ctx;
}

function mapPeople(rows: PersonRow[]): Person[] {
  return rows.map((p) => ({
    id: p.id,
    nick: p.nick,
    real: p.real ?? "",
    auth_id: p.auth_id ?? null,
    discord_id: p.discord_id ?? null,
    avatar_url: p.avatar_url ?? null,
  }));
}

function mapGoals(goalRows: GoalRow[], contribRows: ContributionRow[]): Goal[] {
  const byGoal: Record<string, Contribution[]> = {};
  contribRows.forEach((c) => {
    (byGoal[c.goal_id] = byGoal[c.goal_id] ?? []).push({
      id: c.id,
      name: c.name,
      month: c.month,
      amount: Number(c.amount) || 0,
      note: c.note ?? "",
      slip_url: c.slip_url ?? "",
      created_at: c.created_at,
    });
  });
  return goalRows.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji ?? "🎯",
    accent: g.accent ?? "#059669",
    currency: g.currency ?? "฿",
    target: Number(g.target) || 0,
    start: g.start_month,
    end: g.end_month,
    members: g.members ?? [],
    contributions: byGoal[g.id] ?? [],
  }));
}

function mapUpdates(
  updateRows: UpdateRow[],
  reactionRows: ReactionRow[],
  commentRows: CommentRow[],
): Update[] {
  const rxByU: Record<string, Reaction[]> = {};
  reactionRows.forEach((r) => {
    (rxByU[r.update_id] = rxByU[r.update_id] ?? []).push({
      id: r.id,
      update_id: r.update_id,
      author: r.author,
      emoji: r.emoji,
    });
  });
  const cmByU: Record<string, Comment[]> = {};
  commentRows.forEach((c) => {
    (cmByU[c.update_id] = cmByU[c.update_id] ?? []).push({
      id: c.id,
      update_id: c.update_id,
      author: c.author,
      text: c.text,
      created_at: c.created_at,
    });
  });
  return updateRows.map((u) => ({
    id: u.id,
    goal_id: u.goal_id,
    author: u.author,
    text: u.text ?? "",
    image_url: u.image_url ?? "",
    created_at: u.created_at,
    reactions: rxByU[u.id] ?? [],
    comments: cmByU[u.id] ?? [],
  }));
}

export function PaoProvider({
  myProfile,
  onLogout,
  children,
}: {
  myProfile: Person;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const clearCelebration = useCallback(() => setCelebration(null), []);

  // ตัวตนของฉัน: หาแถวใน people ที่ auth_id ตรงกับฉัน (รับชื่อ/รูปที่อัปเดตล่าสุด)
  // fallback เป็น myProfile ตอน claim ครั้งแรก (ก่อน reload จะมีข้อมูลครบ)
  const me = useMemo(
    () =>
      people.find((p) => p.auth_id && p.auth_id === myProfile.auth_id) ??
      myProfile,
    [people, myProfile],
  );
  const myNick = me.nick;
  const myAvatar = me.avatar_url ?? "";
  const [goalDialog, setGoalDialog] = useState<GoalDialogState>({
    open: false,
    editing: null,
  });
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingContribution, setEditingContribution] =
    useState<Contribution | null>(null);
  const [webhooks, setWebhooks] = useState<{ savings: string; diary: string }>({
    savings: "",
    diary: "",
  });

  // ===== toast =====
  const toastSeq = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback(
    (msg: string, kind: "success" | "error" = "success") => {
      toastSeq.current += 1;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id: toastSeq.current, msg, kind });
      toastTimer.current = setTimeout(
        () => setToast(null),
        kind === "error" ? 3400 : 2400,
      );
    },
    [],
  );

  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeId) ?? null,
    [goals, activeId],
  );

  const reload = useCallback(
    async (preferActiveId?: string): Promise<LoadedData> => {
      const [pp, gg, cc, uu, rx, cm, st] = await Promise.all([
        supabase
          .from("people")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("goals")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("contributions")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("updates")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase.from("update_reactions").select("*"),
        supabase
          .from("update_comments")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase.from("app_settings").select("*").eq("id", "global").maybeSingle(),
      ]);
      if (pp.error) throw pp.error;
      if (gg.error) throw gg.error;
      if (cc.error) throw cc.error;
      if (uu.error) throw uu.error;
      if (rx.error) throw rx.error;
      if (cm.error) throw cm.error;
      // app_settings ไม่ throw — เผื่อยังไม่ได้รัน migrate-3-shared-webhook.sql
      const stRow = (st.data ?? null) as {
        discord_savings?: string | null;
        discord_diary?: string | null;
      } | null;
      const savings = stRow?.discord_savings ?? "";
      const diary = stRow?.discord_diary ?? "";
      applyWebhookCache(savings, diary);
      setWebhooks({ savings, diary });

      const nextPeople = mapPeople((pp.data ?? []) as PersonRow[]);
      const nextGoals = mapGoals(
        (gg.data ?? []) as GoalRow[],
        (cc.data ?? []) as ContributionRow[],
      );
      const nextUpdates = mapUpdates(
        (uu.data ?? []) as UpdateRow[],
        (rx.data ?? []) as ReactionRow[],
        (cm.data ?? []) as CommentRow[],
      );
      setPeople(nextPeople);
      setGoals(nextGoals);
      setUpdates(nextUpdates);
      setActiveId((prev) => {
        const want = preferActiveId ?? prev;
        if (want && nextGoals.some((g) => g.id === want)) return want;
        return nextGoals[0]?.id ?? null;
      });
      return { people: nextPeople, goals: nextGoals, updates: nextUpdates };
    },
    [],
  );

  // ===== init + realtime =====
  const rtTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await reload();
      } catch (e) {
        if (active) showToast("โหลดข้อมูลไม่ได้: " + errMsg(e), "error");
      }
    })();

    const debouncedReload = () => {
      if (rtTimer.current) clearTimeout(rtTimer.current);
      rtTimer.current = setTimeout(() => {
        reload().catch(() => {});
      }, 400);
    };

    const channel = supabase
      .channel("rt-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "people" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "updates" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "update_reactions" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "update_comments" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        debouncedReload,
      )
      .subscribe();

    return () => {
      active = false;
      if (rtTimer.current) clearTimeout(rtTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      supabase.removeChannel(channel);
    };
  }, [reload, showToast]);

  // ===== navigation =====
  const switchGoal = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ===== mutations =====
  const addContribution = useCallback(
    async (input: AddContributionInput): Promise<boolean> => {
      const g = goals.find((x) => x.id === activeId) ?? null;
      if (!g) return false;
      const name = isSolo(g) ? g.members[0] ?? "ฉัน" : input.name;
      const month = input.month || nowYM();
      const amount = parseFloat(input.amount);
      if (!amount || amount <= 0) {
        showToast("ใส่จำนวนเงินให้ถูกต้อง", "error");
        return false;
      }
      const note = input.note.trim();
      const slipRef = input.slipRef ?? null;
      // กันส่งสลิปซ้ำ: ถ้าเลขที่รายการนี้เคยมีแล้ว → ไม่ให้บันทึก (เช็กก่อนอัปสลิป)
      if (slipRef) {
        const dup = await supabase
          .from("contributions")
          .select("id")
          .eq("slip_ref", slipRef)
          .limit(1);
        if (dup.data && dup.data.length > 0) {
          showToast("สลิปนี้ถูกใช้ไปแล้ว", "error");
          return false;
        }
      }
      const beforeSaved = tallies(g).saved; // ยอดสะสมก่อนบันทึก (ไว้เทียบหมุดหมาย)
      let ok = false;
      setBusy(true);
      try {
        let slipUrl = "";
        if (input.file) {
          const img = await compressImage(input.file);
          const safe = (img.name || "slip.jpg").replace(/[^\w.\-]/g, "_");
          const path = g.id + "/" + Date.now() + "_" + safe;
          const up = await supabase.storage
            .from("slips")
            .upload(path, img, { cacheControl: "3600", upsert: false });
          if (up.error) {
            showToast(
              "อัปสลิปไม่ได้: " + up.error.message + " — ยังไม่บันทึก ลองใหม่",
              "error",
            );
            setBusy(false);
            return false;
          }
          slipUrl = supabase.storage.from("slips").getPublicUrl(path).data
            .publicUrl;
        }
        const ins = await supabase
          .from("contributions")
          .insert({
            goal_id: g.id,
            name,
            month,
            amount,
            note,
            slip_url: slipUrl,
            slip_ref: slipRef,
          })
          .select()
          .single();
        if (ins.error) throw ins.error;

        const data = await reload(g.id);
        const freshGoal = data.goals.find((x) => x.id === g.id) ?? g;
        void notifyDiscord(
          freshGoal,
          data.people,
          { name, month, amount, note },
          slipUrl,
        );
        // ฉลอง + แจ้ง Discord ถ้ายอดสะสมเพิ่งแตะหมุดหมาย (25/50/75/100%)
        const afterSaved = tallies(freshGoal).saved;
        const crossed = crossedMilestones(
          beforeSaved,
          afterSaved,
          freshGoal.target,
        );
        if (crossed.length) {
          const top = Math.max(...crossed);
          setCelebration({ pct: top });
          void notifyMilestone(freshGoal, top);
        }
        showToast("บันทึกแล้ว · ทุกคนเห็นยอดอัปเดตทันที");
        ok = true;
      } catch (e) {
        showToast(
          isDupErr(e) ? "สลิปนี้ถูกใช้ไปแล้ว" : "บันทึกไม่สำเร็จ: " + errMsg(e),
          "error",
        );
      }
      setBusy(false);
      return ok;
    },
    [goals, activeId, reload, showToast],
  );

  // เช็กว่าเลขที่รายการของสลิปนี้เคยถูกใช้แล้วไหม (ไว้เตือนตอนแนบสลิป)
  const checkSlipUsed = useCallback(async (ref: string): Promise<boolean> => {
    if (!ref) return false;
    const r = await supabase
      .from("contributions")
      .select("id")
      .eq("slip_ref", ref)
      .limit(1);
    return !!(r.data && r.data.length > 0);
  }, []);

  const deleteContribution = useCallback(
    async (id: string) => {
      if (!window.confirm("ลบรายการนี้?")) return;
      setBusy(true);
      try {
        const r = await supabase.from("contributions").delete().eq("id", id);
        if (r.error) throw r.error;
        await reload();
        showToast("ลบรายการแล้ว");
      } catch (e) {
        showToast("ลบไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  // แก้ไขยอด/เดือน/หมายเหตุ/ผู้โอน ของรายการเดิม (ไม่ยิง Discord ซ้ำ)
  const updateContribution = useCallback(
    async (
      id: string,
      fields: { name: string; month: string; amount: number; note: string },
    ) => {
      setBusy(true);
      try {
        const r = await supabase
          .from("contributions")
          .update({
            name: fields.name,
            month: fields.month,
            amount: fields.amount,
            note: fields.note,
          })
          .eq("id", id);
        if (r.error) throw r.error;
        setEditingContribution(null);
        await reload();
        showToast("แก้ไขรายการแล้ว");
      } catch (e) {
        showToast("แก้ไขไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  const saveGoal = useCallback(
    async (draft: GoalDraft, editingId: string | null) => {
      const row = {
        name: draft.name,
        emoji: draft.emoji,
        accent: draft.accent,
        currency: draft.currency,
        target: draft.target,
        start_month: draft.start,
        end_month: draft.end,
        members: draft.members,
      };
      setBusy(true);
      try {
        let preferId: string | undefined;
        if (editingId) {
          const r = await supabase
            .from("goals")
            .update(row)
            .eq("id", editingId);
          if (r.error) throw r.error;
          preferId = editingId;
        } else {
          const r = await supabase.from("goals").insert(row).select().single();
          if (r.error) throw r.error;
          preferId = (r.data as GoalRow).id;
        }
        setGoalDialog({ open: false, editing: null });
        await reload(preferId);
        showToast(editingId ? "แก้ไขเป้าหมายแล้ว" : "สร้างเป้าหมายแล้ว");
      } catch (e) {
        showToast("บันทึกเป้าไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!window.confirm("ลบเป้าหมายนี้และข้อมูลทั้งหมด?")) return;
      setBusy(true);
      try {
        const r = await supabase.from("goals").delete().eq("id", id);
        if (r.error) throw r.error;
        setGoalDialog({ open: false, editing: null });
        await reload();
        showToast("ลบเป้าหมายแล้ว");
      } catch (e) {
        showToast("ลบไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  const addPerson = useCallback(
    async (nickRaw: string, realRaw: string): Promise<boolean> => {
      const nick = nickRaw.trim();
      const real = realRaw.trim();
      if (!nick) {
        showToast("ใส่ชื่อเล่นก่อน", "error");
        return false;
      }
      if (people.some((p) => p.nick === nick)) {
        showToast("มีชื่อเล่นนี้แล้ว", "error");
        return false;
      }
      setBusy(true);
      try {
        const r = await supabase
          .from("people")
          .insert({ nick, real })
          .select()
          .single();
        if (r.error) throw r.error;
        await reload();
      } catch (e) {
        showToast("เพิ่มไม่สำเร็จ: " + errMsg(e), "error");
        setBusy(false);
        return false;
      }
      setBusy(false);
      return true;
    },
    [people, reload, showToast],
  );

  const updatePersonReal = useCallback(
    async (id: string, real: string) => {
      setBusy(true);
      try {
        const u = await supabase
          .from("people")
          .update({ real: real.trim() })
          .eq("id", id);
        if (u.error) throw u.error;
        await reload();
      } catch (e) {
        showToast("แก้ไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  const removePerson = useCallback(
    async (id: string) => {
      const p = people.find((x) => x.id === id);
      if (!p) return;
      // กันลบตัวเอง — ไม่งั้นตัวตน (myNick) จะหลุด โพสต์ต่อไม่ได้
      if (p.auth_id && p.auth_id === myProfile.auth_id) {
        showToast("ลบตัวเองไม่ได้ — นี่คือบัญชีที่คุณล็อกอินอยู่", "error");
        return;
      }
      if (!window.confirm('ลบ "' + p.nick + '" ออกจากรายชื่อ?')) return;
      setBusy(true);
      try {
        const r = await supabase.from("people").delete().eq("id", id);
        if (r.error) throw r.error;
        await reload();
      } catch (e) {
        showToast("ลบไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [people, myProfile, reload, showToast],
  );

  // ===== ไดอารี่กลุ่ม =====
  const addUpdate = useCallback(
    async (input: AddUpdateInput): Promise<boolean> => {
      const g = goals.find((x) => x.id === activeId) ?? null;
      if (!g) return false;
      const author = myNick;
      if (!author) {
        showToast("ยังไม่ได้ผูกชื่อกับบัญชี Discord", "error");
        return false;
      }
      const text = input.text.trim();
      if (!text && !input.file) {
        showToast("เขียนข้อความหรือแนบรูปก่อน", "error");
        return false;
      }
      let ok = false;
      setBusy(true);
      try {
        let imageUrl = "";
        if (input.file) {
          const img = await compressImage(input.file);
          const safe = (img.name || "photo.jpg").replace(/[^\w.\-]/g, "_");
          const path = g.id + "/" + Date.now() + "_" + safe;
          const up = await supabase.storage
            .from("feed")
            .upload(path, img, { cacheControl: "3600", upsert: false });
          if (up.error) {
            showToast(
              "อัปรูปไม่ได้: " + up.error.message + " — ยังไม่โพสต์ ลองใหม่",
              "error",
            );
            setBusy(false);
            return false;
          }
          imageUrl = supabase.storage.from("feed").getPublicUrl(path).data
            .publicUrl;
        }
        const ins = await supabase
          .from("updates")
          .insert({ goal_id: g.id, author, text, image_url: imageUrl })
          .select()
          .single();
        if (ins.error) throw ins.error;
        await reload(g.id);
        void notifyUpdate(people, author, text, imageUrl);
        showToast("โพสต์แล้ว · เพื่อน ๆ เห็นทันที");
        ok = true;
      } catch (e) {
        showToast(rlsMsg(e, "โพสต์ได้เฉพาะในชื่อตัวเอง"), "error");
      }
      setBusy(false);
      return ok;
    },
    [goals, activeId, myNick, people, reload, showToast],
  );

  const deleteUpdate = useCallback(
    async (id: string) => {
      if (!window.confirm("ลบโพสต์นี้?")) return;
      setBusy(true);
      try {
        const r = await supabase.from("updates").delete().eq("id", id);
        if (r.error) throw r.error;
        await reload();
        showToast("ลบโพสต์แล้ว");
      } catch (e) {
        showToast("ลบไม่สำเร็จ: " + errMsg(e), "error");
      }
      setBusy(false);
    },
    [reload, showToast],
  );

  const toggleReaction = useCallback(
    async (updateId: string, emoji: string) => {
      if (!myNick) return;
      const u = updates.find((x) => x.id === updateId);
      const mine = u?.reactions.find(
        (r) => r.author === myNick && r.emoji === emoji,
      );
      try {
        if (mine) {
          const r = await supabase
            .from("update_reactions")
            .delete()
            .eq("id", mine.id);
          if (r.error) throw r.error;
        } else {
          const r = await supabase
            .from("update_reactions")
            .insert({ update_id: updateId, author: myNick, emoji });
          if (r.error) throw r.error;
        }
        await reload();
      } catch (e) {
        showToast(rlsMsg(e, "กดรีแอกชันได้เฉพาะในชื่อตัวเอง"), "error");
      }
    },
    [myNick, updates, reload, showToast],
  );

  const addComment = useCallback(
    async (updateId: string, textRaw: string): Promise<boolean> => {
      if (!myNick) return false;
      const text = textRaw.trim();
      if (!text) return false;
      try {
        const r = await supabase
          .from("update_comments")
          .insert({ update_id: updateId, author: myNick, text });
        if (r.error) throw r.error;
        await reload();
        return true;
      } catch (e) {
        showToast(rlsMsg(e, "คอมเมนต์ได้เฉพาะในชื่อตัวเอง"), "error");
        return false;
      }
    },
    [myNick, reload, showToast],
  );

  const deleteComment = useCallback(
    async (id: string) => {
      try {
        const r = await supabase.from("update_comments").delete().eq("id", id);
        if (r.error) throw r.error;
        await reload();
      } catch (e) {
        showToast("ลบคอมเมนต์ไม่สำเร็จ: " + errMsg(e), "error");
      }
    },
    [reload, showToast],
  );

  const nudgeUnpaid = useCallback(async () => {
    const g = goals.find((x) => x.id === activeId) ?? null;
    if (!g) return;
    const unpaid = unpaidThisMonth(g);
    if (!unpaid.length) {
      showToast("เดือนนี้ทุกคนโอนครบแล้ว 🎉");
      return;
    }
    if (!getWebhook("savings")) {
      showToast("ตั้ง Discord Webhook (ออมเงิน) ก่อน ในเมนูตั้งค่า", "error");
      return;
    }
    const ok = await notifyNudge(g, people, unpaid);
    showToast(
      ok ? "ส่งเตือนใน Discord แล้ว 🔔" : "ส่งไม่สำเร็จ ตรวจ Webhook",
      ok ? "success" : "error",
    );
  }, [goals, activeId, people, showToast]);

  // บันทึก Discord webhook ส่วนกลาง (ใช้ร่วมทั้งกลุ่ม)
  const saveWebhooks = useCallback(
    async (kind: "savings" | "diary", url: string) => {
      const next = { ...webhooks, [kind]: url };
      setWebhooks(next);
      applyWebhookCache(next.savings, next.diary);
      try {
        const col = kind === "savings" ? "discord_savings" : "discord_diary";
        const r = await supabase
          .from("app_settings")
          .upsert(
            { id: "global", [col]: url, updated_at: new Date().toISOString() },
            { onConflict: "id" },
          );
        if (r.error) throw r.error;
      } catch (e) {
        showToast("บันทึก Webhook ไม่สำเร็จ: " + errMsg(e), "error");
      }
    },
    [webhooks, showToast],
  );

  // ===== dialog openers =====
  const newGoal = useCallback(() => {
    setGoalDialog({ open: true, editing: null });
  }, []);
  const editGoal = useCallback(() => {
    setGoalDialog({ open: true, editing: activeGoal });
  }, [activeGoal]);

  const logout = useCallback(() => {
    void supabase.auth.signOut().finally(onLogout);
  }, [onLogout]);

  const value: PaoContextValue = {
    people,
    goals,
    updates,
    activeId,
    activeGoal,
    busy,
    myNick,
    myAvatar,
    celebration,
    clearCelebration,
    toast,
    showToast,
    switchGoal,
    reload,
    addContribution,
    checkSlipUsed,
    deleteContribution,
    updateContribution,
    editingContribution,
    setEditingContribution,
    addUpdate,
    deleteUpdate,
    toggleReaction,
    addComment,
    deleteComment,
    nudgeUnpaid,
    webhooks,
    saveWebhooks,
    saveGoal,
    deleteGoal,
    addPerson,
    updatePersonReal,
    removePerson,
    goalDialog,
    setGoalDialog,
    newGoal,
    editGoal,
    peopleOpen,
    setPeopleOpen,
    shareOpen,
    setShareOpen,
    logout,
  };

  return <PaoContext.Provider value={value}>{children}</PaoContext.Provider>;
}
