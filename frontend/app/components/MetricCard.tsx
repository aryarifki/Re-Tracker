"use client";

export default function MetricCard({
  label, value, note, tone, title,
}: {
  label: string; value: string; note?: string;
  tone?: "positive" | "negative" | "warning" | "neutral"; title?: string;
}) {
  const color =
    tone === "positive" ? "text-[var(--green)]" :
    tone === "negative" ? "text-[var(--red)]" :
    tone === "warning"  ? "text-[var(--amber)]" : "text-[var(--strong)]";
  return (
    <div title={title} className="border border-[var(--line)] rounded-lg bg-[var(--panel)] px-3 py-2.5">
      <div className="text-[0.61rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
        {label}
      </div>
      <div className={`text-[1.05rem] font-bold ${color}`}>{value}</div>
      {note && <div className="text-[0.65rem] text-[var(--muted)] mt-0.5">{note}</div>}
    </div>
  );
}
