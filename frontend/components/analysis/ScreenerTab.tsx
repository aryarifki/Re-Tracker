"use client";

import React from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ScreenerProps {
  universeMode: string;
  analysisDate: string;
  windowDays: number;
}

export default function ScreenerTab({ universeMode, analysisDate, windowDays }: ScreenerProps) {
  const url = `/api/bandar/screener-v2?universe_mode=${universeMode}&analysis_date=${analysisDate}&window_days=${windowDays}`;
  const { data, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0 });

  if (isLoading) return <div className="text-neutral-300 font-medium p-8 animate-pulse text-center">Scanning market data... This may take a moment.</div>;
  if (error) return <div className="text-red-400 font-bold p-4">Error loading screener data.</div>;

  const results = data?.data || [];

  const fmtRp = (val: number) => {
    if (!val) return "-";
    const sign = val < 0 ? "-" : "";
    const n = Math.abs(val);
    if (n >= 1e12) return sign + "Rp " + (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9) return sign + "Rp " + (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return sign + "Rp " + (n / 1e6).toFixed(2) + " M";
    return sign + "Rp " + n.toLocaleString("id-ID");
  };

  const fmtPrice = (val: number) => {
    if (!val) return "-";
    return "Rp " + Math.round(val).toLocaleString("id-ID");
  };

  return (
    <div className="space-y-6">
      <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Smart Screener <span className="text-blue-400">({universeMode.toUpperCase()})</span>
          </h3>
          <div className="text-xs font-semibold text-neutral-400 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-700">
            Scanning <span className="text-white">{windowDays} Days</span> | Found <span className="text-emerald-400">{results.length}</span> Tickers
          </div>
        </div>

        <div className="overflow-auto max-h-[600px] rounded-lg border border-neutral-700">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-neutral-900 text-neutral-300 border-b border-neutral-600 text-[11px] uppercase tracking-wider z-10">
              <tr>
                <th className="py-3 px-4 font-bold">Ticker</th>
                <th className="py-3 px-4 font-bold">Signal</th>
                <th className="py-3 px-4 text-right font-bold">Net Value</th>
                <th className="py-3 px-4 text-right font-bold text-yellow-500">Bandar Avg Price</th>
                <th className="py-3 px-4 font-bold">Top Buyers</th>
                <th className="py-3 px-4 font-bold">Top Sellers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700/50 bg-neutral-800">
              {results.map((row: any, idx: number) => {
                const isAcc = row.signal.includes("ACCUMULATION") || row.signal.includes("BUY");
                const isDist = row.signal.includes("DISTRIBUTION") || row.signal.includes("SELL");
                
                let signalColor = "text-neutral-300 bg-neutral-700 border-neutral-500";
                if (isAcc) signalColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
                if (isDist) signalColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";

                return (
                  <tr key={idx} className="hover:bg-neutral-700/80 transition-colors text-neutral-200 font-medium">
                    <td className="py-3 px-4 font-bold text-white">{row.ticker}</td>
                    <td className="py-3 px-4">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${signalColor}`}>
                         {row.signal}
                       </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${row.net_value > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {fmtRp(row.net_value)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-yellow-400 bg-yellow-500/5">
                      {fmtPrice(row.bandar_avg_price)}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-300">{(row.top_buyers || []).join(", ")}</td>
                    <td className="py-3 px-4 font-bold text-rose-300">{(row.top_sellers || []).join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="p-8 text-center text-neutral-400 text-sm font-medium bg-neutral-800">
              No data available for the current universe and timeframe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
