"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function BrokerFlowTab({ ticker, analysisDate, windowDays }: { ticker: string; analysisDate: string; windowDays: number }) {
  const [compareMode, setCompareMode] = useState(true);
  const [maxBrokers, setMaxBrokers] = useState(5);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [flowMode, setFlowMode] = useState("Cumulative");

  const qs = "?window_days=" + windowDays + (analysisDate ? "&analysis_date=" + analysisDate : "") + "&flow_mode=" + flowMode + (selectedCodes.length > 0 ? "&broker_codes=" + selectedCodes.join(",") : "");
  const { data, error, isLoading } = useSWR(
    ticker ? "/api/bandar/broker-flow/" + ticker + qs : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const allCodes = data?.all_codes || [];
  const rankedCodes = data?.ranked_codes || [];
  const defaultCodes = data?.default_codes || [];
  const activeCodes = selectedCodes.length > 0 ? selectedCodes : defaultCodes;
  const maxSel = maxBrokers === 0 ? undefined : maxBrokers;

  const toggleCode = (code: string) => {
    if (activeCodes.includes(code)) {
      setSelectedCodes(activeCodes.filter((c) => c !== code));
    } else {
      if (maxSel && activeCodes.length >= maxSel) return;
      setSelectedCodes([...activeCodes, code]);
    }
  };

  if (isLoading) return <div className="text-neutral-400 text-sm">Loading broker flow...</div>;
  if (error || data?.error) return <div className="text-red-400 text-sm">{data?.error || "Error"}</div>;

  const chartData = data?.compare_chart || [];
  const dist = data?.distribution || { buyers: [], sellers: [], edges: [] };
  const summary = data?.summary || [];
  const detailRows = data?.detail_rows || [];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-neutral-200 mb-3">Broker Drill-Down</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700"
            />
            Compare mode
          </label>
          <select
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200"
            value={maxBrokers}
            onChange={(e) => { setMaxBrokers(Number(e.target.value)); setSelectedCodes([]); }}
          >
            <option value={3}>3 brokers</option>
            <option value={5}>5 brokers</option>
            <option value={8}>8 brokers</option>
            <option value={12}>12 brokers</option>
            <option value={0}>All</option>
          </select>
          <select
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200"
            value={flowMode}
            onChange={(e) => setFlowMode(e.target.value)}
          >
            <option value="Cumulative">Cumulative</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {flowMode === "Cumulative" ? "Cumulative mode sums broker net flow across the selected window." : "Daily mode shows each date separately."}
        </p>

        {/* Broker code chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(compareMode ? rankedCodes : allCodes).map((code: string) => {
            const active = activeCodes.includes(code);
            const disabled = !active && maxSel && activeCodes.length >= maxSel;
            return (
              <button
                key={code}
                onClick={() => !disabled && toggleCode(code)}
                className={
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors " +
                  (active
                    ? "bg-blue-900/40 border-blue-700 text-blue-300"
                    : disabled
                    ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200")
                }
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compare Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-neutral-200 mb-3">
          Broker Flow Comparison, {flowMode} in Selected Window
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} stroke="#334155" />
              <Tooltip
                contentStyle={{ background: "#171717", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: any, name: string) => ["Rp " + Number(value).toFixed(2) + " B", name]}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
              {activeCodes.map((code: string, i: number) => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution Visual */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">
            Broker Distribution, Estimated Matching on {dist.dist_date || "-"}
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            Exact broker-to-broker counterparties unavailable. Estimated same-day matching based on net buy/sell totals.
          </p>

          {/* Buyers */}
          <div className="mb-4">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Buyers</div>
            <div className="space-y-2">
              {dist.buyers.map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-300 w-10">{b.broker}</span>
                  <span className="text-[10px] text-neutral-500 w-14">{b.type}</span>
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: Math.min(100, (b.net_value / (dist.buyers[0]?.net_value || 1)) * 100) + "%" }} />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 w-20 text-right">{fmtRp(b.net_value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sellers */}
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Sellers</div>
            <div className="space-y-2">
              {dist.sellers.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-300 w-10">{s.broker}</span>
                  <span className="text-[10px] text-neutral-500 w-14">{s.type}</span>
                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: Math.min(100, (Math.abs(s.net_value) / (Math.abs(dist.sellers[0]?.net_value) || 1)) * 100) + "%" }} />
                  </div>
                  <span className="text-xs font-mono text-red-400 w-20 text-right">{fmtRp(s.net_value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Matching */}
          {dist.edges.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-800">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Estimated Matching</div>
              <div className="space-y-1.5">
                {dist.edges.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-mono">{e.buyer_code}</span>
                    <span className="text-neutral-500">→</span>
                    <span className="text-red-400 font-mono">{e.seller_code}</span>
                    <span className="text-neutral-300 font-mono">{fmtRp(e.matched_value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Broker Summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-200 mb-3">Broker Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-500 border-b border-neutral-800">
                  <th className="text-left py-1.5 pr-2">Buy Broker</th>
                  <th className="text-left py-1.5 pr-2">Type</th>
                  <th className="text-right py-1.5 pr-2">Buy Value</th>
                  <th className="text-left py-1.5 pr-2">Sell Broker</th>
                  <th className="text-left py-1.5 pr-2">Type</th>
                  <th className="text-right py-1.5">Sell Value</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    <td className="py-1.5 pr-2 text-emerald-400 font-mono">{row.buy_broker || "-"}</td>
                    <td className="py-1.5 pr-2 text-neutral-400">{row.buy_type || "-"}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-emerald-400">{fmtRp(row.buy_value)}</td>
                    <td className="py-1.5 pr-2 text-red-400 font-mono">{row.sell_broker || "-"}</td>
                    <td className="py-1.5 pr-2 text-neutral-400">{row.sell_type || "-"}</td>
                    <td className="py-1.5 text-right font-mono text-red-400">{fmtRp(row.sell_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Broker Rows */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-neutral-200 mb-3">Detailed Broker Rows</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-500 border-b border-neutral-800">
                <th className="text-left py-1.5 pr-2">Broker</th>
                <th className="text-left py-1.5 pr-2">Type</th>
                <th className="text-right py-1.5 pr-2">Buy</th>
                <th className="text-right py-1.5 pr-2">Sell</th>
                <th className="text-right py-1.5 pr-2">Net</th>
                <th className="text-right py-1.5">Freq</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row: any, i: number) => (
                <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-1.5 pr-2 text-neutral-200 font-mono">{row.broker}</td>
                  <td className="py-1.5 pr-2 text-neutral-400">{row.type}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-emerald-400">{fmtRp(row.buy)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-red-400">{fmtRp(row.sell)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: signedColor(row.net) }}>{fmtRp(row.net)}</td>
                  <td className="py-1.5 text-right font-mono text-neutral-400">{row.freq.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
