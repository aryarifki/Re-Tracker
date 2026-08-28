"use client";
import useSWR from "swr";
import ChartBase, { axisCommon } from "@/app/components/bandarmology/ChartBase";
import { fmtRp } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function OverviewTab({ ticker, windowDays }: { ticker: string; windowDays: number }) {
  const { data: flow } = useSWR(`/api/bandar/stocks/ticker/smart−flow?lookbackdays={ticker}/smart-flow?lookback_days=ticker/smart−flow?lookbackd​ays={windowDays}`, fetcher);
  const rows = flow?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Smart Money Daily Flow — {ticker}
        </div>
        {rows.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Belum ada data.</p>
        ) : (
          <ChartBase
            option={{
              tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRp(v) },
              legend: { textStyle: { color: "#8a8a8a", fontSize: 10 }, top: 0 },
              grid: { left: 70, right: 20, top: 30, bottom: 25 },
              xAxis: { type: "category", data: rows.map((r: any) => r.date), ...axisCommon },
              yAxis: [
                { type: "value", ...axisCommon, axisLabel: { ...axisCommon.axisLabel,
                  formatter: (v: number) => fmtRp(v) } },
              ],
              series: [
                { name: "Smart Net", type: "bar", data: rows.map((r: any) => r.smart_net),
                  itemStyle: { color: (p: any) => (p.value >= 0 ? "#10b981" : "#f43f5e") } },
                { name: "Cumulative", type: "line", data: rows.map((r: any) => r.cumulative_net),
                  lineStyle: { color: "#3b82f6" }, itemStyle: { color: "#3b82f6" }, symbol: "none" },
              ],
            }}
            height={320}
          />
        )}
      </div>
    </div>
  );
}
