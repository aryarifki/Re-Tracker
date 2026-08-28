"use client";
import useSWR from "swr";
import ChartBase, { axisCommon } from "@/app/components/bandarmology/ChartBase";
import { fmtRp } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const PALETTE = ["#3b82f6", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function BrokerFlowTab({ ticker, windowDays }: { ticker: string; windowDays: number }) {
  const cmpUrl =
    "/api/bandar/stocks/" + ticker + "/broker-compare?window=" + windowDays + "&mode=cumulative";
  const distUrl = "/api/bandar/stocks/" + ticker + "/broker-distribution?top_n=12";

  const { data: cmp } = useSWR(cmpUrl, fetcher);
  const { data: dist } = useSWR(distUrl, fetcher);

  const rows = cmp?.data ?? [];
  const allBrokers = rows.length ? Object.keys(rows[0]).filter((k: string) => k !== "date") : [];
  const lastRow = rows[rows.length - 1] ?? {};

  const topBrokers = allBrokers
    .map((b: string) => ({ code: b, net: Number(lastRow[b] ?? 0) }))
    .filter((x) => x.net !== 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 8);

  return (
    <div className="space-y-3">
      {/* LINE CHART — TOP 8 SAJA */}
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Broker Net Flow (Cumulative) — Top 8
        </div>
        {rows.length === 0 || topBrokers.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Belum ada data.</p>
        ) : (
          <ChartBase
            option={{
              tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRp(v) },
              legend: { textStyle: { color: "#8a8a8a", fontSize: 10 }, top: 0 },
              grid: { left: 70, right: 20, top: 40, bottom: 25 },
              xAxis: {
                type: "category",
                data: rows.map((r: any) => String(r.date).slice(5, 10)),
                ...axisCommon,
              },
              yAxis: {
                type: "value",
                ...axisCommon,
                axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => fmtRp(v) },
              },
              series: topBrokers.map((b, i) => ({
                name: b.code,
                type: "line",
                symbol: "none",
                lineStyle: { width: 1.5, color: PALETTE[i % PALETTE.length] },
                itemStyle: { color: PALETTE[i % PALETTE.length] },
                data: rows.map((r: any) => r[b.code]),
              })),
            }}
            height={300}
          />
        )}
      </div>

      {/* POSISI BROKER HARI TERAKHIR — PENGGANTI SANKEY */}
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Posisi Broker Hari Terakhir (Top 8)
        </div>
        {topBrokers.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Belum ada data.</p>
        ) : (
          <ChartBase
            option={{
              tooltip: { trigger: "item", valueFormatter: (v: number) => fmtRp(v) },
              grid: { left: 55, right: 40, top: 10, bottom: 25 },
              xAxis: {
                type: "value",
                ...axisCommon,
                axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => fmtRp(v) },
              },
              yAxis: {
                type: "category",
                ...axisCommon,
                data: topBrokers.map((x) => x.code).reverse(),
              },
              series: [
                {
                  type: "bar",
                  barMaxWidth: 16,
                  data: topBrokers.map((x) => x.net).reverse(),
                  itemStyle: { color: (p: any) => (p.value >= 0 ? "#10b981" : "#f43f5e") },
                },
              ],
            }}
            height={240}
          />
        )}
      </div>

      {/* TABEL DISTRIBUSI */}
      {dist?.data && dist.data.length > 0 && (
        <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3 overflow-x-auto">
          <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
            Broker Distribution (Top 12)
          </div>
          <table className="w-full text-[0.72rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5">Broker</th>
                <th>Net Value</th>
              </tr>
            </thead>
            <tbody>
              {dist.data.map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  <td className="py-1 font-semibold text-[var(--blue)]">{r.broker_code}</td>
                  <td className={(r.net_value ?? 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                    {fmtRp(r.net_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
