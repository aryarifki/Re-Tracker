"use client";
import { use, useState, type ReactNode } from "react";
import useSWR from "swr";
import MetricCard from "@/app/components/MetricCard";
import Tabs from "@/app/components/ui/Tabs";
import { fmtRp, fmtPct, fmtSignal } from "@/app/components/fmt";
import OverviewTab from "@/app/components/bandarmology/OverviewTab";
import BrokerFlowTab from "@/app/components/bandarmology/BrokerFlowTab";
import CausalityTab from "@/app/components/bandarmology/CausalityTab";
import ValidationTab from "@/app/components/bandarmology/ValidationTab";
import ScreenerTab from "@/app/components/bandarmology/ScreenerTab";
import RawTablesTab from "@/app/components/bandarmology/RawTablesTab";

const fetcher = (u: string) =>
  fetch(u)
    .then((r) => r.json())
    .catch(() => null);

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--panel2)] text-[var(--muted)]">
      {children}
    </span>
  );
}

function buildAlerts(m: any): string[] {
  const out: string[] = [];
  if (!m) return out;
  const sig = (m.signal ?? "").toUpperCase();
  const foreignPos = (m.foreign_net_5d ?? 0) > 0;
  if (sig.includes("ACCUMULATION") && !foreignPos)
    out.push("⚠️ Sinyal akumulasi bandar, tetapi foreign net 5D negatif — kontradiksi, waspada false signal.");
  if (sig.includes("DISTRIBUTION") && foreignPos)
    out.push("⚠️ Sinyal distribusi bandar, tetapi foreign net 5D positif — kontradiksi, periksa broker detail.");
  const c = m.conviction?.components;
  if (c && c.signal >= 80 && c.broker < 40)
    out.push("⚠️ Sinyal kuat namun win rate broker validasi rendah — kurangi bobot sinyal.");
  return out;
}

export default function BrokerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = use(params);
  const ticker = raw.toUpperCase();
  const [windowDays, setWindowDays] = useState(20);

  const metricsUrl =
    "/api/bandar/stocks/" + ticker + "/metrics?window=" + windowDays;

  const { data: metrics, error } = useSWR(metricsUrl, fetcher);

  const cv = metrics?.conviction;
  const hasData = typeof cv?.score === "number";

  const score = hasData ? (cv?.score ?? 0) : 0;
  const tone: "positive" | "negative" | "warning" | "neutral" =
    score < 40 ? "negative" : score <= 70 ? "warning" : "positive";
  const alerts = buildAlerts(metrics);

  const verdict = cv
    ? "Sinyal terakhir " + fmtSignal(metrics?.signal) +
      " pada " + (metrics?.analysis_date ?? "-") + ". " +
      "Conviction " + cv.score + "/100 " +
      "(kausalitas " + (cv.components?.causality ?? "-") +
      ", sinyal " + (cv.components?.signal ?? "-") +
      ", asing " + (cv.components?.foreign ?? "-") +
      ", broker " + (cv.components?.broker ?? "-") + "). " +
      (cv.broker_note ?? "") + "."
    : metrics === null
      ? "Gagal memuat — pastikan backend berjalan dan proxy/rewrites aktif."
      : metrics
        ? "Data belum tersedia untuk ticker ini."
        : "Memuat…";

  return (
    <div className="min-h-screen bg-black text-[var(--text)] p-3 max-w-[1400px] mx-auto fade-in">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap justify-between items-end gap-3 border border-[var(--line)] rounded-lg bg-[var(--panel)] px-4 py-2.5 mb-2">
        <div>
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--blue)]">
            IDX Broker Flow Research
          </div>
          <div className="text-lg font-bold text-[var(--strong)]">Smart Money Dashboard</div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem] font-semibold">
          <Chip>{ticker}</Chip>
          <Chip>Analysis {metrics?.analysis_date ?? "-"}</Chip>
          <Chip>
            Window {metrics?.window_start ?? "-"} → {metrics?.analysis_date ?? "-"}
          </Chip>
          {[10, 20, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setWindowDays(d)}
              className={
                "px-2.5 py-1 rounded-md border font-semibold transition-colors " +
                (windowDays === d
                  ? "border-[var(--blue)] text-[var(--blue)] bg-[var(--blue)]/10"
                  : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]")
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* 6 METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <MetricCard
          label="Conviction Score"
          value={hasData ? cv?.score + "/100" : "…"}
          note="weighted model"
          tone={tone}
          title={"p=" + (cv?.p_value ?? "n/a") + "; " + (cv?.broker_note ?? "")}
        />
        <MetricCard
          label="Signal"
          value={metrics?.signal ? fmtSignal(metrics.signal) : "…"}
          tone={
            metrics?.signal?.includes("DISTRIBUTION")
              ? "negative"
              : metrics?.signal?.includes("ACCUMULATION")
                ? "positive"
                : "neutral"
          }
        />
        <MetricCard
          label="5D Return"
          value={fmtPct(metrics?.ret_5d)}
          tone={(metrics?.ret_5d ?? 0) >= 0 ? "positive" : "negative"}
          note="price context"
        />
        <MetricCard
          label="Foreign Net 5D"
          value={fmtRp(metrics?.foreign_net_5d)}
          tone={(metrics?.foreign_net_5d ?? 0) >= 0 ? "positive" : "negative"}
          note="broker summary"
        />
        <MetricCard
          label="Top Buyer"
          value={metrics?.top_buyers?.[0]?.broker_code ?? "-"}
          note={fmtRp(metrics?.top_buyers?.[0]?.net_value)}
          tone="positive"
        />
        <MetricCard
          label="Smart Cumulative"
          value={fmtRp(metrics?.smart_cumulative)}
          tone={(metrics?.smart_cumulative ?? 0) >= 0 ? "positive" : "negative"}
          note="broker window"
        />
      </div>

      {/* ALERTS */}
      {alerts.map((a) => (
        <div
          key={a}
          className="mt-2 px-3 py-2 text-[0.82rem] rounded-lg border border-amber-700/40 bg-amber-500/10 text-amber-400"
        >
          {a}
        </div>
      ))}

      {/* VERDICT */}
      <div className="mt-2 border border-[var(--line)] border-l-2 border-l-[var(--blue)] bg-[var(--panel)] rounded-md px-3 py-2.5">
        <div className="text-[0.61rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
          Current read
        </div>
        <p className="text-[0.84rem] leading-relaxed">{verdict}</p>
      </div>

      {/* 6 TABS */}
      <div className="mt-3">
        <Tabs labels={["Overview", "Broker Flow", "Causality Insight", "Validation", "Screener", "Raw Tables"]}>
          <OverviewTab ticker={ticker} windowDays={windowDays} />
          <BrokerFlowTab ticker={ticker} windowDays={windowDays} />
          <CausalityTab ticker={ticker} />
          <ValidationTab ticker={ticker} horizon={10} />
          <ScreenerTab />
          <RawTablesTab ticker={ticker} windowDays={windowDays} />
        </Tabs>
      </div>
    </div>
  );
}
