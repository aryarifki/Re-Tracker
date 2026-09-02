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

function getTypeChip(type: string) {
  const t = type?.toUpperCase() || "";
  if (t === "FOREIGN" || t === "ASING") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (t === "LOCAL" || t === "LOKAL") return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  if (t === "GOV" || t === "PEMERINTAH") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  return "text-neutral-400 bg-neutral-800 border-neutral-700";
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
  const [compareMode, setCompareMode] = useState(true);
  const [maxBrokers, setMaxBrokers] = useState(5);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [flowMode, setFlowMode] = useState("Cumulative");
  const [distMode, setDistMode] = useState("Single day");
  const [distDate, setDistDate] = useState(analysisDate);
  const [distStart, setDistStart] = useState(analysisDate);
  const [distEnd, setDistEnd] = useState(analysisDate);
  const [profileFilter, setProfileFilter] = useState("all");

  const qs = "?window_days=" + windowDays + (analysisDate ? "&analysis_date=" + analysisDate : "") + "&flow_mode=" + flowMode + (selectedCodes.length > 0 ? "&broker_codes=" + selectedCodes.join(",") : "");
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/broker-flow/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!data) return;
    if (maxBrokers === 0) {
      setSelectedCodes(data.ranked_codes || []);
    } else if (selectedCodes.length === 0) {
      setSelectedCodes((data.default_codes || []).slice(0, maxBrokers));
    } else if (selectedCodes.length > maxBrokers && maxBrokers > 0) {
      setSelectedCodes(selectedCodes.slice(0, maxBrokers));
    }
  }, [data?.ranked_codes?.join(","), maxBrokers]);

  useEffect(() => {
    if (analysisDate) {
      setDistDate(analysisDate);
      setDistStart(analysisDate);
      setDistEnd(analysisDate);
    }
  }, [analysisDate]);

  const activeCodes = selectedCodes;
  const maxSel = maxBrokers === 0 ? 999 : maxBrokers;

  const toggleCode = (code: string) => {
    if (activeCodes.includes(code)) {
      setSelectedCodes(activeCodes.filter((c) => c !== code));
    } else {
      if (activeCodes.length >= maxSel) return;
      setSelectedCodes([...activeCodes, code]);
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
    <div className="space-y-4">
      {/* ====== BROKER DRILL-DOWN CONTROLS ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
          <Icon icon="ph:funnel-duotone" className="text-neutral-400" width="18" />
          <h3 className="text-sm font-semibold text-neutral-200">Broker Flow Drill-Down</h3>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer select-none">
            <input type="checkbox" checked={compareMode} onChange={(e) => { setCompareMode(e.target.checked); if (!e.target.checked) setSelectedCodes([]); }} className="rounded bg-[#08090C] border-white/[0.07] accent-blue-500 w-4 h-4" />
            Enable comparison
          </label>
          <div className="w-px h-5 bg-white/[0.05] mx-1"></div>
          <select className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-blue-500/50" value={maxBrokers} onChange={(e) => { const v = Number(e.target.value); setMaxBrokers(v); setSelectedCodes((prev) => prev.slice(0, v === 0 ? 999 : v)); }}>
            <option value={3}>Limit: 3 brokers</option>
            <option value={5}>Limit: 5 brokers</option>
            <option value={8}>Limit: 8 brokers</option>
            <option value={12}>Limit: 12 brokers</option>
            <option value={0}>No limit</option>
          </select>
          <select className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-blue-500/50" value={flowMode} onChange={(e) => setFlowMode(e.target.value)}>
            <option value="Cumulative">Mode: Cumulative</option>
            <option value="Daily">Mode: Daily</option>
          </select>
          <button onClick={() => { const lim = maxSel; setSelectedCodes((data?.ranked_codes || []).slice(0, lim)); }} className="flex items-center gap-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-300 active:scale-[0.98] transition-all">
            <Icon icon="ph:arrow-counter-clockwise-bold" /> Reset top {maxBrokers === 0 ? "all" : maxBrokers}
          </button>
        </div>
        
        {compareMode && (
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-col md:flex-row md:items-center gap-3">
            <select 
              className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 md:w-48 font-mono"
              onChange={(e) => {
                if (e.target.value && !activeCodes.includes(e.target.value)) {
                  if (activeCodes.length < maxSel) setSelectedCodes([...activeCodes, e.target.value]);
                }
                e.target.value = ""; 
              }}
            >
              <option value="">+ Add Broker...</option>
              {(data?.ranked_codes || []).filter((c: string) => !activeCodes.includes(c)).map((code: string) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            
            <div className="flex flex-wrap gap-2">
              {activeCodes.map((code: string) => (
                <div key={code} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-mono font-semibold">
                  {code}
                  <button onClick={() => toggleCode(code)} className="hover:text-rose-400 transition-colors p-0.5 rounded-md hover:bg-blue-500/20"><Icon icon="ph:x-bold" /></button>
                </div>
              ))}
              {activeCodes.length === 0 && <span className="text-xs text-neutral-500 italic py-1.5">No brokers selected.</span>}
            </div>
          </div>
        )}
      </div>

      {/* ====== BROKER FLOW COMPARISON CHART ====== */}
      {compareMode && activeCodes.length > 0 && (
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
            <div className="flex items-center gap-2">
                <Icon icon="ph:chart-line-up-duotone" className="text-blue-500" width="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Comparison: {flowMode} Window</h3>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#e5e5e5", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }} formatter={(value: any, name: string) => ["Rp " + Number(value).toFixed(2) + " B", name]} />
                <ReferenceLine y={0} stroke="#525252" strokeWidth={1} />
                {activeCodes.map((code: string, i: number) => (
                  <Line key={code} type="monotone" dataKey={code} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#08090C", strokeWidth: 2 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* ====== BROKER DISTRIBUTION (Estimated Matching) ====== */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/[0.05] pb-3">
                <div className="flex items-center gap-2">
                    <Icon icon="ph:arrows-left-right-duotone" className="text-neutral-400" width="18" />
                    <h3 className="text-sm font-semibold text-neutral-200">Volume Distribution</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select className="bg-[#08090C] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-xs text-neutral-200 outline-none" value={distMode} onChange={(e) => setDistMode(e.target.value)}>
                        <option value="Single day">Single day</option>
                        <option value="Date range">Range</option>
                    </select>
                    {distMode === "Single day" ? (
                        <input type="date" className="bg-[#08090C] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-xs text-neutral-200 outline-none font-mono" value={distDate} onChange={(e) => setDistDate(e.target.value)} />
                    ) : (
                        <div className="flex items-center gap-2">
                        <input type="date" className="bg-[#08090C] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-xs text-neutral-200 outline-none font-mono" value={distStart} onChange={(e) => setDistStart(e.target.value)} />
                        <span className="text-neutral-500 text-xs">to</span>
                        <input type="date" className="bg-[#08090C] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-xs text-neutral-200 outline-none font-mono" value={distEnd} onChange={(e) => setDistEnd(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                {/* Buyers */}
                <div>
                <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-3 pb-1 border-b border-emerald-500/20">Top Buyers</div>
                <div className="space-y-3">
                    {dist.buyers.map((b: any, i: number) => (
                    <div key={i}>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-neutral-200">{b.broker}</span>
                                <span className={`px-1.5 py-[1px] text-[8px] rounded border font-semibold tracking-wide ${getTypeChip(b.type)}`}>{b.type}</span>
                            </div>
                            <span className="font-mono text-emerald-400">{fmtRp(b.net_value)}</span>
                        </div>
                        <div className="h-1 bg-[#08090C] rounded-full overflow-hidden border border-white/[0.02]">
                        <div className="h-full bg-emerald-500/80 rounded-full" style={{ width: Math.min(100, (b.net_value / (dist.buyers[0]?.net_value || 1)) * 100) + "%" }} />
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                {/* Sellers */}
                <div>
                <div className="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest mb-3 pb-1 border-b border-rose-500/20">Top Sellers</div>
                <div className="space-y-3">
                    {dist.sellers.map((s: any, i: number) => (
                    <div key={i}>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-neutral-200">{s.broker}</span>
                                <span className={`px-1.5 py-[1px] text-[8px] rounded border font-semibold tracking-wide ${getTypeChip(s.type)}`}>{s.type}</span>
                            </div>
                            <span className="font-mono text-rose-400">{fmtRp(s.net_value)}</span>
                        </div>
                        <div className="h-1 bg-[#08090C] rounded-full overflow-hidden border border-white/[0.02]">
                        <div className="h-full bg-rose-500/80 rounded-full" style={{ width: Math.min(100, (Math.abs(s.net_value) / (Math.abs(dist.sellers[0]?.net_value) || 1)) * 100) + "%" }} />
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            {/* Estimated Matching */}
            {dist.edges.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Icon icon="ph:shuffle-angular-duotone" /> Estimated Counterparties
                </div>
                <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 space-y-2 pr-2">
                {dist.edges.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-[#08090C] border border-white/[0.05] rounded-md px-3 py-1.5">
                    <span className="text-emerald-400 font-mono font-semibold">{e.buyer_code}</span>
                    <Icon icon="ph:arrow-right" className="text-neutral-600" />
                    <span className="text-rose-400 font-mono font-semibold">{e.seller_code}</span>
                    <span className="text-neutral-300 font-mono tabular-nums">{fmtRp(e.matched_value)}</span>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>

        {/* ====== BROKER PROFILE FLOW ====== */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                <Icon icon="ph:faders-duotone" className="text-neutral-400" width="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Profile Architecture</h3>
            </div>
            {profileFlow.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">No profile flow detected.</p>
            ) : (
            <div className="space-y-4">
                {profileFlow.map((row: any, i: number) => {
                   const maxAbs = Math.max(...profileFlow.map((r: any) => Math.abs(r.net)), 1);
                   const width = Math.max(3, (Math.abs(row.net) / maxAbs) * 100);
                   return (
                    <div key={i}>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <div>
                                <span className="text-neutral-200 font-semibold">{row.label}</span>
                            </div>
                            <span className="font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</span>
                        </div>
                        <div className="h-1.5 bg-[#08090C] rounded-sm overflow-hidden border border-white/[0.02] mb-2">
                        <div className="h-full rounded-sm" style={{ width: width + "%", backgroundColor: signedColor(row.net) }} />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                        {(row.top_brokers || []).map((b: any, j: number) => (
                            <span key={j} className="inline-flex items-center gap-1 text-[10px] bg-[#08090C] border border-white/[0.07] rounded-md px-1.5 py-1">
                                <span className="font-mono font-semibold text-neutral-300">{b.broker_code}</span>
                                <span className="font-mono" style={{ color: signedColor(b.net) }}>{fmtRp(b.net)}</span>
                            </span>
                        ))}
                        </div>
                    </div>
                   );
                })}
            </div>
            )}
        </div>
      </div>

      {/* ====== DATA MATRICES ====== */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Profile Detail Matrix */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/[0.05] pb-3">
                <div className="flex items-center gap-2">
                    <Icon icon="ph:table-duotone" className="text-neutral-400" width="18" />
                    <h3 className="text-sm font-semibold text-neutral-200">Profile Data Matrix</h3>
                </div>
                <select className="bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-blue-500/50" value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
                    {PROFILE_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Profile</th>
                        <th className="py-2.5 px-3 font-medium">Broker</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell</th>
                        <th className="py-2.5 px-3 text-right font-medium">Net (Rp)</th>
                        <th className="py-2.5 px-3 text-right font-medium">Freq</th>
                        <th className="py-2.5 px-3 text-right font-medium rounded-tr-md">Avg/Tx</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                    {filteredProfileDetail.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-neutral-300 font-semibold">{row.profile}</td>
                        <td className="py-2.5 px-3 text-neutral-100 font-mono font-bold">{row.broker}</td>
                        <td className="py-2.5 px-3"><span className={`px-2 py-0.5 text-[9px] rounded border font-semibold tracking-wide ${getTypeChip(row.type)}`}>{row.type}</span></td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400/80">{fmtRp(row.buy)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400/80">{fmtRp(row.sell)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.freq.toLocaleString("id-ID")}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-500">{fmtRp(row.avg_value_tx)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {filteredProfileDetail.length === 0 && <div className="text-center text-xs text-neutral-500 py-6">No data for selected profile.</div>}
            </div>
        </div>

        {/* Detailed Broker Rows */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                <Icon icon="ph:list-numbers-duotone" className="text-neutral-400" width="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Raw Broker Volumes</h3>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Broker</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 text-right font-medium">Buy</th>
                        <th className="py-2.5 px-3 text-right font-medium">Sell</th>
                        <th className="py-2.5 px-3 text-right font-medium">Net (Rp)</th>
                        <th className="py-2.5 px-3 text-right font-medium rounded-tr-md">Freq</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                    {detailRows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-neutral-100 font-mono font-bold">{row.broker}</td>
                        <td className="py-2.5 px-3"><span className={`px-2 py-0.5 text-[9px] rounded border font-semibold tracking-wide ${getTypeChip(row.type)}`}>{row.type}</span></td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400/80">{fmtRp(row.buy)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400/80">{fmtRp(row.sell)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.freq.toLocaleString("id-ID")}</td>
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
