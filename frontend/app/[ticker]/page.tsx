"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Icon } from "@iconify/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  ReferenceLine,
} from "recharts";

import BrokerFlowTab from "@/components/analysis/BrokerFlowTab";
import CausalityTab from "@/components/analysis/CausalityTab";
import ValidationTab from "@/components/analysis/ValidationTab";
import ScreenerTab from "@/components/analysis/ScreenerTab";
import RawTablesTab from "@/components/analysis/RawTablesTab";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ==================== FORMATTERS ==================== */
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

// Hanya digunakan untuk memberi warna teks pada nama profil
export function getProfileTextColor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("foreign smart")) return "#10b981"; // 🟢 Emerald
  if (l.includes("local inst")) return "#3b82f6"; // 🔵 Blue
  if (l.includes("market maker")) return "#a855f7"; // 🟣 Purple
  if (l.includes("speculative")) return "#f59e0b"; // 🟠 Amber
  return "#94a3b8"; // ⚪ Retail / Other
}

const TABS = ["Overview", "Broker Flow", "Causality", "Validation", "Screener", "Raw Tables"];
const UNIVERSES = [
  "watchlist", "idx80", "lq45", "idx_high_dividend", "idx_bumn", 
  "idx_smc", "esg_kehati", "idxenergy", "idxtrans", "idxinfra", 
  "idxtechno", "idxpropert", "idxfinance", "idxhealth", "idxcyclic", 
  "idxnoncyc", "idxindust", "idxbasic", "bisnis-27"
];
const WINDOWS = [20, 30, 60, 90, 180];
const HORIZONS = [1, 3, 5, 10];

/* ==================== MAIN PAGE COMPONENT ==================== */
export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const ticker = String(params.ticker || "").toUpperCase();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  /* Sidebar Controls */
  const [universe, setUniverse] = useState("watchlist");
  const [searchTerm, setSearchTerm] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [windowDays, setWindowDays] = useState(20);
  const [horizon, setHorizon] = useState(10);
  const [minEvents, setMinEvents] = useState(5);
  const [minNetBuy, setMinNetBuy] = useState(0);

  /* Watchlist Sync */
  const [localWatchlist, setLocalWatchlist] = useState<string[]>([]);
  useEffect(() => {
    try {
      const ls = localStorage.getItem("tradepulse_watchlist");
      if (ls) setLocalWatchlist(JSON.parse(ls));
    } catch (e) {}
  }, []);

  /* Backfill manual range state */
  const [backfillStart, setBackfillStart] = useState("");
  const [backfillEnd, setBackfillEnd] = useState("");
  const [pipelineRunning, setPipelineRunning] = useState<string | null>(null);
  const [isRefreshingMaster, setIsRefreshingMaster] = useState(false);

  /* SWR Data Fetching */
  const { data: universeData } = useSWR("/api/bandar/universe/" + universe, fetcher);
  const { data: allUniverseData, isLoading: isLoadingUniverse } = useSWR("/api/bandar/universe/all", fetcher);
  const { data: statusData, mutate: mutateStatus } = useSWR("/api/bandar/system-status", fetcher);
  const { data: datesData } = useSWR(ticker ? "/api/bandar/dates/" + ticker : null, fetcher);

  /* Dynamically use LocalStorage watchlist if universe === "watchlist" */
  const tickers = universe === "watchlist" && localWatchlist.length > 0
    ? localWatchlist
    : (universeData?.tickers || []);
    
  const allTickers = allUniverseData?.tickers || [];
  const availableDates: string[] = datesData?.dates || [];

  /* Initialize analysisDate & backfill date */
  useEffect(() => {
    if (availableDates.length > 0 && !analysisDate) {
      const latest = availableDates[availableDates.length - 1];
      setAnalysisDate(latest);
      setBackfillEnd(latest);
      
      const d = new Date(latest);
      d.setDate(d.getDate() - 90);
      setBackfillStart(d.toISOString().split("T")[0]);
    }
  }, [availableDates, analysisDate]);

  const filteredTickers = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return tickers.slice(0, 10);
    return allTickers.filter((t: string) => t.includes(term)).slice(0, 10);
  }, [tickers, allTickers, searchTerm]);

  /* Detail Data Fetch */
  const qs = "?window_days=" + windowDays + (analysisDate ? "&analysis_date=" + analysisDate : "");
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/detail/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const goToTicker = (t: string) => {
    if (t && t !== ticker) {
      router.push("/" + t);
      setSidebarOpen(false);
    }
  };

  const handleCalendarChange = (selected: string) => {
    if (!selected || availableDates.length === 0) return;
    if (availableDates.includes(selected)) {
      setAnalysisDate(selected);
      return;
    }
    const priorDates = availableDates.filter((d) => d <= selected);
    if (priorDates.length > 0) {
      setAnalysisDate(priorDates[priorDates.length - 1]);
    } else {
      setAnalysisDate(availableDates[0]);
    }
  };

  const handleRefreshMaster = async () => {
    if (isRefreshingMaster) return;
    setIsRefreshingMaster(true);
    try {
      const res = await fetch("/api/bandar/universe/refresh", { method: "POST" });
      const json = await res.json();
      if (json.status === "success") {
        await mutate("/api/bandar/universe/all");
        await mutateStatus();
        alert(`Sukses: ${json.message}`);
      } else {
        alert(`Gagal: ${json.error || "Gagal refresh master tickers"}`);
      }
    } catch (e: any) {
      alert(`Error koneksi: ${e.message}`);
    } finally {
      setIsRefreshingMaster(false);
    }
  };

  const runPipeline = async (type: "today" | "missing" | "backfill") => {
    setPipelineRunning(type);
    try {
      const payload: any = { universe_mode: universe };
      // Kalau pakai custom local watchlist, timpa dengan array eksplisit
      if (universe === "watchlist" && localWatchlist.length > 0) {
          payload.tickers = localWatchlist;
      }

      let res;
      if (type === "today") {
        res = await fetch("/api/bandar/pipeline/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (type === "missing") {
        payload.start_date = analysisDate || statusData?.latest_date;
        payload.end_date = new Date().toISOString().split("T")[0];
        res = await fetch("/api/bandar/pipeline/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        payload.start_date = backfillStart;
        payload.end_date = backfillEnd;
        res = await fetch("/api/bandar/pipeline/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (res.ok) {
        alert("Pipeline selesai dijalankan.");
        mutate(() => true, undefined, { revalidate: true });
      } else {
        alert("Pipeline error: " + (json.detail || "Gagal"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setPipelineRunning(null);
    }
  };

  if (!ticker) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">No ticker</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Controls */}
      <aside className={
        "fixed lg:sticky top-0 z-50 h-screen w-72 bg-neutral-900 border-r border-neutral-800 overflow-y-auto " +
        "transition-transform duration-300 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">IDX Smart Flow</div>
              <h2 className="text-sm font-bold text-white">Controls</h2>
            </div>
            <button 
              onClick={handleRefreshMaster} 
              disabled={isRefreshingMaster}
              title="Sinkronisasi Master Tickers dari IDX.co.id"
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 hover:text-orange-400 transition-colors"
            >
              <Icon icon="ph:arrows-clockwise-duotone" width="16" className={isRefreshingMaster ? "animate-spin text-orange-400" : ""} />
            </button>
          </div>

          {/* Universe & Live DB Stats */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Universe Filter</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-orange-500/50"
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
            >
              {UNIVERSES.map((u) => (
                <option key={u} value={u}>{u.toUpperCase()}</option>
              ))}
            </select>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex flex-col gap-0.5 bg-neutral-950/40 p-2 rounded border border-neutral-800/80">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <b>{statusData?.active_tickers ?? "..."}</b> emiten aktif di database
              </span>
              <span className="text-neutral-500 font-mono text-[9px]">
                Data BEI terupdate: <b className="text-neutral-300">{statusData?.latest_date ?? "-"}</b>
              </span>
            </div>
          </div>

          {/* Analysis Date (Calendar Mode) */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Analysis Date</label>
            <input
              type="date"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-orange-500/50 [color-scheme:dark]"
              value={analysisDate}
              max={availableDates[availableDates.length - 1] || statusData?.latest_date || ""}
              onChange={(e) => handleCalendarChange(e.target.value)}
            />
            <div className="text-[9px] text-neutral-500 mt-1">
              Data aktif: <span className="text-neutral-300 font-mono">{analysisDate || "Memuat..."}</span>
            </div>
          </div>

          {/* Broker Window */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Broker Window</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
            >
              {WINDOWS.map((w) => (
                <option key={w} value={w}>{w} calendar days</option>
              ))}
            </select>
          </div>

          {/* Validation Horizon */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Validation Horizon</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              {HORIZONS.map((h) => (
                <option key={h} value={h}>{h} trading days</option>
              ))}
            </select>
          </div>

          {/* Filter Ambang Batas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Min Events</label>
              <input
                type="number"
                min={3}
                max={30}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none"
                value={minEvents}
                onChange={(e) => setMinEvents(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Min Buy Rp B</label>
              <input
                type="number"
                min={0}
                step={0.5}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none"
                value={minNetBuy}
                onChange={(e) => setMinNetBuy(Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Action Pipeline Buttons */}
          <div className="space-y-2">
            <button 
              onClick={() => runPipeline("today")}
              disabled={pipelineRunning !== null}
              className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors disabled:opacity-50 text-left flex items-center justify-between"
            >
              <span>Run latest pipeline</span>
              {pipelineRunning === "today" && <Icon icon="ph:spinner-gap" className="animate-spin text-orange-400" />}
            </button>

            <button 
              onClick={() => runPipeline("missing")}
              disabled={pipelineRunning !== null}
              className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors disabled:opacity-50 text-left flex items-center justify-between"
            >
              <span>Fetch missing broker dates</span>
              {pipelineRunning === "missing" && <Icon icon="ph:spinner-gap" className="animate-spin text-orange-400" />}
            </button>

            {/* Backfill Range Inputs */}
            <div className="pt-1">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Backfill Custom Range</label>
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <input
                  type="date"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] text-neutral-300 [color-scheme:dark]"
                  value={backfillStart}
                  onChange={(e) => setBackfillStart(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-1.5 py-1 text-[10px] text-neutral-300 [color-scheme:dark]"
                  value={backfillEnd}
                  onChange={(e) => setBackfillEnd(e.target.value)}
                />
              </div>
              <button 
                onClick={() => runPipeline("backfill")}
                disabled={pipelineRunning !== null || !backfillStart || !backfillEnd}
                className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors disabled:opacity-50 text-left flex items-center justify-between"
              >
                <span>Backfill broker history</span>
                {pipelineRunning === "backfill" && <Icon icon="ph:spinner-gap" className="animate-spin text-orange-400" />}
              </button>
            </div>
          </div>

          <div className="text-[9px] text-neutral-600 pt-2 font-mono">
            InvestOwl Platform • Port: 8000
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 min-w-0 pb-20">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
            <Icon icon="ph:list" width="20" />
          </button>
          <span className="font-bold text-white">{ticker}</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">

          {/* SEARCH BAR */}
          <div className="mb-5 relative z-40">
             <div className="flex items-center bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-500/30 hover:border-amber-500/60 focus-within:border-amber-500 rounded-xl px-3.5 py-2.5 shadow-[0_0_12px_rgba(245,158,11,0.08)] focus-within:shadow-[0_0_20px_rgba(245,158,11,0.22)] transition-all">
                <Icon icon="ph:magnifying-glass-duotone" className="text-amber-500/70 mr-2.5" width="18" height="18" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 font-mono uppercase tracking-wider"
                  placeholder="Cari Ticker Saham (Contoh: BBCA)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden shadow-2xl z-50">
                  {isLoadingUniverse && allTickers.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-neutral-500 font-mono">Memuat daftar saham bursa...</div>
                  ) : filteredTickers.length > 0 ? (
                    filteredTickers.map((t: string) => (
                      <button
                        key={t}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-neutral-300 hover:bg-neutral-800 hover:text-orange-400 transition-colors border-b border-neutral-800/40 last:border-0"
                        onClick={() => { goToTicker(t); setSearchTerm(""); }}
                      >
                        <span>{t}</span>
                        <Icon icon="ph:arrow-up-right-bold" className="text-neutral-600" width="12" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-neutral-500 font-mono">Saham tidak ditemukan</div>
                  )}
                </div>
             )}
          </div>
       
          {/* Header */}
          <div className="mb-4 bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">IDX Broker Flow Research</div>
            <h1 className="text-lg sm:text-xl font-bold text-white mb-2">Smart Money Dashboard</h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-full px-2.5 py-1 shadow-sm">
                Window: {data?.window_start || "..."} s/d {data?.analysis_date || "..."}
              </span>
            </div>
          </div>

          {isLoading && <div className="text-neutral-400 text-xs mb-3">Memuat data analisis...</div>}
          {error && <div className="text-red-400 text-xs mb-3">Gagal mengambil data</div>}

          {/* Metric Cards */}
          {data && !data.error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
              <MetricCard label="Conviction Score" value={data.conviction_score?.toFixed(1) + "/100"} note="weighted model" tone={data.conviction_score} />
              <MetricCard label="Signal" value={data.signal} note="selected date" tone={null} accent={signalColor(data.signal_score)} />
              <MetricCard label="5D Return" value={fmtPct(data.ret_5d)} note="price context" tone={data.ret_5d} />
              <MetricCard label="Foreign Net 5D" value={fmtRp(data.foreign_5d)} note="broker summary" tone={data.foreign_5d} />
              <MetricCard label="Top Buyer" value={data.top_buyer?.broker || "-"} note={fmtRp(data.top_buyer?.net)} tone={1} />
              <MetricCard label="Smart Cumulative" value={fmtRp(data.smart_cumulative)} note={(data.smart_daily?.length || 0) + " broker days"} tone={data.smart_cumulative} />
            </div>
          )}

          {data?.alerts?.length > 0 && (
            <div className="mb-4 bg-amber-950/40 border border-amber-800/50 rounded-xl px-3.5 py-2.5">
              {data.alerts.map((a: string, i: number) => (
                <div key={i} className="text-xs text-amber-300">{a}</div>
              ))}
            </div>
          )}

          {data?.verdict && (
            <div className="mb-4 bg-blue-950/30 border-l-4 border-orange-500 rounded-r-xl px-3.5 py-2.5">
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Current read</div>
              <div className="text-xs text-neutral-200 leading-relaxed">{data.verdict}</div>
            </div>
          )}

          {/* Tabs Nav */}
          <div className="border-b border-neutral-800 mb-4">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={
                    "px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors " +
                    (activeTab === tab
                      ? "text-white bg-neutral-800 border-b-2 border-orange-500"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900")
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Views */}
          <div>
            {activeTab === "Overview" && <OverviewTab data={data} isLoading={isLoading} />}
            {activeTab === "Broker Flow" && <BrokerFlowTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} />}
            {activeTab === "Causality" && <CausalityTab ticker={ticker} analysisDate={analysisDate} windowDays={windowDays} detailData={data} />}
            {activeTab === "Validation" && (
              <ValidationTab
                ticker={ticker}
                analysisDate={analysisDate}
                windowDays={windowDays}
                universeMode={universe}
                horizon={horizon}
                minEvents={minEvents}
              />
            )}
            {activeTab === "Screener" && (
              <ScreenerTab
                universeMode={universe}
                analysisDate={analysisDate}
                windowDays={windowDays}
                customTickers={universe === "watchlist" ? localWatchlist : []}
              />
            )}
            {activeTab === "Raw Tables" && (
              <RawTablesTab
                ticker={ticker}
                analysisDate={analysisDate}
                windowDays={windowDays}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, note, tone, accent }: { label: string; value: string; note: string; tone: number | null; accent?: string }) {
  let color = "#94a3b8";
  if (accent) color = accent;
  else if (tone !== null && tone !== undefined) color = signedColor(Number(tone));
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm sm:text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-neutral-500 truncate mt-0.5">{note}</div>
    </div>
  );
}

function OverviewTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <div className="text-neutral-400 text-xs">Loading overview...</div>;
  if (!data || data.error) return <div className="text-red-400 text-xs">{data?.error || "No data"}</div>;

  const chartData = (data.price_chart || []).map((p: any) => {
    const sig = (data.signal_overlay || []).find((s: any) => s.date === p.date);
    return { ...p, signal: sig?.signal || null, signalScore: sig?.score ?? null };
  });

  return (
    <div className="space-y-4">
      {/* 1. Price Chart + Top Brokers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-200 mb-3">Price, Volume, and Signal Context</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar yAxisId="right" dataKey="volume" fill="#334155" opacity={0.3} />
                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
            <h3 className="text-xs font-bold text-neutral-200 mb-1">Top Brokers</h3>
            <p className="text-[10px] text-neutral-500 mb-2">Net buy/sell pada tanggal analisis</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-800 text-[10px]">
                    <th className="text-left py-1">Side</th>
                    <th className="text-left py-1">Broker</th>
                    <th className="text-left py-1">Type</th>
                    <th className="text-right py-1">Net</th>
                    <th className="text-left py-1 pl-2">5D</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.broker_summary || []).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-1" style={{ color: row.side === "Buy" ? "#10b981" : "#f43f5e" }}>{row.side}</td>
                      <td className="py-1 text-neutral-200 font-mono">{row.broker}</td>
                      <td className="py-1 text-neutral-400">{row.type}</td>
                      <td className="py-1 text-right font-mono" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                      <td className="py-1 pl-2 text-neutral-400 font-mono">{row.spark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
            <h3 className="text-xs font-bold text-neutral-200 mb-1">Price Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-800 text-[10px]">
                    <th className="text-left py-1">Period</th>
                    <th className="text-right py-1">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.price_performance || []).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-1 text-neutral-300">{row.period}</td>
                      <td className="py-1 text-right font-mono" style={{ color: signedColor(row.value) }}>{fmtPct(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Smart Flow + Profile Net Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">Smart-Money Daily Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.smart_daily || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value: any, name: string) => [fmtRp(Number(value)), name]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="smart_net"
                  fill="#10b981"
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.smart_net >= 0 ? "#10b981" : "#f43f5e";
                    return <rect x={x} y={y} width={width} height={height} fill={color} opacity={0.8} rx={2} />;
                  }}
                />
                <Line yAxisId="right" type="monotone" dataKey="cumulative_net" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <ReferenceLine yAxisId="left" y={0} stroke="#64748b" strokeWidth={1} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">Profile Net Flow</h3>
          {(data.profile_flow || []).length === 0 ? (
            <p className="text-xs text-neutral-500">No profile flow for this window.</p>
          ) : (
            <div className="space-y-3">
              {(data.profile_flow || []).map((row: any, i: number) => {
                const maxAbs = Math.max(...(data.profile_flow || []).map((r: any) => Math.abs(r.net)), 1);
                const width = Math.max(3, (Math.abs(row.net) / maxAbs) * 100);
                
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold" style={{ color: getProfileTextColor(row.label) }}>{row.label}</span>
                      <span className="font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: width + "%", backgroundColor: signedColor(row.net) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* 3. Broker Detail by Profile */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-neutral-200 mb-3">Broker Detail by Profile</h3>
        {(data.profile_broker_detail || []).length === 0 ? (
          <p className="text-xs text-neutral-500">No broker detail for this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-500 border-b border-neutral-800">
                  <th className="text-left py-1.5 pr-2">Profile</th>
                  <th className="text-left py-1.5 pr-2">Broker</th>
                  <th className="text-left py-1.5 pr-2">Type</th>
                  <th className="text-right py-1.5 pr-2">Buy</th>
                  <th className="text-right py-1.5 pr-2">Sell</th>
                  <th className="text-right py-1.5 pr-2">Net</th>
                  <th className="text-right py-1.5 pr-2">Freq</th>
                  <th className="text-right py-1.5 pr-2">Days</th>
                  <th className="text-right py-1.5">Avg/Tx</th>
                </tr>
              </thead>
              <tbody>
                {(data.profile_broker_detail || []).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="py-1.5 pr-2 font-semibold" style={{ color: getProfileTextColor(row.profile) }}>{row.profile}</td>
                    <td className="py-1.5 pr-2 text-neutral-200 font-mono">{row.broker}</td>
                    <td className="py-1.5 pr-2 text-neutral-400">{row.type}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-emerald-400">{fmtRp(row.buy)}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-red-400">{fmtRp(row.sell)}</td>
                    <td className="py-1.5 pr-2 text-right font-mono" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-neutral-400">{row.freq?.toLocaleString("id-ID") || 0}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-neutral-400">{row.days || 0}</td>
                    <td className="py-1.5 text-right font-mono text-neutral-400">{fmtRp(row.avg_value_tx)}</td>
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
