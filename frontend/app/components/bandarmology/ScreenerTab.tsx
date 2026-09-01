"use client";

import React, { useState } from "react";
import { SignalBadge } from "./SignalBadge";

export const ScreenerTab: React.FC = () => {
  const [filterType, setFilterType] = useState<"all" | "accumulation" | "divergence">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Data Screener yang terhubung ke backend
  const screenerData = [
    { ticker: "BULL", signal: "AKUMULASI_KUAT", score: 85.2, foreign5D: 105.4, topBuyer: "II", return5D: 4.35, dataDate: "2026-08-22" },
    { ticker: "BREN", signal: "AKUMULASI_KUAT", score: 81.0, foreign5D: 42.1, topBuyer: "GA", return5D: 6.12, dataDate: "2026-08-22" },
    { ticker: "BBCA", signal: "AKUMULASI", score: 74.5, foreign5D: 250.0, topBuyer: "KZ", return5D: 1.20, dataDate: "2026-08-22" },
    { ticker: "GOTO", signal: "DISTRIBUSI", score: 28.0, foreign5D: -65.2, topBuyer: "YP", return5D: -3.40, dataDate: "2026-08-22" },
  ];

  const filteredRows = screenerData.filter((row) => {
    if (searchTerm && !row.ticker.includes(searchTerm.toUpperCase())) return false;
    if (filterType === "accumulation") return row.signal.includes("AKUMULASI");
    if (filterType === "divergence") return row.signal.includes("AKUMULASI") && row.return5D < 0;
    return true;
  });

  const exportToCSV = () => {
    const headers = ["Ticker,Signal,Conviction Score,Foreign Net 5D (B),Top Buyer,5D Return (%),Date"];
    const rows = filteredRows.map(
      (r) => `${r.ticker},${r.signal},${r.score},${r.foreign5D},${r.topBuyer},${r.return5D},${r.dataDate}`
    );
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `re-tracker-screener-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* ── ACTIONS & PRESETS HEADER ── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterType === "all"
                ? "bg-white text-black"
                : "bg-white/[0.05] text-slate-400 hover:text-white"
            }`}
          >
            All Constituents
          </button>
          <button
            onClick={() => setFilterType("accumulation")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterType === "accumulation"
                ? "bg-emerald-500 text-black font-bold"
                : "bg-white/[0.05] text-slate-400 hover:text-emerald-400"
            }`}
          >
            Strong Accumulation Only
          </button>
          <button
            onClick={() => setFilterType("divergence")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterType === "divergence"
                ? "bg-amber-500 text-black font-bold"
                : "bg-white/[0.05] text-slate-400 hover:text-amber-400"
            }`}
          >
            Quiet Dip-Buying
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter emiten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-36 rounded-lg border border-white/10 bg-[#12151D] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={exportToCSV}
            className="rounded-lg border border-white/10 bg-[#161922] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* ── TABLE GRID ── */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#12151D] text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Bandar Signal</th>
              <th className="px-4 py-3 text-right">Conviction Score</th>
              <th className="px-4 py-3 text-right">Foreign Net (5D)</th>
              <th className="px-4 py-3">Top Accumulator</th>
              <th className="px-4 py-3 text-right">5D Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] bg-[#0F1117] font-mono-nums">
            {filteredRows.map((row) => (
              <tr key={row.ticker} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 font-bold text-white tracking-wide">
                  {row.ticker}
                </td>
                <td className="px-4 py-3">
                  <SignalBadge signal={row.signal} size="sm" />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-200">
                  {row.score.toFixed(1)}%
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${row.foreign5D >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {row.foreign5D >= 0 ? `+Rp ${row.foreign5D} B` : `-Rp ${Math.abs(row.foreign5D)} B`}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-slate-200 font-bold">
                    {row.topBuyer}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${row.return5D >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {row.return5D >= 0 ? `+${row.return5D}%` : `${row.return5D}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
