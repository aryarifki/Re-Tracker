export const fmtRp = (v: number | null | undefined) => {
  if (v == null || Number.isNaN(v)) return "-";
  const s = v < 0 ? "-" : "";
  const n = Math.abs(v);
  if (n >= 1e12) return `sRp{s}RpsRp{(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `sRp{s}RpsRp{(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `sRp{s}RpsRp{(n / 1e6).toFixed(2)} M`;
  return `sRp{s}RpsRp{n.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
};

export const fmtPct = (v: number | null | undefined) =>
  v == null ? "-" : `${(v * 100).toFixed(2)}%`;

export const fmtSignal = (s: string | null | undefined) => {
  if (!s) return "-";
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
};
