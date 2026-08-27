"use client";
import { useState } from "react";
import useSWR from "swr";
import MetricCard from "@/components/MetricCard";
import { Tabs } from "@/components/ui/Tabs";
import OverviewTab from "@/components/bandarmology/OverviewTab";
import BrokerFlowTab from "@/components/bandarmology/BrokerFlowTab";
import CausalityTab from "@/components/bandarmology/CausalityTab";
import ValidationTab from "@/components/bandarmology/ValidationTab";
import ScreenerTab from "@/components/bandarmology/ScreenerTab";
import RawTablesTab from "@/components/bandarmology/RawTablesTab";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const fmtRp = (v: number | null) => {
  if (v == null) return "-";
  const s = v < 0 ? "-" : ""; const n = Math.abs(v);
  if (n >= 1e12) return `sRp{s}RpsRp{(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `sRp{s}RpsRp{(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `sRp{s}RpsRp{(n / 1e6).toFixed(2)} M`;
  return `sRp{s}RpsRp{n.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
};
export { fmtRp };

export default function BrokerPage({ params }: { params: Promise<{ ticker: string }> }) {
  // Next 16: params async
  const { ticker: raw } = use(params as never) as { ticker: string };
  const ticker = raw.toUpperCase();

  // ── Sidebar state (semua kontrol app.py) ──
  const [universe, setUniverse] = useState("watchlist");
  const [analysisDate, setAnalysisDate] = useState<string>("");
  const [windowDays, setWindowDays] = useState(20);
  const [horizon, setHorizon] = useState(10);
  const [minEvents, setMinEvents] = useState(5);
  const [minNetBuy, setMinNetBuy] = useState(0);

  const { data: tickerList } = useSWR("/api/bandar/tickers", fetcher);
  const { data: metrics, error } = useSWR(
    ticker ? `/api/bandar/stocks/ticker/metrics?window={ticker}/metrics?window=ticker/metrics?window={windowDays}` : null,
    fetcher
  );

  const score = metrics?.conviction?.score ?? 0;
  const tone = score < 40 ? "negative" : score <= 70 ? "warning" : "positive";
  const alerts: string[] = buildAlerts(metrics); // replica contradiction_alerts

  return (
    <div className="flex min-h-screen bg-black text-[var(--text)]">
      {/* SIDEBAR — identik dengan st.sidebar app.py */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[var(--line)] bg-[#050505] p-4 gap-3">
        <Controls {...{ universe, setUniverse, analysisDate, setAnalysisDate,
          windowDays, setWindowDays, horizon, setHorizon, minEvents, setMinEvents, minNetBuy, setMinNetBuy }} />
      </aside>

      <main className="flex-1 p-3 max-w-[1400px] mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-wrap justify-between items-end gap-3 border border-[var(--line)] rounded-lg bg-[var(--panel)] px-4 py-2.5 mb-2">
          <div>
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--blue)]">IDX Broker Flow Research</div>
            <div className="text-lg font-bold text-[var(--strong)]">Smart Money Dashboard</div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[0.7rem] font-semibold">
            <Chip>{ticker}</Chip>
            <Chip>Analysis {metrics?.analysis_date ?? "-"}</Chip>
            <Chip>Window {metrics?.window_start ?? "-"} → {metrics?.analysis_date ?? "-"}</Chip>
          </div>
        </div>

        {/* 6 METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <MetricCard label="Conviction Score" value={metrics ? `${metrics.conviction.score}/100` : "…"}
            note="weighted model" tone={tone}
            title={`p=metrics?.conviction.pvalue??"n/a";{metrics?.conviction.p_value ?? "n/a"};metrics?.conviction.pv​alue??"n/a";{metrics?.conviction.broker_note ?? ""}`} />
          <MetricCard label="Signal" value={fmtSignal(metrics?.signal)} note="selected date" />
          <MetricCard label="5D Return" value={fmtPct(metrics?.ret_5d)}
            tone={(metrics?.ret_5d ?? 0) >= 0 ? "positive" : "negative"} note="price context" />
          <MetricCard label="Foreign Net 5D" value={fmtRp(metrics?.foreign_net_5d ?? null)}
            tone={(metrics?.foreign_net_5d ?? 0) >= 0 ? "positive" : "negative"} note="broker summary" />
          <MetricCard label="Top Buyer" value={metrics?.top_buyers?.[0]?.broker_code ?? "-"}
            note={fmtRp(metrics?.top_buyers?.[0]?.net_value ?? null)} tone="positive" />
          <MetricCard label="Smart Cumulative" value={fmtRp(metrics?.smart_cumulative ?? null)}
            tone={(metrics?.smart_cumulative ?? 0) >= 0 ? "positive" : "negative"} note="broker days" />
        </div>

        {/* ALERTS */}
        {alerts.map((a) => (
          <div key={a} className="mt-2 px-3 py-2 text-[0.82rem] rounded-lg border border-amber-700/40 bg-amber-500/10 text-amber-400">
            {a}
          </div>
        ))}

        {/* VERDICT */}
        <div className="mt-2 border-l-2 border-[var(--blue)] bg-[var(--panel)] border border-[var(--line)] rounded-md px-3 py-2.5">
          <div className="text-[0.61rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">Current read</div>
          <p className="text-[0.84rem] leading-relaxed">{metrics?.verdict ?? "Memuat…"}</p>
        </div>

        {/* 6 TABS app.py */}
        <div className="mt-3">
          <Tabs labels={["Overview", "Broker Flow", "Causality Insight", "Validation", "Screener", "Raw Tables"]}>
            <OverviewTab ticker={ticker} windowDays={windowDays} />
            <BrokerFlowTab ticker={ticker} windowDays={windowDays} />
            <CausalityTab ticker={ticker} />
            <ValidationTab ticker={ticker} horizon={horizon} />
            <ScreenerTab />
            <RawTablesTab ticker={ticker} windowDays={windowDays} />
          </Tabs>
        </div>
      </main>
    </div>
  );
}
