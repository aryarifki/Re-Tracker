"use client";
import useSWR from "swr";
import { fmtRp } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function RawTablesTab({ ticker, windowDays }: { ticker: string; windowDays: number }) {
  const rawUrl = "/api/bandar/stocks/" + ticker + "/raw?window=" + windowDays;
  const { data } = useSWR(rawUrl, fetcher);

  const flow = data?.flow ?? [];
  const act = data?.activity ?? [];

  function Table({ rows, cols, title }: { rows: any[]; cols: string[]; title: string }) {
    return (
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3 overflow-x-auto">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">{title}</div>
        {rows.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Kosong.</p>
        ) : (
          <table className="w-full text-[0.72rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                {cols.map((c) => (
                  <th key={c} className="py-1.5 pr-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  {cols.map((c) => (
                    <td key={c} className="py-1 pr-3">
                      {typeof r[c] === "number" ? fmtRp(r[c]) : String(r[c] ?? "-").slice(0, 10)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Table
        title="Broker Flow (Ringkasan Harian)"
        rows={flow}
        cols={["date", "ticker", "foreign_net_broker", "close", "bandar_signal"]}
      />
      <Table
        title="Broker Activity (Per Broker per Hari)"
        rows={act}
        cols={["date", "broker_code", "participant_type", "buy_value", "sell_value", "net_value"]}
      />
    </div>
  );
}
