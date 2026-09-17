"use client";

export default function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;

  const pts = data
    .map((v: number, i: number) => {
      const x = (i / (n - 1)) * 100;
      const y = 28 - ((v - min) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 28" className="w-16 h-7" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--color-positive)" : "var(--color-negative)"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
