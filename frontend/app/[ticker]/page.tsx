"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
  BarChart,
  Bar,
  ComposedChart,
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

function fmtPct(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
}

function signedColor(n: number): string {
  return n >= 0 ? "#10b981" : "#f43f5e";
}

function signalColor(score: number | null): string {
  if (score === null || score === undefined) return "#94a3b8";
  if (score >= 2) return "#10b981";
  if (score === 1) return "#65a30d";
  if (score === 0) return "#94a3b8";
  if (score === -1) return "#ea580c";
  return "#f43f5e";
}

function getTypeChip(type: string) {
  const t = type?.toUpperCase() || "";
  if (t === "FOREIGN" || t === "ASING") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (t === "LOCAL" || t === "LOKAL") return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  if (t === "GOV" || t === "PEMERINTAH") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  return "text-neutral-400 bg-neutral-800 border-neutral-700";
}

import BrokerFlowTab from "@/components/analysis/BrokerFlowTab";
import CausalityTab from "@/components/analysis/CausalityTab";
import ValidationTab from "@/components/analysis/ValidationTab";
import ScreenerTab from "@/components/analysis/ScreenerTab";
import RawTablesTab from "@/components/analysis/RawTablesTab";

const TABS = ["Overview", "Broker Flow", "Causality", "Validation", "Screener", "Raw Tables"];
const UNIVERSES = [
  "watchlist", "idx80", "lq45", "idx_high_dividend", "idx_bumn", 
  "idx_smc", "esg_kehati", "idxenergy", "idxtrans", "idxinfra", 
  "idxtechno", "idxpropert", "idxfinance", "idxhealth", "idxcyclic", 
  "idxnoncyc", "idxindust", "idxbasic", "bisnis-27"
];
const WINDOWS = [20, 30, 60, 90, 180];
const HORIZONS = [1, 3, 5, 10];

/* ==================== Page ==================== */
export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = String(params.ticker || "").toUpperCase();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  /* Sidebar controls state */
  const [universe, setUniverse] = useState("watchlist");
  const [searchTerm, setSearchTerm] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [windowDays, setWindowDays] = useState(20);
  const [horizon, setHorizon] = useState(10);
  const [minEvents, setMinEvents] = useState(5);
  const [minNetBuy, setMinNetBuy] = useState(0);

  /* Fetch universe tickers */
  const { data: universeData } = useSWR("/api/bandar/universe/" + universe, fetcher, { revalidateOnFocus: false });
  const { data: allUniverseData } = useSWR("/api/bandar/universe/all", fetcher, { revalidateOnFocus: false });
  
  const tickers = universeData?.tickers || [];
  const allTickers = allUniverseData?.tickers || [];

  const filteredTickers = useMemo(() => {
    const term = searchTerm.toUpperCase();
    return term ? allTickers.filter((t: string) => t.includes(term)).slice(0, 10) : tickers.slice(0, 10);
  }, [tickers, allTickers, searchTerm]);

  /* Fetch dates for selected ticker */
  const { data: datesData } = useSWR(ticker ? "/api/bandar/dates/" + ticker : null, fetcher, { revalidateOnFocus: false });
  const availableDates = datesData?.dates || [];

  /* Fetch detail */
  const qs = "?window_days=" + windowDays + (analysisDate ? "&analysis_date=" + analysisDate : "");
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/detail/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  /* Auto-select latest date */
  useEffect(() => {
    if (availableDates.length > 0 && !analysisDate) {
      setAnalysisDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, analysisDate]);

  /* Navigate */
  const goToTicker = (t: string) => {
    if (t && t !== ticker) {
      router.push("/" + t);
      setSidebarOpen(false);
    }
  };

  if (!ticker) {
    return <div className="min-h-[100dvh] bg-[#08090C] text-neutral-100 flex items-center justify-center font-mono">NO_TICKER_PROVIDED</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-[#08090C] text-neutral-200 flex selection:bg-blue-500/30">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Vanguard Terminal Style */}
      <aside className={
        "fixed lg:sticky top-0 z-50 h-screen w-72 bg-[#0F1117] border-r border-white/[0.07] overflow-y-auto " +
        "transition-transform duration-300 ease-in-out scrollbar-thin scrollbar-thumb-neutral-800 " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="p-5 space-y-6">
          
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="ph:terminal-window-duotone" className="text-blue-500" width="22" />
            <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Terminal Controls</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Universe List</label>
              <select
                className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 transition-colors cursor-pointer appearance-none"
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
              >
                {UNIVERSES.map((u) => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
              <div className="text-[10px] text-neutral-500 mt-1.5 flex items-center gap-1">
                <Icon icon="ph:database-duotone" /> {universeData?.count || 0} active assets
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Asset Search</label>
              <div className="relative">
                <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" width="14" />
                <input
                  type="text"
                  className="w-full bg-[#08090C] border border-white/[0.07] rounded-md pl-8 pr-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 transition-colors uppercase placeholder:normal-case placeholder:text-neutral-600"
                  placeholder="Ticker code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Dynamic Search Dropdown */}
              <div className="mt-2 flex flex-col gap-1">
                {searchTerm && filteredTickers.map((t: string) => (
                  <button key={t} onClick={() => { goToTicker(t); setSearchTerm(""); }} className="text-left px-3 py-1.5 rounded-md text-sm text-neutral-300 bg-[#08090C] border border-transparent hover:border-white/[0.07] transition-all">
                    <Icon icon="ph:arrow-right" className="inline mr-2 opacity-50" width="12"/>{t}
                  </button>
                ))}
                {!searchTerm && tickers.length > 0 && tickers.slice(0, 15).map((t: string) => (
                  <button key={t} onClick={() => goToTicker(t)} className={`text-left px-3 py-1.5 rounded-md text-xs transition-all ${t === ticker ? "bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20" : "text-neutral-400 hover:bg-[#08090C] hover:text-neutral-200"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.05] my-2"></div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Analysis Date</label>
              <select
                className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 font-mono"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
              >
                {availableDates.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Lookback</label>
                <select
                    className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50"
                    value={windowDays}
                    onChange={(e) => setWindowDays(Number(e.target.value))}
                >
                    {WINDOWS.map((w) => <option key={w} value={w}>{w}D</option>)}
                </select>
                </div>
                <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Horizon</label>
                <select
                    className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50"
                    value={horizon}
                    onChange={(e) => setHorizon(Number(e.target.value))}
                >
                    {HORIZONS.map((h) => <option key={h} value={h}>{h}D</option>)}
                </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2" title="Min Broker Events">Events</label>
                    <input
                        type="number" min={3} max={30}
                        className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 font-mono"
                        value={minEvents}
                        onChange={(e) => setMinEvents(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2" title="Min Net Buy (Rp B)">Net (B)</label>
                    <input
                        type="number" min={0} step={0.5}
                        className="w-full bg-[#08090C] border border-white/[0.07] rounded-md px-3 py-2 text-sm text-neutral-200 outline-none focus:border-blue-500/50 font-mono"
                        value={minNetBuy}
                        onChange={(e) => setMinNetBuy(Number(e.target.value))}
                    />
                </div>
            </div>
          </div>

          <div className="w-full h-px bg-white/[0.05] my-4"></div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-center gap-2 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md px-3 py-2.5 text-xs font-semibold text-neutral-300 transition-all active:scale-[0.98]">
              <Icon icon="ph:play-duotone" /> Run pipeline
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md px-3 py-2.5 text-xs font-semibold text-neutral-300 transition-all active:scale-[0.98]">
              <Icon icon="ph:cloud-arrow-down-duotone" /> Backfill history
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Navbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0F1117] border-b border-white/[0.07]">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md bg-[#08090C] border border-white/[0.07] text-neutral-300 active:scale-95">
            <Icon icon="ph:list" width="20" />
          </button>
          <span className="font-bold text-white tracking-tight">{ticker} Terminal</span>
        </div>

        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Icon icon="ph:cpu-duotone" className="text-blue-500" width="20" />
                 <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest">Asset Analysis</span>
              </div>
              <h1 className="text-3xl font-semibold text-white tracking-tight leading-none">{ticker}</h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1117] border border-white/[0.07] rounded-md text-xs text-neutral-400">
                <Icon icon="ph:calendar-blank-duotone" /> {data?.analysis_date || "..."}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1117] border border-white/[0.07] rounded-md text-xs text-neutral-400">
                <Icon icon="ph:clock-counter-clockwise-duotone" /> {windowDays}D Lookback
              </div>
            </div>
          </div>

          {/* Loading / Error Skeleton */}
          {isLoading && (
              <div className="w-full p-8 border border-white/[0.07] bg-[#0F1117] rounded-xl flex items-center justify-center gap-3 text-neutral-400 mb-6 shadow-sm">
                  <Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> 
                  <span className="text-sm font-medium">Extracting terminal data...</span>
              </div>
          )}
          {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl mb-6">Error establishing connection to quant engine.</div>}

          {/* Top Metrics */}
          {data && !data.error && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
              <MetricCard icon="ph:scales-duotone" label="Conviction" value={`${data.conviction_score?.toFixed(1)}/100`} note="Weighted model" tone={data.conviction_score} />
              <MetricCard icon="ph:broadcast-duotone" label="Net Signal" value={data.signal} note="Analysis date" tone={null} accent={signalColor(data.signal_score)} />
              <MetricCard icon="ph:chart-line-up-duotone" label="5D Return" value={fmtPct(data.ret_5d)} note="Price context" tone={data.ret_5d} />
              <MetricCard icon="ph:globe-hemisphere-east-duotone" label="Foreign 5D" value={fmtRp(data.foreign_5d)} note="Aggregated flow" tone={data.foreign_5d} />
              <MetricCard icon="ph:crown-duotone" label="Top Buyer" value={data.top_buyer?.broker || "-"} note={fmtRp(data.top_buyer?.net)} tone={1} />
              <MetricCard icon="ph:brain-duotone" label="Smart Cum." value={fmtRp(data.smart_cumulative)} note={`${data.smart_daily?.length || 0} trading days`} tone={data.smart_cumulative} />
            </div>
          )}

          {/* Contextual Alerts */}
          {data?.alerts?.length > 0 && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                  <Icon icon="ph:warning-circle-duotone" width="18" /> Contradiction Alerts
              </div>
              <ul className="space-y-1.5 pl-6 list-disc marker:text-amber-500/50">
                {data.alerts.map((a: string, i: number) => (
                  <li key={i} className="text-xs text-amber-200/80 leading-relaxed">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* System Verdict */}
          {data?.verdict && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold text-sm">
                  <Icon icon="ph:robot-duotone" width="18" /> System Verdict
              </div>
              <div className="text-sm text-blue-100/90 leading-relaxed max-w-4xl">{data.verdict}</div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-white/[0.07] mb-6 scrollbar-none">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab
                      ? "text-neutral-100 border-blue-500"
                      : "text-neutral-500 border-transparent hover:text-neutral-300 hover:border-white/[0.15]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Router */}
          <div className="min-h-[500px]">
            {activeTab === "Overview" && <OverviewTab data={data} isLoading={isLoading} />}
            {activeTab === "Broker Flow" && <BrokerFlowTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} />}
            {activeTab === "Causality" && <CausalityTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} detailData={data} />}
            {activeTab === "Validation" && <ValidationTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} universeMode={universe} horizon={horizon} minEvents={minEvents} />}
            {activeTab === "Screener" && <ScreenerTab universeMode={universe} analysisDate={analysisDate} windowDays={windowDays} />}
            {activeTab === "Raw Tables" && <RawTablesTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} />}
          </div>
          
        </div>
      </main>
    </div>
  );
}

/* ==================== MetricCard (Vanguard Style) ==================== */
function MetricCard({ icon, label, value, note, tone, accent }: { icon: string; label: string; value: string; note: string; tone: number | null; accent?: string }) {
  let color = "#94a3b8"; // neutral-400
  if (accent) color = accent;
  else if (tone !== null && tone !== undefined) color = signedColor(Number(tone));
  
  return (
    <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-white/[0.15] transition-colors">
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: color, opacity: 0.8 }}></div>
      <div className="flex items-center gap-1.5 mb-3" style={{ color }}>
          <Icon icon={icon} width="16" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <div>
        <div className="text-xl font-semibold tracking-tight tabular-nums text-white truncate" title={value}>{value}</div>
        <div className="text-[11px] text-neutral-500 mt-1 truncate">{note}</div>
      </div>
    </div>
  );
}

/* ==================== OverviewTab ==================== */
function OverviewTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading || !data) return null;
  if (data.error) return <div className="text-rose-400 text-sm">{data.error}</div>;

  const chartData = (data.price_chart || []).map((p: any) => {
    const sig = (data.signal_overlay || []).find((s: any) => s.date === p.date);
    return { ...p, signal: sig?.signal || null, signalScore: sig?.score ?? null };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-4">
        
        {/* CHART WIDGET */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
            <Icon icon="ph:chart-candlestick-duotone" className="text-neutral-400" width="18" />
            <h3 className="text-sm font-semibold text-neutral-200">Price, Volume & Signals</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" domain={["auto", "auto"]} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#e5e5e5", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#e5e5e5" }}
                  labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }}
                />
                <Bar yAxisId="right" dataKey="volume" fill="#ffffff" fillOpacity={0.05} />
                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3b82f6", stroke: "#08090C", strokeWidth: 2 }} />
                {chartData.filter((d: any) => d.signalScore !== null).map((d: any, i: number) => (
                  <ReferenceLine key={i} x={d.date} stroke={signalColor(d.signalScore)} strokeDasharray="4 4" yAxisId="left" opacity={0.6} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-4">
          
          {/* TOP BROKERS GRID */}
          <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                <Icon icon="ph:users-three-duotone" className="text-neutral-400" width="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Terminal Top Brokers</h3>
            </div>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/[0.05]">
                    <th className="py-2 font-medium">Side</th>
                    <th className="py-2 font-medium">Broker</th>
                    <th className="py-2 font-medium">Profile</th>
                    <th className="py-2 text-right font-medium">Net (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {(data.broker_summary || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-medium" style={{ color: row.side === "Buy" ? "#10b981" : "#f43f5e" }}>{row.side}</td>
                      <td className="py-2.5 font-mono font-bold text-neutral-200">{row.broker}</td>
                      <td className="py-2.5">
                         <span className={`px-2 py-0.5 text-[10px] rounded border font-semibold tracking-wide ${getTypeChip(row.type)}`}>{row.type}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRICE PERFORMANCE */}
          <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
                <Icon icon="ph:chart-polar-duotone" className="text-neutral-400" width="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Price Performance</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {(data.price_performance || []).map((row: any, i: number) => (
                <div key={i} className="bg-[#08090C] border border-white/[0.05] rounded-lg p-2.5 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">{row.period}</span>
                    <span className="font-mono text-sm" style={{ color: signedColor(row.value) }}>{fmtPct(row.value)}</span>
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
        
        {/* SMART MONEY FLOW */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
            <Icon icon="ph:brain-duotone" className="text-neutral-400" width="18" />
            <h3 className="text-sm font-semibold text-neutral-200">Smart-Money Daily Flow</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.smart_daily || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#737373" }} stroke="#333" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#e5e5e5" }}
                  formatter={(value: any, name: string) => [fmtRp(Number(value)), name]}
                  labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }}
                />
                <Bar yAxisId="left" dataKey="smart_net" shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.smart_net >= 0 ? "#10b981" : "#f43f5e";
                    return <rect x={x} y={y} width={width} height={height} fill={color} opacity={0.8} rx={2} />;
                  }}
                />
                <Line yAxisId="right" type="monotone" dataKey="cumulative_net" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <ReferenceLine yAxisId="left" y={0} stroke="#525252" strokeWidth={1} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROFILE NET FLOW PROGRESS BARS */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3 flex-shrink-0">
            <Icon icon="ph:faders-duotone" className="text-neutral-400" width="18" />
            <h3 className="text-sm font-semibold text-neutral-200">Profile Net Flow</h3>
          </div>
          
          <div className="flex-grow flex flex-col justify-center space-y-4">
          {(data.profile_flow || []).length === 0 ? (
            <p className="text-xs text-neutral-500 text-center">No profile flow detected.</p>
          ) : (
             (data.profile_flow || []).map((row: any, i: number) => {
                const maxAbs = Math.max(...(data.profile_flow || []).map((r: any) => Math.abs(r.net)), 1);
                const width = Math.max(3, (Math.abs(row.net) / maxAbs) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-neutral-300 font-medium">{row.label}</span>
                      <span className="font-mono font-semibold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</span>
                    </div>
                    <div className="h-1.5 bg-[#08090C] rounded-sm overflow-hidden border border-white/[0.02]">
                      <div className="h-full rounded-sm" style={{ width: width + "%", backgroundColor: signedColor(row.net) }} />
                    </div>
                  </div>
                );
             })
          )}
          </div>
        </div>
      </div>
      
      {/* DETAILED BROKER TERMINAL GRID */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3">
          <Icon icon="ph:table-duotone" className="text-neutral-400" width="18" />
          <h3 className="text-sm font-semibold text-neutral-200">Entity Breakdown Data Matrix</h3>
        </div>
        
        {(data.profile_broker_detail || []).length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs">No broker data matrix available for this window.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
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
                {(data.profile_broker_detail || []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-neutral-300 font-semibold">{row.profile}</td>
                    <td className="py-2.5 px-3 text-neutral-100 font-mono font-bold">{row.broker}</td>
                    <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[9px] rounded border font-semibold tracking-wide ${getTypeChip(row.type)}`}>{row.type}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400/80">{fmtRp(row.buy)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400/80">{fmtRp(row.sell)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-400">{row.freq.toLocaleString("id-ID")}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-500">{fmtRp(row.avg_value_tx)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
