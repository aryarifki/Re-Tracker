"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function fmtCell(v: any): string {
  if (v == null) return "-";
  if (typeof v === "number") {
    if (Math.abs(v) >= 1e6) return "Rp " + (v / 1e9).toFixed(2) + " B";
    if (Number.isInteger(v)) return v.toLocaleString("id-ID");
    return v.toFixed(2);
  }
  return String(v).slice(0, 10);
}

function GenericTable({ title, rows }: { title: string; rows: any[] }) {
  if (!rows || rows.length === 0) return null;
  const cols = Object.keys(rows[0]).slice(0, 8);
  return (
    <div className="border border-[var(--line)] rounded-lg bg-[var(--panel)] p-3 overflow-x-auto">
      <div className="text-[0.78rem] font-semibold text-[var(--strong)] mb-2">{title}</div>
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
          {rows.slice(0, 30).map((r: any, i: number) => (
            <tr key={i} className="border-b border-[var(--line)]/50">
              {cols.map((c) => (
                <td key={c} className="py-1 pr-3">
                  {fmtCell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RawTablesTab({ ticker, windowDays }: { ticker: string; windowDays: number }) {
  const rawUrl = "/api/bandar/stocks/" + ticker + "/raw?window=" + windowDays;
  const { data, error } = useSWR(rawUrl, fetcher);

  // Coba beberapa bentuk kunci yang umum
  let flow: any[] = data?.flow ?? data?.broker_flow ?? [];
  let act: any[] = data?.activity ?? data?.broker_activity ?? [];

  // Fallback: kalau tidak ketemu, cari array apapun di respons
  if (flow.length === 0 && act.length === 0 && data && typeof data === "object") {
    const found: any[][] = [];
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) found.push(data[k]);
    }
    if (found.length === 1) flow = found[0];
    else if (found.length >= 2) {
      flow = found[0];
      act = found[1];
    }
  }

  const nothing = flow.length === 0 && act.length === 0;

  return (
    <div className="space-y-3">
      <GenericTable title="Broker Flow (Ringkasan Harian)" rows={flow} />
      <GenericTable title="Broker Activity (Per Broker per Hari)" rows={act} />

      {nothing && (
        <pre className="p-2 text-[0.65rem] text-red-400 overflow-x-auto border border-red-900 bg-red-950/30 rounded">
          DEBUG raw: {data ? JSON.stringify(data).slice(0, 400) : "null"}
        </pre>
      )}
    </div>
  );
}
