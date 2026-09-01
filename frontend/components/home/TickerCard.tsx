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
        className="block bg-[#141417] border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-4 transition-all duration-200 active:scale-[0.98] shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-neutral-100">{item.ticker}</span>
            <SignalBadge signal={item.signal} />
          </div>
          <Sparkline data={item.spark} up={up} />
        </div>
        
        <div className="flex items-center justify-between text-xs font-medium border-t border-neutral-800/50 pt-3">
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
          className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1d] text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/50 transition-colors shadow-md z-10"
        >
          <Icon icon="ph:x-bold" width="14" />
        </button>
      )}
    </div>
  );
}
