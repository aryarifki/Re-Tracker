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
    <div className="relative group animate-fade-in">
      <Link
        href={"/" + item.ticker}
        className="block bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] rounded-[20px] p-4 transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-md"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-base tracking-tight text-[var(--md-sys-color-on-surface)]">{item.ticker}</span>
            <SignalBadge signal={item.signal} />
          </div>
          <Sparkline data={item.spark} up={up} />
        </div>
        
        <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]/60 pt-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">Close</span>
            <span className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] tabular-nums font-extrabold">{item.close ?? "-"}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">Return 5D</span>
            <span 
               className="text-xs sm:text-sm tabular-nums font-extrabold" 
               style={{ color: up ? "var(--color-positive)" : "var(--color-negative)" }}
            >
              {fmtPct(item)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">Foreign 5D</span>
            <span 
               className="text-xs sm:text-sm tabular-nums font-extrabold" 
               style={{ 
                 color: item.foreign_net_5d > 0 ? "var(--color-positive)" 
                      : item.foreign_net_5d < 0 ? "var(--color-negative)" 
                      : "var(--md-sys-color-on-surface-variant)" 
               }}
            >
              {fmtB(item.foreign_net_5d)}
            </span>
          </div>
        </div>
      </Link>
      
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(item.ticker); }}
          className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:bg-[var(--md-sys-color-error)] hover:text-[var(--md-sys-color-on-error)] border border-[var(--md-sys-color-error)] transition-colors shadow-sm z-10"
        >
          <Icon icon="ph:x-bold" width="14" />
        </button>
      )}
    </div>
  );
}
