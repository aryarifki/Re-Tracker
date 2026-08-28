import Link from "next/link";
import SignalBadge from "./SignalBadge";
import Sparkline from "./Sparkline";

function fmtB(v: number | null | undefined) {
  if (v == null) return "-";
  const s = (v / 1e9).toFixed(1);
  const sign = v >= 0 ? "+" : "";
  return sign + s + "M";
}

function fmtPct(item: any) {
  if (item.ret_5d == null) return "-";
  const pct = (item.ret_5d * 100).toFixed(1);
  const sign = item.ret_5d >= 0 ? "+" : "";
  return sign + pct + "% (5d)";
}

export default function TickerCard({ item }: { item: any }) {
  const up = (item.ret_5d ?? 0) >= 0;
  return (
    <Link
      href={"/broker/" + item.ticker}
      className="block bg-neutral-900 border border-neutral-800 rounded-xl p-3 active:border-emerald-500/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{item.ticker}</span>
          <SignalBadge signal={item.signal} />
        </div>
        <Sparkline data={item.spark} up={up} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
        <span>
          Close <span className="text-neutral-200">{item.close ?? "-"}</span>
        </span>
        <span className={up ? "text-emerald-400" : "text-red-400"}>
          {fmtPct(item)}
        </span>
        <span>Foreign 5d: {fmtB(item.foreign_net_5d)}</span>
      </div>
    </Link>
  );
}
