"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ValidationProps {
  ticker: string;
  analysisDate: string;
  windowDays: number;
}

export default function ValidationTab({ ticker, analysisDate, windowDays }: ValidationProps) {
  const [showIndividual, setShowIndividual] = useState(false);

  // Gunakan parameter standar horizon=10, min_events=5
  const url = "/api/bandar/validation/" + ticker + "?analysis_date=" + analysisDate + "&window_days=" + windowDays + "&horizon=10&min_events=5";
  const { data, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0 });

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

  if (isLoading) return <div className="text-neutral-300 font-medium p-4 animate-pulse">Loading validation data...</div>;
  if (error || !data) return <div className="text-red-400 font-bold p-4">Error loading validation data.</div>;

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
  const themeColor = isBullish ? "#10b981" : "#f43f5e"; // Emerald vs Rose

  return (
    <div className="space-y-6">
      {/* SECTION 1: BROKER-SPECIFIC RETURN VALIDATION */}
      <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-4">Broker-Specific Return Validation</h3>
        {data.broker_scan?.length === 0 ? (
          <div className="text-neutral-400 text-xs">No broker passes the current validation settings.</div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-neutral-800 text-neutral-300 border-b border-neutral-600 text-xs z-10">
                <tr>
                  <th className="py-2 px-3 font-semibold">Ticker</th>
                  <th className="py-2 px-3 font-semibold">Broker</th>
                  <th className="py-2 px-3 text-right font-semibold">Events</th>
                  <th className="py-2 px-3 text-right font-semibold">Mean Return</th>
                  <th className="py-2 px-3 text-right font-semibold">Median Return</th>
                  <th className="py-2 px-3 text-right font-semibold">Win Rate</th>
                  <th className="py-2 px-3 text-right font-semibold">Avg Net Buy</th>
                  <th className="py-2 px-3 text-right font-semibold">Total Net Buy</th>
                  <th className="py-2 px-3 text-right font-semibold">P Value</th>
                  <th className="py-2 px-3 text-center font-semibold">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {data.broker_scan.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-700/60 transition-colors text-neutral-200 font-medium">
                    <td className="py-2 px-3">{b.ticker}</td>
                    <td className="py-2 px-3 font-bold text-blue-300">{b.broker_code}</td>
                    <td className="py-2 px-3 text-right">{b.n_events}</td>
                    <td className={"py-2 px-3 text-right " + (b.mean_fwd_return > 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(b.mean_fwd_return)}</td>
                    <td className={"py-2 px-3 text-right " + (b.median_fwd_return > 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(b.median_fwd_return)}</td>
                    <td className="py-2 px-3 text-right text-emerald-300">{fmtPct(b.win_rate)}</td>
                    <td className="py-2 px-3 text-right">{fmtRp(b.avg_net_value)}</td>
                    <td className="py-2 px-3 text-right">{fmtRp(b.total_net_value)}</td>
                    <td className="py-2 px-3 text-right font-mono">{b.p_value_one_sided?.toFixed(4) || "-"}</td>
                    <td className="py-2 px-3 text-center">
                      {b.significant ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold">YES</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300 border border-neutral-500 font-bold">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: ACCUMULATION EVENT STUDY */}
      <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-sm font-bold text-white">Accumulation Event Study</h3>
          <label className="flex items-center space-x-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showIndividual} onChange={(e) => setShowIndividual(e.target.checked)} />
              <div className={"block w-10 h-6 rounded-full transition-colors " + (showIndividual ? "bg-blue-500" : "bg-neutral-600")}></div>
              <div className={"dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform " + (showIndividual ? "transform translate-x-4" : "")}></div>
            </div>
            <span className="text-xs font-semibold text-neutral-300">Show individual event paths</span>
          </label>
        </div>

        {chartData.length === 0 ? (
          <div className="text-neutral-400 text-xs mb-4">No accumulation events in this window.</div>
        ) : (
          <React.Fragment>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                  <XAxis dataKey="day" stroke="#a3a3a3" fontSize={12} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#a3a3a3" fontSize={12} tickLine={false} tickFormatter={(val) => val.toFixed(1)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e5e5e5' }}
                    labelStyle={{ color: '#a3a3a3', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeDasharray="5 5" /> {/* Base line equivalent */}
                  
                  {/* Individual Paths */}
                  {showIndividual && data.event_study.paths.map((path: any) => (
                    <Line key={path.id} type="monotone" dataKey={path.id} stroke="#94a3b8" strokeWidth={1} dot={false} opacity={0.25} activeDot={false} isAnimationActive={false} />
                  ))}

                  {/* Range (25-75 percentile) */}
                  <Area type="monotone" dataKey="range" fill={themeColor} fillOpacity={0.2} stroke="none" isAnimationActive={false} />
                  
                  {/* Median Line */}
                  <Line type="monotone" dataKey="median" stroke={themeColor} strokeWidth={3} dot={{ r: 4, fill: themeColor, strokeWidth: 2, stroke: '#171717' }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Event Study Table */}
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-neutral-800 text-neutral-300 border-b border-neutral-600 text-xs z-10">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Ticker</th>
                    <th className="py-2 px-3 font-semibold">Signal Date</th>
                    <th className="py-2 px-3 font-semibold">Signal</th>
                    <th className="py-2 px-3 text-right font-semibold">+1D</th>
                    <th className="py-2 px-3 text-right font-semibold">+3D</th>
                    <th className="py-2 px-3 text-right font-semibold">+5D</th>
                    <th className="py-2 px-3 text-right font-semibold">+10D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/50">
                  {data.event_study.table.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-700/60 transition-colors text-neutral-200 font-medium">
                      <td className="py-2 px-3 font-bold">{row.ticker}</td>
                      <td className="py-2 px-3">{row.signal_date.split(" ")[0]}</td>
                      <td className="py-2 px-3">
                        <span className={"px-2 py-0.5 rounded text-[11px] font-bold " + (row.signal.includes("STRONG") ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400")}>
                          {row.signal.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{row.t_plus_1d?.toFixed(2) || "-"}</td>
                      <td className="py-2 px-3 text-right">{row.t_plus_3d?.toFixed(2) || "-"}</td>
                      <td className="py-2 px-3 text-right">{row.t_plus_5d?.toFixed(2) || "-"}</td>
                      <td className="py-2 px-3 text-right">{row.t_plus_10d?.toFixed(2) || "-"}</td>
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
