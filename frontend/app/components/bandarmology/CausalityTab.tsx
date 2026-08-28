"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function fmtCell(v: any): string {
  if (v == null) return "-";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toLocaleString("id-ID");
    return v.toFixed(4);
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

export default function CausalityTab({ ticker }: { ticker: string }) {
  const url = "/api/bandar/stocks/" + ticker + "/causality";
  const { data, error } = useSWR(url, fetcher);

  // Normalisasi: respons bisa berupa array langsung, {data: [...]}, atau {lag_results: [...]} dll.
  let rows: any[] = [];
  let extra: Record<string, any> = {};
  if (Array.isArray(data)) rows = data;
  else if (Array.isArray(data?.data)) rows = data.data;
  else if (Array.isArray(data?.results)) rows = data.results;
  else if (Array.isArray(data?.lag_results)) rows = data.lag_results;
  else if (data && typeof data === "object") {
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === "object") {
        rows = data[k];
        break;
      }
    }
    extra = data;
  }

  return (
    <div className="space-y-3">
      <GenericTable title="Granger Causality — Smart Money → Price" rows={rows} />

      {rows.length === 0 && (
        <pre className="p-2 text-[0.65rem] text-red-400 overflow-x-auto border border-red-900 bg-red-950/30 rounded">
          DEBUG causality: {data ? JSON.stringify(data).slice(0, 400) : "null"}
        </pre>
      )}

      {!Array.isArray(data) && rows.length === 0 && data && (
        <GenericTable title="Detail Lain" rows={[extra]} />
      )}
    </div>
  );
}
