"use client";

export default function SignalBadge({ signal }: { signal?: string | null }) {
  const s = (signal || "NEUTRAL").toUpperCase();
  const isBuy = s.includes("AKUMULASI") || s.includes("ACCUMULATION") || s.includes("BUY");
  const isSell = s.includes("DISTRIBUSI") || s.includes("DISTRIBUTION") || s.includes("SELL");
  
  let theme = "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]";
  
  if (isBuy) {
    // Background tetap dengan transparansi Tailwind, tetapi warna teks menggunakan variabel CSS kita
    theme = "bg-emerald-500/10 border-emerald-500/20 text-[var(--color-positive)]";
  } else if (isSell) {
    theme = "bg-rose-500/10 border-rose-500/20 text-[var(--color-negative)]";
  }

  const display = (signal || "Neutral").replace(/_/g, " ").toLowerCase();
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold capitalize tracking-wide ${theme}`}>
      {display}
    </span>
  );
}
