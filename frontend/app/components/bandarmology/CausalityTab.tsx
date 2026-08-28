"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function CausalityTab({ ticker }: { ticker: string }) {
  const { data } = useSWR(`/api/bandar/stocks/${ticker}/causality`, fetcher);
  const f = data?.foreign;
  const part = data?.participants ?? [];
  const brokers = data?.brokers ?? [];

  return (
    <div className="space-y-3">
      <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
        <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">
          Foreign Flow → Price (Granger)
        </div>
        {!f ? <p className="text-[var(--muted)] text-sm">Data tidak cukup.</p> : (
          <ul className="text-[0.8rem] space-y-1">
            <li>Min p-value: <b className="text-[var(--blue)]">{f.min_p_value ?? "n/a"}</b></li>
            <li>Best lag: <b>{f.best_lag ?? "-"}</b></li>
            <li>
              Kesimpulan:{" "}
              <b className={(f.min_p_value ?? 1) < 0.05 ? "text-[var(--green)]" : "text-[var(--muted)]"}>
                {(f.min_p_value ?? 1) < 0.05 ? "Ada bukti kausalitas signifikan" : "Tidak signifikan pada level 5%"}
              </b>
            </li>
          </ul>
        )}
      </div>

      {part.length > 0 && (
        <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
          <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">By Participant</div>
          <table className="w-full text-[0.75rem]">
            <thead><tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
              <th className="py-1.5">Participant</th><th>Best Lag</th><th>p-value</th><th>Signifikan</th>
            </tr></thead>
            <tbody>
              {part.map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  <td className="py-1.5 font-semibold">{r.participant ?? r.name}</td>
                  <td>{r.best_lag ?? "-"}</td>
                  <td>{Number(r.min_p_value ?? r.p_value ?? 0).toFixed(4)}</td>
                  <td>{r.significant ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {brokers.length > 0 && (
        <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3">
          <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">By Broker (Top 15)</div>
          <table className="w-full text-[0.75rem]">
            <thead><tr className="text-left text-[var(--muted)] border-b border-[var(--line)]">
              <th className="py-1.5">Broker</th><th>Best Lag</th><th>p-value</th><th>Signifikan</th>
            </tr></thead>
            <tbody>
              {brokers.map((r: any, i: number) => (
                <tr key={i} className="border-b border-[var(--line)]/50">
                  <td className="py-1.5 font-semibold text-[var(--blue)]">{r.broker_code}</td>
                  <td>{r.best_lag ?? "-"}</td>
                  <td>{Number(r.min_p_value ?? r.p_value ?? 0).toFixed(4)}</td>
                  <td>{r.significant ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
