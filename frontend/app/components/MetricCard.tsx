"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  tone?: "positive" | "negative" | "warning" | "neutral";
  tooltip?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  tone = "neutral",
  tooltip,
  icon,
}) => {
  const toneColors = {
    positive: "text-emerald-400 border-l-emerald-500 bg-emerald-500/[0.02]",
    negative: "text-rose-400 border-l-rose-500 bg-rose-500/[0.02]",
    warning: "text-amber-400 border-l-amber-500 bg-amber-500/[0.02]",
    neutral: "text-slate-200 border-l-slate-600 bg-slate-800/[0.02]",
  };

  const badgeBg = {
    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    negative: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    neutral: "bg-slate-800 text-slate-400 border-slate-700",
  };

  return (
    <div
      title={tooltip}
      className={`relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0F1117] p-4 transition-all duration-200 hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/40 border-l-4 ${toneColors[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono-nums text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
          {value}
        </span>
      </div>

      {subValue && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium font-mono-nums ${badgeBg[tone]}`}
          >
            {subValue}
          </span>
        </div>
      )}
    </div>
  );
};
