"use client";

import React from "react";

interface SignalBadgeProps {
  signal?: string | null;
  score?: number | null;
  size?: "sm" | "md" | "lg";
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({
  signal,
  score,
  size = "md",
}) => {
  const raw = (signal || "").toUpperCase();

  const isAcc =
    raw.includes("AKUMULASI") ||
    raw.includes("ACCUMULATION") ||
    raw.includes("BUY");
  const isDist =
    raw.includes("DISTRIBUSI") ||
    raw.includes("DISTRIBUTION") ||
    raw.includes("SELL");
  const isStrong = raw.includes("KUAT") || raw.includes("STRONG");

  let config = {
    label: signal ? signal.replace(/_/g, " ") : "NEUTRAL",
    bg: "bg-slate-800/80",
    text: "text-slate-300",
    border: "border-slate-700",
    dot: "bg-slate-400",
  };

  if (isAcc) {
    config = {
      label: isStrong ? "Strong Accumulation" : "Accumulation",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: isStrong ? "border-emerald-500/40" : "border-emerald-500/20",
      dot: "bg-emerald-400 animate-pulse",
    };
  } else if (isDist) {
    config = {
      label: isStrong ? "Strong Distribution" : "Distribution",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: isStrong ? "border-rose-500/40" : "border-rose-500/20",
      dot: "bg-rose-400 animate-pulse",
    };
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider backdrop-blur-md ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {score !== null && score !== undefined && (
        <span className="font-mono-nums opacity-75">({score.toFixed(0)})</span>
      )}
    </span>
  );
};
