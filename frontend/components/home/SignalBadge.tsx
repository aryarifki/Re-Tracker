"use client";

export default function SignalBadge({ signal }: { signal?: string | null }) {
  const s = (signal || "NEUTRAL").toUpperCase();
  const isBuy = s.includes("AKUMULASI") || s.includes("ACCUMULATION") || s.includes("BUY");
  const isSell = s.includes("DISTRIBUSI") || s.includes("DISTRIBUTION") || s.includes("SELL");
  
  let theme = "bg-neutral-800 text-neutral-400 border-neutral-700";
  if (isBuy) theme = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  else if (isSell) theme = "bg-rose-500/10 text-rose-400 border-rose-500/20";

  const display = (signal || "Neutral").replace(/_/g, " ").toLowerCase();
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold capitalize tracking-wide ${theme}`}>
      {display}
    </span>
  );
}
