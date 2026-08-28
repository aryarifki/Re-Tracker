"use client";
import useSWR from "swr";
import { fmtPct } from "@/app/components/fmt";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ValidationTab({ ticker, horizon }: { ticker: string; horizon: number }) {
  const scanUrl =
    "/api/bandar/validation/broker-scan?ticker=" + ticker + "&horizon=" + horizon + "&min_events=5";
  const evUrl = "/api/bandar/stocks/" + ticker + "/event-study?horizons=1,3,5,10";

  const { data: scan } = useSWR(scanUrl, fetcher);
  const { data: ev } = useSWR(evUrl, fetcher);

  const rows = scan?.data ?? [];
  const evRows = ev?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3 overflow-x-auto">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Broker Alpha Scan (t-test satu sisi) — horizon {horizon}d
        </div>
        {rows.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Belum ada sampel.</p>
        ) : (
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5">Broker</th>
                <th>Events</th>
                <th>Win Rate</th>
                <th>Mean Fwd Ret</th>
                <th>p (1-sisi)</th>
                <th>Signifikan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  <td className="py-1.5 font-semibold text-[var(--blue)]">{r.broker_code}</td>
                  <td>{r.n_events}</td>
                  <td>{(r.win_rate * 100).toFixed(0)}%</td>
                  <td className={r.mean_fwd_return >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                    {fmtPct(r.mean_fwd_return)}
                  </td>
                  <td>{Number(r.p_value_one_sided).toFixed(4)}</td>
                  <td>{r.significant ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Event Study — Return setelah sinyal akumulasi
        </div>
        {evRows.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">Belum ada event.</p>
        ) : (
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1.5">Tanggal</th>
                <th>+1d</th>
                <th>+3d</th>
                <th>+5d</th>
                <th>+10d</th>
              </tr>
            </thead>
            <tbody>
              {evRows.map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  <td className="py-1.5">{String(r.date ?? r.signal_date ?? "").slice(0, 10)}</td>
                  {["1", "3", "5", "10"].map((h) => {
                    const v = r["fwd_return_" + h + "d"];
                    return (
                      <td key={h} className={v >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                        {v == null ? "-" : fmtPct(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
