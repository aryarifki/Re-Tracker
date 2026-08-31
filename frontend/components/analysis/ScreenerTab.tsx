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

  if (isLoading && !data) return <div className="text-neutral-300 font-medium p-8 animate-pulse text-center">Scanning market & compiling metrics...</div>;
  if (error) return <div className="text-red-400 font-bold p-4">Error loading screener data.</div>;

  const rawResults = data?.data || [];
  const meta = data?.meta || {};
  
  // FILTER LIKUIDITAS
  let results = rawResults.filter((r: any) => r.total_value >= minLiq);
  
  // FILTER AKUMULASI (Diperbaiki: Case-Insensitive)
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
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowOnlyAcc(!showOnlyAcc)}
            className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${showOnlyAcc ? 'bg-blue-500' : 'bg-neutral-600'}`}
          >
            <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${showOnlyAcc ? 'translate-x-5' : ''}`}></div>
          </button>
          <span className="text-sm font-semibold text-neutral-300">Show only Accumulation</span>
        </div>
        
        <button 
          onClick={() => mutate()}
          disabled={isValidating}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-sm font-bold text-neutral-200 transition-all disabled:opacity-50"
        >
          <Icon 
            icon={isValidating ? "line-md:loading-twotone-loop" : "mdi:refresh"} 
            className={isValidating ? "text-blue-400" : "text-blue-400"} 
            width="18" height="18" 
          />
          {isValidating ? "Scanning..." : "Run Screener"}
        </button>
      </div>

      <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 shadow-lg">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-neutral-700 pb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Multi-Ticker Screener <span className="text-blue-400">({universeMode.toUpperCase()})</span>
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-neutral-900 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded-md text-xs font-semibold">
                    Window {meta.window_start || "-"} to {meta.analysis_date || "-"}
                </span>
                <span className="text-xs text-neutral-400 self-center">
                    Filtering {rawResults.length} tickers down to {results.length} setups.
                </span>
            </div>
          </div>
          
          <div className="bg-neutral-900/50 px-4 py-2 rounded-lg border border-neutral-700 w-full md:w-64">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-neutral-400">Min. Daily Value:</span>
              <span className="text-emerald-400">{fmtRp(minLiq)}</span>
            </div>
            <input 
              type="range" 
              min="0" max="10000000000" step="500000000" 
              value={minLiq} 
              onChange={(e) => setMinLiq(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[600px] rounded-lg border border-neutral-700">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-neutral-900 text-neutral-300 border-b border-neutral-600 text-xs font-bold z-10">
              <tr>
                <th className="py-3 px-4">Ticker</th>
                <th className="py-3 px-4 text-center">Conviction</th>
                <th className="py-3 px-4 text-right">Foreign Net (5D)</th>
                <th className="py-3 px-4 text-right">Smart Net</th>
                <th className="py-3 px-4 text-center">Top Buyer</th>
                <th className="py-3 px-4 text-right text-yellow-500">Distance</th>
                <th className="py-3 px-4 text-center">Data Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700/50 bg-neutral-800 text-sm">
              {results.map((row: any, idx: number) => {
                const distanceVal = row.current_price && row.bandar_avg_price ? ((row.current_price - row.bandar_avg_price) / row.bandar_avg_price) * 100 : null;
                const upperSignal = (row.signal || "").toUpperCase();
                const isAcc = upperSignal.includes("ACCUMULATION") || upperSignal.includes("BUY");

                return (
                  <tr key={idx} className="hover:bg-neutral-700/80 transition-colors text-neutral-200">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{row.ticker}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${isAcc ? "text-emerald-400" : "text-rose-400"}`}>
                        {row.signal}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-1 rounded text-xs ${row.conviction_score >= 70 ? "bg-emerald-500/20 text-emerald-400" : row.conviction_score <= 30 ? "bg-rose-500/20 text-rose-400" : "text-neutral-300"}`}>
                        {row.conviction_score.toFixed(1)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono text-sm ${row.foreign_net > 0 ? "text-emerald-400" : row.foreign_net < 0 ? "text-rose-400" : "text-neutral-400"}`}>
                      {fmtRp(row.foreign_net)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold font-mono text-sm ${row.net_value > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {fmtRp(row.net_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold rounded">
                        {row.top_buyer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-sm">
                      {distanceVal !== null ? (
                        <span className={distanceVal <= 3 && distanceVal >= -5 ? "text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded" : distanceVal > 3 ? "text-neutral-400" : "text-rose-400"}>
                          {distanceVal > 0 ? "+" : ""}{distanceVal.toFixed(2)}%
                        </span>
                      ) : "-"}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-neutral-400 font-semibold font-mono">
                      {row.data_date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="p-8 text-center text-neutral-400 text-sm font-medium bg-neutral-800">
              No data matches your criteria. Try adjusting the slider or hit "Run Screener".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
