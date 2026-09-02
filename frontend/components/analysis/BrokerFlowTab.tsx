"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ==================== Formatters ==================== */
function fmtRp(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1e12) return sign + "Rp " + (v / 1e12).toFixed(2) + " T";
  if (v >= 1e9) return sign + "Rp " + (v / 1e9).toFixed(2) + " B";
  if (v >= 1e6) return sign + "Rp " + (v / 1e6).toFixed(2) + " M";
  return sign + "Rp " + v.toLocaleString("id-ID");
}

function signedColor(n: number): string {
  return n >= 0 ? "#10b981" : "#f43f5e";
}

const COLORS = ["#3b82f6", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"];

const PROFILE_OPTIONS = [
  { key: "all", label: "All Profiles" },
  { key: "smart_foreign", label: "Foreign Smart Money" },
  { key: "local_institutional", label: "Local Institutions" },
  { key: "market_maker", label: "Market Makers" },
  { key: "bandar_gorengan", label: "Speculative Operators" },
  { key: "retail", label: "Retail-Dominant" },
  { key: "lainnya", label: "Other Brokers" },
];

export default function BrokerFlowTab({ ticker, analysisDate, windowDays }: { ticker: string; analysisDate: string; windowDays: number }) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [flowMode, setFlowMode] = useState("Cumulative");
  const [distMode, setDistMode] = useState("Date range");
  const [distDate, setDistDate] = useState(analysisDate);
  const [distStart, setDistStart] = useState(analysisDate);
  const [distEnd, setDistEnd] = useState(analysisDate);
  const [profileFilter, setProfileFilter] = useState("all");

  // FIX 1: Memasukkan semua variabel mode dan kalender ke dalam Query URL
  const qs = "?window_days=" + windowDays + 
             (analysisDate ? "&analysis_date=" + analysisDate : "") + 
             "&flow_mode=" + flowMode + 
             "&dist_mode=" + encodeURIComponent(distMode) + 
             "&dist_date=" + distDate + 
             "&dist_start=" + distStart + 
             "&dist_end=" + distEnd + 
             (selectedCodes.length > 0 ? "&broker_codes=" + selectedCodes.join(",") : "");
             
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/broker-flow/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!data) return;
    if (selectedCodes.length === 0 && data.default_codes) {
      setSelectedCodes(data.default_codes.slice(0, 3));
    }
  }, [data?.default_codes]);

  // FIX 2: Otomatis memundurkan tanggal `distStart` sesuai dengan rentang `windowDays`
  useEffect(() => {
    if (analysisDate) {
      setDistDate(analysisDate);
      setDistEnd(analysisDate);
      
      const dateObj = new Date(analysisDate);
      if (!isNaN(dateObj.getTime())) {
         dateObj.setDate(dateObj.getDate() - windowDays);
         const yyyy = dateObj.getFullYear();
         const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
         const dd = String(dateObj.getDate()).padStart(2, '0');
         setDistStart(`${yyyy}-${mm}-${dd}`);
      }
    }
  }, [analysisDate, windowDays]);

  const toggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      if (selectedCodes.length >= 10) return; 
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  if (isLoading) return <div className="p-8 border border-white/[0.07] bg-[#0F1117] rounded-xl flex items-center justify-center gap-3 text-neutral-400"><Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> <span className="text-sm font-medium">Extracting broker flow data...</span></div>;
  if (error || data?.error) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{data?.error || "Error"}</div>;

  const chartData = data?.compare_chart || [];
  const dist = data?.distribution || { buyers: [], sellers: [], edges: [], dist_start: "-", dist_end: "-" };
  const summary = data?.summary || [];
  const detailRows = data?.detail_rows || [];
  const profileFlow = data?.profile_flow || [];
  const profileDetail = data?.profile_broker_detail || [];

  const filteredProfileDetail = profileFilter === "all" ? profileDetail : profileDetail.filter((r: any) => r.profile_key === profileFilter);

  return (
    <div className="space-y-6">
      
      {/* ====== CHART CONTROLS & BROKER SELECTION ====== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            <select 
              className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-emerald-500/50 min-w-[120px]"
              onChange={(e) => {
                if (e.target.value) toggleCode(e.target.value);
                e.target.value = ""; 
              }}
            >
              <option value="">+ Add Broker</option>
              {(data?.all_codes || []).map((code: string) => (
                <option key={code} value={code} disabled={selectedCodes.includes(code)}>{code}</option>
              ))}
            </select>
            
            <div className="flex flex-wrap gap-2">
              {selectedCodes.map((code: string) => (
                <div key={code} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-sm font-semibold tracking-wide">
                  {code}
                  <button onClick={() => toggleCode(code)} className="hover:text-rose-400 transition-colors p-0.5 rounded-md hover:bg-emerald-500/20"><Icon icon="ph:x-bold" width="12" /></button>
                </div>
              ))}
            </div>
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Flow mode</label>
            <select className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50" value={flowMode} onChange={(e) => setFlowMode(e.target.value)}>
                <option value="Cumulative">Cumulative</option>
                <option value="Daily">Daily</option>
            </select>
            <p className="text-[11px] text-neutral-500 mt-1.5">Cumulative mode sums broker net flow across the selected broker window. Daily mode shows each date separately.</p>
        </div>
      </div>

      {/* ====== BROKER FLOW COMPARISON CHART ====== */}
      {selectedCodes.length > 0 && (
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Broker Flow Comparison, {flowMode} in Selected Window</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} label={{ value: 'Cumulative Net Value, Rp B', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0F1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#e5e5e5" }} labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }} formatter={(value: any, name: string) => ["Rp " + Number(value).toFixed(2) + " B", name]} />
                <ReferenceLine y={0} stroke="#525252" strokeWidth={1} />
                {selectedCodes.map((code: string, i: number) => (
                  <Line key={code} type="monotone" dataKey={code} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5, stroke: "#08090C", strokeWidth: 2 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ====== BROKER PROFILE FLOW ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
            <Icon icon="ph:link-bold" className="text-neutral-500" width="16" />
            <h3 className="text-sm font-semibold text-neutral-200">Broker Profile Flow</h3>
        </div>
        
        {profileFlow.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">No profile flow detected.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileFlow.map((row: any, i: number) => {
                const maxAbs = Math.max(...profileFlow.map((r: any) => Math.abs(r.net)), 1);
                const width = Math.max(3, (Math.abs(row.net) / maxAbs) * 100);
                return (
                <div key={i} className="bg-[#08090C] border border-white/[0.05] rounded-lg p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-sm font-bold text-neutral-200">{row.label}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">{row.description}</div>
                        </div>
                        <span className="font-mono font-bold text-sm" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</span>
                    </div>
                    <div>
                        <div className="h-1.5 bg-[#0F1117] rounded-full overflow-hidden border border-white/[0.02] mb-3">
                        <div className="h-full rounded-full" style={{ width: width + "%", backgroundColor: signedColor(row.net) }} />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                        {(row.top_brokers || []).map((b: any, j: number) => (
                            <span key={j} className="inline-flex items-center gap-1.5 text-[10px] bg-[#0F1117] border border-white/[0.07] rounded-md px-2 py-1">
                                <span className="font-mono font-bold text-neutral-300">{b.broker_code}</span>
                                <span className="text-neutral-500 uppercase">{b.participant_type === "Asing" ? "FOREIGN" : b.participant_type === "Lokal" ? "LOCAL" : b.participant_type}</span>
                                <span className="font-mono" style={{ color: signedColor(b.net) }}>{fmtRp(b.net)}</span>
                            </span>
                        ))}
                        </div>
                    </div>
                </div>
                );
            })}
          </div>
        )}
      </div>

      {/* ====== PROFILE DETAIL ====== */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-400 mb-1">Profile detail</label>
        <select className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50" value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
            {PROFILE_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl shadow-sm overflow-hidden mt-2">
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium">Profile</th>
                        <th className="py-2.5 px-3 font-medium">Broker</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell</th>
                        <th className="py-2.5 px-3 text-right font-medium">Net</th>
                        <th className="py-2.5 px-3 text-right font-medium">Freq</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                    {filteredProfileDetail.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-neutral-300">{row.profile}</td>
                        <td className="py-2.5 px-3 text-neutral-200 font-mono">{row.broker}</td>
                        <td className="py-2.5 px-3 uppercase text-neutral-400">{row.type}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">{fmtRp(row.buy)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">{fmtRp(row.sell)}</td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.freq.toLocaleString("id-ID")}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {filteredProfileDetail.length === 0 && <div className="text-center text-xs text-neutral-500 py-6">No data for selected profile.</div>}
            </div>
        </div>
      </div>

      {/* ====== BROKER DISTRIBUTION ====== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 border-b border-white/[0.05] pb-2">
            <Icon icon="ph:link-bold" className="text-neutral-500" width="16" />
            <h3 className="text-sm font-semibold text-neutral-200">Broker Distribution</h3>
        </div>
        
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Distribution mode</label>
                <select className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50" value={distMode} onChange={(e) => setDistMode(e.target.value)}>
                    <option value="Single day">Single day</option>
                    <option value="Date range">Date range</option>
                </select>
            </div>
            
            <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Distribution date</label>
                {distMode === "Single day" ? (
                    <input type="date" className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none font-mono" value={distDate} onChange={(e) => setDistDate(e.target.value)} />
                ) : (
                    <div className="flex items-center gap-2">
                    <input type="date" className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none font-mono" value={distStart} onChange={(e) => setDistStart(e.target.value)} />
                    <span className="text-neutral-500 text-xs">to</span>
                    <input type="date" className="w-full md:w-64 bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none font-mono" value={distEnd} onChange={(e) => setDistEnd(e.target.value)} />
                    </div>
                )}
            </div>
            <p className="text-[11px] text-neutral-500">The flow chart below uses broker-to-broker distribution edges returned by the live API.</p>
        </div>

        {/* Estimated Counterparties */}
        {dist.edges.length > 0 ? (
            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm mt-4">
                <h4 className="text-sm font-semibold text-neutral-200 mb-4">
                   Estimated Counterparties on {distMode === "Single day" ? distDate : `${distStart} to ${distEnd}`}
                </h4>
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 space-y-1.5 pr-2">
                {dist.edges.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-[#08090C] border border-white/[0.05] rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 w-1/3">
                        <span className="text-emerald-400 font-mono font-bold">{e.buyer_code}</span>
                        <span className="text-[9px] text-neutral-500 uppercase">{e.buyer_type}</span>
                    </div>
                    <div className="w-1/3 text-center">
                        <Icon icon="ph:arrow-right" className="text-neutral-600 inline-block" />
                    </div>
                    <div className="flex items-center justify-end gap-2 w-1/3">
                        <span className="text-[9px] text-neutral-500 uppercase">{e.seller_type}</span>
                        <span className="text-rose-400 font-mono font-bold">{e.seller_code}</span>
                    </div>
                    <span className="text-neutral-300 font-mono tabular-nums ml-4">{fmtRp(e.matched_value)}</span>
                    </div>
                ))}
                </div>
            </div>
        ) : (
            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm mt-4 text-center text-xs text-neutral-500 py-6">
                No distribution data found for the selected dates.
            </div>
        )}
      </div>

      {/* ====== BROKER SUMMARY ====== */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-400 mb-1">Broker Summary</label>
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl shadow-sm overflow-hidden">
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium">Buy Broker</th>
                        <th className="py-2.5 px-3 font-medium">Buy Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy Value</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy Lot</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy Avg</th>
                        <th className="py-2.5 px-3 font-medium">Sell Broker</th>
                        <th className="py-2.5 px-3 font-medium">Sell Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell Value</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell Lot</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell Avg</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                    {summary.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-neutral-200 font-mono">{row.buy_broker || ""}</td>
                        <td className="py-2.5 px-3 uppercase text-neutral-400">{row.buy_type || ""}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-200">{fmtRp(row.buy_value)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.buy_lot ? row.buy_lot.toLocaleString("id-ID") : "None"}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.buy_avg ? row.buy_avg.toFixed(0) : "None"}</td>
                        <td className="py-2.5 px-3 text-neutral-200 font-mono">{row.sell_broker || ""}</td>
                        <td className="py-2.5 px-3 uppercase text-neutral-400">{row.sell_type || ""}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-200">{fmtRp(row.sell_value)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.sell_lot ? row.sell_lot.toLocaleString("id-ID") : "None"}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.sell_avg ? row.sell_avg.toFixed(0) : "None"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* ====== DETAILED BROKER ROWS ====== */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-400 mb-1">Detailed broker rows</label>
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl shadow-sm overflow-hidden">
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium">Broker</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell</th>
                        <th className="py-2.5 px-3 text-right font-medium">Net</th>
                        <th className="py-2.5 px-3 text-right font-medium">Freq</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                    {detailRows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-neutral-200 font-mono">{row.broker}</td>
                        <td className="py-2.5 px-3 uppercase text-neutral-400">{row.type}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">{row.buy ? fmtRp(row.buy) : "Rp 0"}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">{row.sell ? fmtRp(row.sell) : "Rp 0"}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-300">{row.freq ? row.freq.toFixed(6) : "0"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
    </div>
  );
}
