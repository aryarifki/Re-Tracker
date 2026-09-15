"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ValidationProps {
  ticker: string;
  analysisDate: string;
  windowDays: number;
  universeMode: string;
  horizon: number;
  minEvents: number;
}

export default function ValidationTab({ ticker, analysisDate, windowDays, universeMode, horizon, minEvents }: ValidationProps) {
  const [scanMode, setScanMode] = useState<"ticker" | "all">("ticker");
  const [showIndividual, setShowIndividual] = useState(false);

  const url = "/api/bandar/validation-v2/" + ticker + 
              "?analysis_date=" + analysisDate + 
              "&window_days=" + windowDays + 
              "&horizon=" + horizon + 
              "&min_events=" + minEvents + 
              "&universe_mode=" + universeMode;
              
  const { data, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0, revalidateOnFocus: false });

  const chartData = useMemo(() => {
    if (!data?.event_study?.chart) return [];
    return data.event_study.chart.map((item: any) => {
      const row = { ...item };
      (data.event_study.paths || []).forEach((path: any) => {
        row[path.id] = path.data[item.day];
      });
      return row;
    });
  }, [data]);

  const sortedScanData = useMemo(() => {
    if (!data?.broker_scan) return [];
    
    const rawData = scanMode === "ticker" ? data.broker_scan.ticker : data.broker_scan.all;
    if (!rawData) return [];

    return [...rawData].sort((a, b) => {
      if (a.significant && !b.significant) return -1;
      if (!a.significant && b.significant) return 1;
      const wrA = a.win_rate || 0;
      const wrB = b.win_rate || 0;
      if (wrB !== wrA) return wrB - wrA;
      const pA = a.p_value_one_sided ?? 1;
      const pB = b.p_value_one_sided ?? 1;
      if (pA !== pB) return pA - pB;
      const mrA = a.mean_fwd_return || 0;
      const mrB = b.mean_fwd_return || 0;
      return mrB - mrA;
    });
  }, [data, scanMode]);

  if (isLoading) return <div className="p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] rounded-xl flex items-center justify-center gap-3 text-[var(--md-sys-color-on-surface-variant)] shadow-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin text-[var(--md-sys-color-primary)]" width="20" /> <span className="text-sm font-medium">Running historical validation models...</span></div>;
  if (error || !data) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-[var(--color-negative)] text-sm rounded-xl">Error loading validation data.</div>;

  const fmtPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return (val > 0 ? "+" : "") + (val * 100).toFixed(2) + "%";
  };

  const fmtRp = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    const sign = val < 0 ? "-" : "";
    const n = Math.abs(val);
    if (n >= 1e12) return sign + "Rp " + (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9) return sign + "Rp " + (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return sign + "Rp " + (n / 1e6).toFixed(2) + " M";
    return sign + "Rp " + n.toLocaleString("id-ID");
  };

  const isBullish = chartData.length > 0 && chartData[chartData.length - 1].median >= 100;
  // Ini untuk Chart (butuh value hex asli, bukan variable) 
  // Kita fallback ke warna default jika tidak bisa baca
  const themeColor = isBullish ? "#10b981" : "#f43f5e"; 

  return (
    <div className="space-y-4">
      
      {/* ====== BROKER-SPECIFIC RETURN VALIDATION ====== */}
      <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="ph:check-square-offset-duotone" className="text-[var(--md-sys-color-on-surface-variant)]" width="18" />
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Broker-Specific Return Validation</h3>
          </div>
          
          <div className="flex items-center bg-[var(--md-sys-color-surface)] p-1 rounded-md border border-[var(--md-sys-color-outline-variant)]">
            <button 
              onClick={() => setScanMode("ticker")} 
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${scanMode === "ticker" ? "bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/20" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] border border-transparent"}`}
            >
              Current Ticker ({ticker})
            </button>
            <button 
              onClick={() => setScanMode("all")} 
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${scanMode === "all" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] border border-transparent"}`}
            >
              Watchlist ({universeMode})
            </button>
          </div>
        </div>

        {sortedScanData.length === 0 ? (
          <div className="text-[var(--md-sys-color-on-surface-variant)] text-xs text-center py-8">No broker passes the current validation settings.</div>
        ) : (
          <div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-[var(--md-sys-color-outline-variant)] pb-2">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-[var(--md-sys-color-surface-container)] z-10">
                <tr className="text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)]">
                  <th className="py-2.5 px-3 font-medium rounded-tl-md">Ticker</th>
                  <th className="py-2.5 px-3 font-medium">Broker</th>
                  <th className="py-2.5 px-3 text-right font-medium">Events</th>
                  <th className="py-2.5 px-3 text-right font-medium">Win Rate</th>
                  <th className="py-2.5 px-3 text-right font-medium">Mean Ret</th>
                  <th className="py-2.5 px-3 text-right font-medium">Median Ret</th>
                  <th className="py-2.5 px-3 text-right font-medium">Total Net Buy</th>
                  <th className="py-2.5 px-3 text-right font-medium">P-Value</th>
                  <th className="py-2.5 px-3 text-center font-medium rounded-tr-md">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                {sortedScanData.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">{b.ticker}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-blue-500 dark:text-blue-400">{b.broker_code}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--md-sys-color-on-surface)]">{b.n_events}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--color-positive)]">{fmtPct(b.win_rate)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium" style={{ color: b.mean_fwd_return > 0 ? "var(--color-positive)" : b.mean_fwd_return < 0 ? "var(--color-negative)" : "var(--md-sys-color-on-surface-variant)" }}>{fmtPct(b.mean_fwd_return)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium" style={{ color: b.median_fwd_return > 0 ? "var(--color-positive)" : b.median_fwd_return < 0 ? "var(--color-negative)" : "var(--md-sys-color-on-surface-variant)" }}>{fmtPct(b.median_fwd_return)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--md-sys-color-on-surface-variant)]">{fmtRp(b.total_net_value)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--md-sys-color-on-surface-variant)]">{b.p_value_one_sided?.toFixed(4) || "-"}</td>
                    <td className="py-2.5 px-3 text-center">
                      {b.significant ? (
                        <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-emerald-500/10 text-[var(--color-positive)] border-emerald-500/20">YES</span>
                      ) : (
                        <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== ACCUMULATION EVENT STUDY ====== */}
      <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="ph:trend-up-duotone" className="text-[var(--md-sys-color-on-surface-variant)]" width="18" />
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Accumulation Event Study</h3>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showIndividual} onChange={(e) => setShowIndividual(e.target.checked)} />
              <div className={`block w-9 h-5 rounded-full transition-colors ${showIndividual ? "bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]"}`}></div>
              <div className={`absolute left-[3px] top-[3px] bg-neutral-300 dark:bg-neutral-400 w-3.5 h-3.5 rounded-full transition-transform ${showIndividual ? "transform translate-x-4 bg-[var(--md-sys-color-primary)]" : ""}`}></div>
            </div>
            <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wide">Show individual paths</span>
          </label>
        </div>

        {chartData.length === 0 ? (
          <div className="text-[var(--md-sys-color-on-surface-variant)] text-xs text-center py-8">No accumulation events found in this window.</div>
        ) : (
          <React.Fragment>
            {/* Chart Container */}
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="day" stroke="var(--md-sys-color-outline-variant)" fontSize={10} fill="var(--md-sys-color-on-surface-variant)" tickLine={false} axisLine={false} dy={10} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--md-sys-color-outline-variant)" fontSize={10} fill="var(--md-sys-color-on-surface-variant)" tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(1)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: '8px', fontSize: '12px', boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    itemStyle={{ color: 'var(--md-sys-color-on-surface)' }}
                    labelStyle={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <ReferenceLine y={100} stroke="var(--md-sys-color-outline)" strokeDasharray="4 4" strokeWidth={1} />
                  
                  {showIndividual && (data.event_study?.paths || []).map((path: any) => (
                    <Line key={path.id} type="monotone" dataKey={path.id} stroke="var(--md-sys-color-outline)" strokeWidth={1} dot={false} opacity={0.3} activeDot={false} isAnimationActive={false} />
                  ))}
                  
                  <Area type="monotone" dataKey="range" fill={themeColor} fillOpacity={0.1} stroke="none" isAnimationActive={false} />
                  <Line type="monotone" dataKey="median" stroke={themeColor} strokeWidth={2} dot={{ r: 4, fill: themeColor, strokeWidth: 2, stroke: 'var(--md-sys-color-surface-container)' }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Event Study Table */}
            <div className="max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-[var(--md-sys-color-outline-variant)] pb-2">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[var(--md-sys-color-surface-container)]">
                  <tr className="text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)]">
                    <th className="py-2.5 px-3 font-medium rounded-tl-md">Ticker</th>
                    <th className="py-2.5 px-3 font-medium">Signal Date</th>
                    <th className="py-2.5 px-3 font-medium">Signal</th>
                    <th className="py-2.5 px-3 text-right font-medium">+1D</th>
                    <th className="py-2.5 px-3 text-right font-medium">+3D</th>
                    <th className="py-2.5 px-3 text-right font-medium">+5D</th>
                    <th className="py-2.5 px-3 text-right font-medium rounded-tr-md">+10D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                  {(data.event_study?.table || []).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors text-[var(--md-sys-color-on-surface)]">
                      <td className="py-2.5 px-3 font-bold">{row.ticker}</td>
                      <td className="py-2.5 px-3 text-[var(--md-sys-color-on-surface-variant)] font-mono">{row.signal_date.split(" ")[0]}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] uppercase ${row.signal.includes("STRONG") ? "bg-emerald-500/10 text-[var(--color-positive)] border-emerald-500/20" : "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20"}`}>
                          {row.signal.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.t_plus_1d?.toFixed(2) || "-"}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.t_plus_3d?.toFixed(2) || "-"}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.t_plus_5d?.toFixed(2) || "-"}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.t_plus_10d?.toFixed(2) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
