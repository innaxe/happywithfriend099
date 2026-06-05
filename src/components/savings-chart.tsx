"use client";

import { chartSeries, deriveGoalStats, money } from "@/lib/calc";
import type { Goal } from "@/lib/types";
import { LineChart, SectionHead } from "./primitives";

export function ChartCard({ goal }: { goal: Goal }) {
  const { labels, plan, saved, savedEnd } = chartSeries(goal);
  const s = deriveGoalStats(goal);
  const expectedByNow = (s.target * s.elapsed) / s.months;
  const diff = Math.round(s.saved - expectedByNow);
  const ahead = diff >= 0;

  return (
    <div style={{ margin: "20px 18px 0" }}>
      <SectionHead title="เงินสะสมเทียบเป้า" />
      <div className="card" style={{ padding: "16px 14px 8px" }}>
        <div className="row" style={{ gap: 16, marginBottom: 6, paddingLeft: 4 }}>
          <span className="row" style={{ gap: 6, fontSize: 12, fontWeight: 600 }}>
            <i style={{ width: 14, height: 3, borderRadius: 2, background: "var(--accent)" }} />{" "}
            สะสมจริง
          </span>
          <span
            className="row"
            style={{ gap: 6, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}
          >
            <i style={{ width: 14, height: 0, borderTop: "2px dashed var(--muted-2)" }} /> แผน
          </span>
          <span
            className="num"
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 700,
              color: ahead ? "var(--accent-ink)" : "var(--amber)",
            }}
          >
            {ahead ? "+" : "-"}
            {money(Math.abs(diff), goal.currency)} {ahead ? "เหนือแผน" : "ต่ำกว่าแผน"}
          </span>
        </div>
        <LineChart
          saved={saved}
          plan={plan}
          labels={labels}
          savedEnd={savedEnd}
          accent={goal.accent}
        />
      </div>
    </div>
  );
}
