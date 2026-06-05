"use client";

import { useEffect, useState } from "react";
import { usePao } from "./pao-provider";
import { isSolo } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { Header } from "./header";
import { GoalBar } from "./goal-bar";
import { Hero } from "./hero";
import { StatChips } from "./stat-chips";
import { NudgeBanner } from "./nudge-banner";
import { ContributionForm } from "./contribution-form";
import { MemberCards } from "./member-cards";
import { ChartCard } from "./savings-chart";
import { MonthTable } from "./monthly-grid";
import { Activity } from "./history-list";
import { Feed } from "./feed";
import { Celebrate } from "./celebrate";
import { ToastHost } from "./toast-host";
import { BusyIndicator } from "./busy-indicator";
import { GoalEditor } from "./dialogs/goal-editor";
import { PeopleDialog } from "./dialogs/people-dialog";
import { ShareDialog } from "./dialogs/share-dialog";
import { Icon, type IconName } from "./icon";

type Tab = "home" | "feed";

function DashContent({ goal }: { goal: Goal }) {
  const solo = isSolo(goal);
  return (
    <>
      <GoalBar />
      <Hero goal={goal} />
      <StatChips goal={goal} />
      {!solo && <NudgeBanner goal={goal} />}
      <ContributionForm key={goal.id} goal={goal} />
      {!solo && <MemberCards goal={goal} />}
      <ChartCard goal={goal} />
      <MonthTable goal={goal} />
      <Activity goal={goal} />
    </>
  );
}

/** แถบแท็บล่าง: สลับหน้าเป้าหมาย ↔ ไดอารี่กลุ่ม */
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: IconName }[] = [
    { id: "home", label: "เป้าหมาย", icon: "target" },
    { id: "feed", label: "ไดอารี่", icon: "book" },
  ];
  return (
    <nav className="tabbar">
      {items.map((it) => {
        const on = tab === it.id;
        return (
          <button
            key={it.id}
            className="tabbtn"
            data-on={on ? "1" : undefined}
            onClick={() => setTab(it.id)}
          >
            <Icon name={it.icon} size={21} sw={on ? 2 : 1.7} />
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 600 }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function EmptyState() {
  const { newGoal } = usePao();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px 34px 72px",
        gap: 22,
      }}
    >
      <div
        className="appear"
        style={{
          width: 108,
          height: 108,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "var(--accent-soft)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            background: "var(--accent-soft-2)",
          }}
        />
        <Icon name="target" size={46} color="var(--accent)" sw={1.7} style={{ position: "relative" }} />
      </div>
      <div className="appear" style={{ animationDelay: ".06s" }}>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.01em" }}>
          ยังไม่มีเป้าหมาย
        </div>
        <div
          className="muted"
          style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.6, maxWidth: 250 }}
        >
          สร้างเป้าหมายแรกของกลุ่ม แล้วชวนเพื่อน ๆ มาออมเงินไปถึงฝันด้วยกัน
        </div>
      </div>
      <button
        className="btn btn-primary appear"
        style={{ animationDelay: ".1s" }}
        onClick={newGoal}
      >
        <Icon name="plus" size={18} sw={2.2} /> สร้างเป้าหมายแรก
      </button>
    </div>
  );
}

export function Dashboard() {
  const { activeGoal, people } = usePao();
  const [tab, setTab] = useState<Tab>("home");

  // ธีมสีตามเป้าที่เลือก: ตั้ง --accent + เฉดที่เกี่ยวข้องให้ทั้ง UI ปรับตาม
  // เมื่อไม่มีเป้า (เช่นลบเป้าสุดท้าย) ให้ล้าง override กลับไปใช้สีเขียวดีฟอลต์ใน :root
  useEffect(() => {
    const root = document.documentElement;
    const props = ["--accent", "--accent-ink", "--accent-soft", "--accent-soft-2"];
    if (!activeGoal) {
      props.forEach((p) => root.style.removeProperty(p));
      return;
    }
    const a = activeGoal.accent;
    root.style.setProperty("--accent", a);
    root.style.setProperty("--accent-ink", `color-mix(in srgb, ${a}, black 14%)`);
    root.style.setProperty("--accent-soft", `color-mix(in srgb, ${a}, white 90%)`);
    root.style.setProperty("--accent-soft-2", `color-mix(in srgb, ${a}, white 80%)`);
  }, [activeGoal]);

  const subtitle = people.length ? people.length + " สมาชิก" : undefined;

  return (
    <>
      <div className="app">
        <Header subtitle={subtitle} />
        <div
          className="app-scroll"
          style={activeGoal ? { paddingBottom: 76 } : undefined}
        >
          {!activeGoal ? (
            <EmptyState />
          ) : tab === "home" ? (
            <DashContent goal={activeGoal} />
          ) : (
            <Feed goal={activeGoal} />
          )}
        </div>
        {activeGoal && <TabBar tab={tab} setTab={setTab} />}
      </div>

      <GoalEditor />
      <PeopleDialog />
      <ShareDialog />
      <Celebrate />
      <ToastHost />
      <BusyIndicator />
    </>
  );
}
