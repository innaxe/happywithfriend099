"use client";

import { usePao } from "./pao-provider";

/** แถบ "กำลังประมวลผล" ลอยด้านบนระหว่างทำงาน async */
export function BusyIndicator() {
  const { busy } = usePao();
  if (!busy) return null;
  return <div className="busy">⏳ กำลังประมวลผล…</div>;
}
