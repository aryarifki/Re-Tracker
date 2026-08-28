"use client";
import useSWR from "swr";
import ChartBase, { axisCommon } from "@/app/components/bandarmology/ChartBase";
import { fmtRp } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const PALETTE = ["#3b82f6", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function BrokerFlowTab({ ticker, windowDays }: { ticker: string; windowDays: number }) {
  const { data: cmp } = useSWR(`/api/bandar/stocks/ticker/broker−compare?window={ticker}/broker-compare?window=ticker/broker−compare?window={windowDays}&mode=cumulative`, fetcher);
  const { data: dist } = useSWR(`/api/bandar/stocks/${ticker}/broker-distribution?top_n=12`, fetcher);

  const rows = cmp?.data ?? [];
  const brokers = rows.length ? Object.keys(rows[0]).filter((k) => k !== "date") : [];

  // Sankey: source = broker, target = "Buy Flow"/"Sell Flow" berdasarkan net akhir
  const lastRow = rows[rows.length - 1] ?? {};
  const sankeyNodes = [
    ...brokers.map((b) => ({ name: b })),
    { name: "Net Buy" }, { name: "Net Sell" },
  ];
  const sankeyLinks = brokers
    .filter((b) => lastRow[b] != null && lastRow[b] !== 0)
    .map((b) => ({
      source: b,
      target: lastRow[b] > 0 ? "Net Buy" : "Net Sell",
      value: Math.abs(lastRow[b]),
    }));

  return (
    <div className="space-y-3">
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Broker Net Flow (Cumulative) — Top Brokers
        </div>
        {rows.length === 0 ? <p className="text-[var(--muted)] text-sm">Belum ada data.</p> : (
          <ChartBase
            option={{
              tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRp(v) },
              legend: { type: "scroll", textStyle: { color: "#8a8a8a", fontSize: 10 }, top: 0 },
              grid: { left: 70, right: 20, top: 40, bottom: 25 },
              xAxis: { type: "category", data: rows.map((r: any) => r.date), ...axisCommon },
              yAxis: { type: "value", ...axisCommon,
                axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => fmtRp(v) } },
              series: brokers.map((b, i) => ({
                name: b, type: "line", symbol: "none",
                lineStyle: { width: 1.5, color: PALETTE[i % PALETTE.length] },
                itemStyle: { color: PALETTE[i % PALETTE.length] },
                data: rows.map((r: any) => r[b]),
              })),
            }}
            height={340}
          />
        )}
      </div>

      {sankeyLinks.length > 0 && (
        <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
          <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
            Broker Distribution Map (Sankey)
          </div>
          <ChartBase
            option={{
              tooltip: { trigger: "item", valueFormatter: (v: number) => fmtRp(v) },
              series: [{
                type: "sankey", layout: "none", emphasis: { focus: "adjacency" },
                nodeAlign: "justify",
                data: sankeyNodes,
                links: sankeyLinks,
                label: { color: "#d4d4d4", fontSize: 10 },
                lineStyle: { color: "gradient", curveness: 0.5, opacity: 0.35 },
                itemStyle: { borderColor: "#222" },
              }],
            }}
            height={420}
          />
        </div>
      )}
    </div>
  );
}
