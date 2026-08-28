"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
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

const TABS = ["Overview", "Broker Flow", "Causality", "Validation", "Screener", "Raw Tables"];
const UNIVERSES = ["watchlist", "idx30", "lq45", "idx80", "all"];
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
  const { data: universeData } = useSWR("/api/bandar/universe/" + universe, fetcher);
  const tickers = universeData?.tickers || [];
  const filteredTickers = useMemo(() => {
    const term = searchTerm.toUpperCase();
    return term ? tickers.filter((t: string) => t.includes(term)).slice(0, 10) : tickers.slice(0, 10);
  }, [tickers, searchTerm]);

  /* Fetch dates for selected ticker */
  const { data: datesData } = useSWR(ticker ? "/api/bandar/dates/" + ticker : null, fetcher);
  const availableDates = datesData?.dates || [];

  /* Fetch detail */
  const qs = "?window_days=" + windowDays + (analysisDate ? "&analysis_date=" + analysisDate : "");
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/detail/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  /* Auto-select latest date when dates load */
  useEffect(() => {
    if (availableDates.length > 0 && !analysisDate) {
      setAnalysisDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, analysisDate]);

  /* Navigate to different ticker */
  const goToTicker = (t: string) => {
    if (t && t !== ticker) {
      router.push("/" + t);
      setSidebarOpen(false);
    }
  };

  if (!ticker) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">No ticker</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={
        "fixed lg:sticky top-0 z-50 h-screen w-72 bg-neutral-900 border-r border-neutral-800 overflow-y-auto " +
        "transition-transform duration-300 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="p-4 space-y-5">
          {/* Header */}
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">IDX Broker Flow</div>
            <h2 className="text-sm font-bold text-white">Controls</h2>
          </div>

          {/* Universe */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Universe</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
            >
              {UNIVERSES.map((u) => (
                <option key={u} value={u}>{u.toUpperCase()}</option>
              ))}
            </select>
            <div className="text-[10px] text-neutral-500 mt-1">
              {universeData?.count || 0} tickers
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Search Ticker</label>
            <input
              type="text"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              placeholder="Type ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="mt-1 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                {filteredTickers.map((t: string) => (
                  <button
                    key={t}
                    className="w-full text-left px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    onClick={() => { goToTicker(t); setSearchTerm(""); }}
                  >
                    {t}
                  </button>
                ))}
                {filteredTickers.length === 0 && (
                  <div className="px-3 py-1.5 text-sm text-neutral-500">No match</div>
                )}
              </div>
            )}
            {!searchTerm && tickers.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg">
                {tickers.slice(0, 20).map((t: string) => (
                  <button
                    key={t}
                    className={
                      "w-full text-left px-3 py-1 text-xs " +
                      (t === ticker ? "bg-blue-900/40 text-blue-300 font-bold" : "text-neutral-400 hover:bg-neutral-700 hover:text-white")
                    }
                    onClick={() => goToTicker(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Date */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Analysis Date</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              value={analysisDate}
              onChange={(e) => setAnalysisDate(e.target.value)}
            >
              {availableDates.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {availableDates.length === 0 && (
              <div className="text-[10px] text-neutral-500 mt-1">Loading dates...</div>
            )}
          </div>

          {/* Broker Window */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Broker Window</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
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
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Validation Horizon</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              {HORIZONS.map((h) => (
                <option key={h} value={h}>{h} trading days</option>
              ))}
            </select>
          </div>

          {/* Min Events */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Min Broker Events</label>
            <input
              type="number"
              min={3}
              max={30}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              value={minEvents}
              onChange={(e) => setMinEvents(Number(e.target.value))}
            />
          </div>

          {/* Min Net Buy */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Min Net Buy, Rp B</label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200"
              value={minNetBuy}
              onChange={(e) => setMinNetBuy(Number(e.target.value))}
            />
          </div>

          <hr className="border-neutral-800" />

          {/* Action Buttons */}
          <div className="space-y-2">
            <button className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors">
              Run latest pipeline to today
            </button>
            <button className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors">
              Fetch missing broker dates
            </button>
            <button className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors">
              Backfill broker history
            </button>
          </div>

          {/* Footer */}
          <div className="text-[10px] text-neutral-600 pt-2">
            Data: localhost/bandarmology<br/>
            Created by: Cugarete
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-bold text-white">{ticker}</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">IDX Broker Flow Research</div>
              <h1 className="text-xl font-bold text-white">Smart Money Dashboard</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1">{ticker}</span>
              <span className="text-xs font-semibold bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1">
                Analysis {data?.analysis_date || "..."}
              </span>
              <span className="text-xs font-semibold bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1">
                Window {data?.window_start || "..."} to {data?.analysis_date || "..."}
              </span>
            </div>
          </div>

          {/* Mobile Title */}
          <div className="lg:hidden mb-4">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">IDX Broker Flow Research</div>
            <h1 className="text-lg font-bold text-white">Smart Money Dashboard</h1>
          </div>

          {/* Loading / Error */}
          {isLoading && <div className="text-neutral-400 text-sm mb-4">Loading data...</div>}
          {error && <div className="text-red-400 text-sm mb-4">Error loading data</div>}

          {/* Metric Cards */}
          {data && !data.error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <MetricCard label="Conviction Score" value={data.conviction_score?.toFixed(1) + "/100"} note="weighted model" tone={data.conviction_score} />
              <MetricCard label="Signal" value={data.signal} note="selected date" tone={null} accent={signalColor(data.signal_score)} />
              <MetricCard label="5D Return" value={fmtPct(data.ret_5d)} note="price context" tone={data.ret_5d} />
              <MetricCard label="Foreign Net 5D" value={fmtRp(data.foreign_5d)} note="broker summary" tone={data.foreign_5d} />
              <MetricCard label="Top Buyer" value={data.top_buyer?.broker || "-"} note={fmtRp(data.top_buyer?.net)} tone={1} />
              <MetricCard label="Smart Cumulative" value={fmtRp(data.smart_cumulative)} note={(data.smart_daily?.length || 0) + " broker days"} tone={data.smart_cumulative} />
            </div>
          )}

          {/* Alerts */}
          {data?.alerts?.length > 0 && (
            <div className="mb-4 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
              {data.alerts.map((a: string, i: number) => (
                <div key={i} className="text-sm text-amber-300">{a}</div>
              ))}
            </div>
          )}

          {/* Verdict */}
          {data?.verdict && (
            <div className="mb-4 bg-blue-950/30 border-l-4 border-blue-500 rounded-r-xl px-4 py-3">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Current read</div>
              <div className="text-sm text-neutral-200 leading-relaxed">{data.verdict}</div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-neutral-800 mb-4">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={
                    "px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors " +
                    (activeTab === tab
                      ? "text-white bg-neutral-800 border-b-2 border-blue-500"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900")
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="pb-8">
            {activeTab === "Overview" && <OverviewTab data={data} isLoading={isLoading} />}
            {activeTab !== "Overview" && (
              <div className="text-neutral-400 text-sm">{activeTab} tab — coming in next phase</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ==================== MetricCard ==================== */
function MetricCard({ label, value, note, tone, accent }: { label: string; value: string; note: string; tone: number | null; accent?: string }) {
  let color = "#94a3b8";
  if (accent) color = accent;
  else if (tone !== null && tone !== undefined) color = signedColor(Number(tone));
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 border-l-4" style={{ borderLeftColor: color }}>
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-neutral-500 truncate mt-1">{note}</div>
    </div>
  );
}

/* ==================== OverviewTab ==================== */
function OverviewTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <div className="text-neutral-400 text-sm">Loading overview...</div>;
  if (!data || data.error) return <div className="text-red-400 text-sm">{data?.error || "No data"}</div>;

  const chartData = (data.price_chart || []).map((p: any) => {
    const sig = (data.signal_overlay || []).find((s: any) => s.date === p.date);
    return { ...p, signal: sig?.signal || null, signalScore: sig?.score ?? null };
  });

  return (
    <div className="space-y-4">
      {/* Price Chart + Top Brokers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">Price, Volume, and Signal Context</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar yAxisId="right" dataKey="volume" fill="#334155" opacity={0.3} />
                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} />
                {chartData
                  .filter((d: any) => d.signalScore !== null)
                  .map((d: any, i: number) => (
                    <ReferenceLine key={i} x={d.date} stroke="#b7791f" strokeDasharray="4 4" yAxisId="left" />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-neutral-200 mb-2">Top Brokers</h3>
            <p className="text-xs text-neutral-500 mb-2">Broker net buy/sell on analysis date only</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-800">
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

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-neutral-200 mb-2">Price Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-800">
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

      {/* Smart Flow + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">Smart-Money Daily Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.smart_daily || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
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
                      <span className="text-neutral-200 font-semibold">{row.label}</span>
                      <span className="font-mono font-bold" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</span>
                    </div>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: width + "%", backgroundColor: signedColor(row.net) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
