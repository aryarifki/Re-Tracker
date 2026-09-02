"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ScreenerProps {
  universeMode: string;
  analysisDate: string;
  windowDays: number;
}

export default function ScreenerTab({ universeMode, analysisDate, windowDays }: ScreenerProps) {
  const [minLiq, setMinLiq] = useState<number>(0); 
  const [showOnlyAcc, setShowOnlyAcc] = useState<boolean>(false);

  const url = `/api/bandar/screener-v2?universe_mode=${universeMode}&analysis_date=${analysisDate}&window_days=${windowDays}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, { 
    refreshInterval: 0, 
    revalidateOnFocus: false 
  });

  if (isLoading && !data) return <div className="p-8 border border-white/[0.07] bg-[#0F1117] rounded-xl flex items-center justify-center gap-3 text-neutral-400 shadow-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> <span className="text-sm font-medium">Scanning market & compiling metrics...</span></div>;
  if (error) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">Error loading screener data.</div>;

  const rawResults = data?.data || [];
  const meta = data?.meta || {};
  
  let results = rawResults.filter((r: any) => r.total_value >= minLiq);
  
  if (showOnlyAcc) {
    results = results.filter((r: any) => {
      const sig = (r.signal || "").toUpperCase();
      return sig.includes("ACCUMULATION") || sig.includes("BUY");
    });
  }

  const fmtRp = (val: number) => {
    if (!val) return "-";
    const sign = val < 0 ? "-" : "";
    const n = Math.abs(val);
    if (n >= 1e12) return sign + "Rp " + (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9) return sign + "Rp " + (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return sign + "Rp " + (n / 1e6).toFixed(2) + " M";
    return sign + "Rp " + n.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-4">
      
      {/* ====== CONTROLS ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="ph:funnel-duotone" className="text-blue-500" width="18" />
                    <h3 className="text-sm font-semibold text-neutral-200">Terminal Screener</h3>
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-2 font-bold">
                    <span>Target: <span className="text-blue-400">{universeMode}</span></span>
                    <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                    <span>{meta.window_start || "-"} to {meta.analysis_date || "-"}</span>
                    <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                    <span className="text-neutral-400">{results.length} Setups</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer select-none border border-white/[0.07] bg-[#08090C] rounded-md px-3 py-1.5 active:scale-[0.98] transition-all">
                    <input type="checkbox" checked={showOnlyAcc} onChange={(e) => setShowOnlyAcc(e.target.checked)} className="rounded bg-[#08090C] border-white/[0.07] accent-blue-500 w-4 h-4" />
                    <span className="text-xs font-semibold">Accumulation Only</span>
                </label>
                
                <select 
                    className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-blue-500/50 flex-grow md:flex-grow-0"
                    value={minLiq}
                    onChange={(e) => setMinLiq(Number(e.target.value))}
                >
                    <option value={0}>Any Liquidity</option>
                    <option value={1000000000}>&gt; Rp 1B Daily</option>
                    <option value={5000000000}>&gt; Rp 5B Daily</option>
                    <option value={10000000000}>&gt; Rp 10B Daily</option>
                </select>

                <button 
                    onClick={() => mutate()}
                    disabled={isValidating}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md text-xs font-semibold text-neutral-300 transition-all active:scale-[0.98] disabled:opacity-50 flex-grow md:flex-grow-0"
                >
                    <Icon icon={isValidating ? "ph:spinner-gap-duotone" : "ph:play-duotone"} className={isValidating ? "animate-spin" : ""} width="14" />
                    {isValidating ? "Scanning" : "Run Scan"}
                </button>
            </div>
        </div>
      </div>

      {/* ====== DATA GRID ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="sticky top-0 bg-[#0F1117] z-10">
              <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                <th className="py-3 px-4 font-medium">Asset</th>
                <th className="py-3 px-4 text-center font-medium">Conviction</th>
                <th className="py-3 px-4 text-right font-medium">Foreign (5D)</th>
                <th className="py-3 px-4 text-right font-medium">Smart Net</th>
                <th className="py-3 px-4 text-center font-medium">Top Buyer</th>
                <th className="py-3 px-4 text-right font-medium">Distance</th>
                <th className="py-3 px-4 text-center font-medium">As Of</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {results.map((row: any, idx: number) => {
                const distanceVal = row.current_price && row.bandar_avg_price ? ((row.current_price - row.bandar_avg_price) / row.bandar_avg_price) * 100 : null;
                const upperSignal = (row.signal || "").toUpperCase();
                const isAcc = upperSignal.includes("ACCUMULATION") || upperSignal.includes("BUY");
                const isDist = upperSignal.includes("DISTRIBUTION") || upperSignal.includes("SELL");

                let sigTheme = "text-neutral-500";
                if (isAcc) sigTheme = "text-emerald-400";
                else if (isDist) sigTheme = "text-rose-400";

                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-sm text-neutral-100">{row.ticker}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${sigTheme}`}>
                        {row.signal}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-[1.5px] rounded border tracking-wide text-[10px] ${row.conviction_score >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : row.conviction_score <= 30 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                        {row.conviction_score.toFixed(1)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-medium ${row.foreign_net > 0 ? "text-emerald-400/90" : row.foreign_net < 0 ? "text-rose-400/90" : "text-neutral-400"}`}>
                      {fmtRp(row.foreign_net)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${row.net_value > 0 ? "text-emerald-400" : row.net_value < 0 ? "text-rose-400" : "text-neutral-400"}`}>
                      {fmtRp(row.net_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-[1.5px] bg-[#08090C] border border-white/[0.07] text-neutral-300 font-mono text-[10px] font-bold rounded">
                        {row.top_buyer || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {distanceVal !== null ? (
                        <span className={distanceVal <= 3 && distanceVal >= -5 ? "text-emerald-400" : distanceVal > 3 ? "text-neutral-500" : "text-rose-400"}>
                          {distanceVal > 0 ? "+" : ""}{distanceVal.toFixed(2)}%
                        </span>
                      ) : <span className="text-neutral-500">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-[10px] text-neutral-500 font-semibold font-mono">
                      {row.data_date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="py-12 text-center text-neutral-500 text-xs font-medium bg-[#0F1117]">
              No setups match your target matrix. Adjust filters or re-run scan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
