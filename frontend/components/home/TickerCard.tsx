"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import SignalBadge from "./SignalBadge";
import Sparkline from "./Sparkline";

function fmtB(v: number | null | undefined) {
  if (v == null) return "-";
  const s = (v / 1e9).toFixed(1);
  const sign = v > 0 ? "+" : "";
  return `${sign}${s}B`;
}

function fmtPct(item: any) {
  if (item.ret_5d == null) return "-";
  const pct = (item.ret_5d * 100).toFixed(1);
  const sign = item.ret_5d > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export default function TickerCard({ item, onRemove }: { item: any; onRemove?: (t: string) => void }) {
  const up = (item.ret_5d ?? 0) >= 0;
  
  return (
    <div className="relative group">
      <Link
        href={"/" + item.ticker}
        className="block bg-[#0F1117] border border-white/[0.05] hover:border-white/[0.15] rounded-xl p-3 transition-all duration-200 active:scale-[0.98] shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-100">{item.ticker}</span>
            <SignalBadge signal={item.signal} />
          </div>
          <Sparkline data={item.spark} up={up} />
        </div>
        
        <div className="flex items-center justify-between text-[10px] font-medium border-t border-white/[0.02] pt-2">
          <div className="flex flex-col">
            <span className="text-neutral-500 mb-0.5">Close</span>
            <span className="text-neutral-200 tabular-nums">{item.close ?? "-"}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-neutral-500 mb-0.5">Return 5D</span>
            <span className={`tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
              {fmtPct(item)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-neutral-500 mb-0.5">Foreign 5D</span>
            <span className={`tabular-nums ${item.foreign_net_5d > 0 ? "text-emerald-400" : item.foreign_net_5d < 0 ? "text-rose-400" : "text-neutral-400"}`}>
              {fmtB(item.foreign_net_5d)}
            </span>
          </div>
        </div>
      </Link>
      
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(item.ticker); }}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-[#08090C] text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/50 transition-colors shadow-md z-10"
        >
          <Icon icon="ph:x-bold" width="12" />
        </button>
      )}
    </div>
  );
}
