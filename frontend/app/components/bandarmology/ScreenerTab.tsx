"use client";
import useSWR from "swr";
import { fmtPct } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ScreenerTab() {
  const { data } = useSWR(`/api/bandar/screener?universe_mode=watchlist&horizon=10`, fetcher);
  const rows = (data?.data ?? []).filter((r: any) => r.significant);

  return (
    <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3 overflow-x-auto">
      <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
        Screener — Broker signifikan (p &lt; 0.05) di watchlist, horizon 10d
      </div>
      {rows.length === 0 ? <p className="text-[var(--muted)] text-sm">Tidak ada hasil signifikan.</p> : (
        <table className="w-full text-[0.75rem]">
          <thead><tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
            <th className="py-1.5">Ticker</th><th>Broker</th><th>Events</th>
            <th>Win Rate</th><th>Mean Fwd Ret</th><th>p</th>
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-[var(--line)]/50">
                <td className="py-1.5 font-bold text-[var(--strong)]">{r.ticker}</td>
                <td className="text-[var(--blue)]">{r.broker_code}</td>
                <td>{r.n_events}</td>
                <td>{(r.win_rate * 100).toFixed(0)}%</td>
                <td className={r.mean_fwd_return >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                  {fmtPct(r.mean_fwd_return)}
                </td>
                <td>{Number(r.p_value_one_sided).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
