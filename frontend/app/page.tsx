"use client";

import useSWR from "swr";
import TickerCard from "@/components/home/TickerCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

const fmtB = (v: number) => `v>=0?"+":""{v >= 0 ? "+" : ""}v>=0?"+":""{(v / 1e9).toFixed(1)}M`;

export default function HomeMobile() {
  const { data, error } = useSWR(
    "/api/bandar/daily-summary?universe_mode=watchlist",
    fetcher,
    { refreshInterval: 60_000 }
  );

  const counts = data?.signal_counts ?? {};

  const accum =
    (counts["ACCUMULATION"] ?? 0) +
    (counts["AKUMULASI"] ?? 0) +
    (counts["STRONG_ACCUMULATION"] ?? 0) +
    (counts["AKUMULASI_KUAT"] ?? 0);

  const distrib =
    (counts["DISTRIBUTION"] ?? 0) +
    (counts["DISTRIBUSI"] ?? 0) +
    (counts["STRONG_DISTRIBUTION"] ?? 0) +
    (counts["DISTRIBUSI_KUAT"] ?? 0);

  return (
    <main className="max-w-md mx-auto p-3 space-y-4">
      {/* Hero + Ringkasan Sinyal */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h2 className="text-lg font-bold">
          <span className="text-emerald-500">Trade</span>Pulse
        </h2>
        <p className="text-xs text-neutral-500">
          Ringkasan bandarmologi{" "}
          {data?.as_of ? `· data s/d ${String(data.as_of).slice(0, 10)}` : "memuat..."}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2">
            <div className="text-emerald-400 font-bold text-lg">{accum}</div>
            <div className="text-[10px] text-neutral-400">AKUMULASI</div>
          </div>
          <div className="bg-neutral-500/10 border border-neutral-500/20 rounded-xl py-2">
            <div className="text-neutral-300 font-bold text-lg">
              {counts["NETRAL"] ?? 0}
            </div>
            <div className="text-[10px] text-neutral-400">NETRAL</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-2">
            <div className="text-red-400 font-bold text-lg">{distrib}</div>
            <div className="text-[10px] text-neutral-400">DISTRIBUSI</div>
          </div>
        </div>
      </section>

      {/* Foreign Flow 5 Hari */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
        <h3 className="text-sm font-semibold text-neutral-300 mb-2">
          🔥 Foreign Flow 5 Hari
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data?.items ?? [])
            .filter((i: any) => i.foreign_net_5d != null)
            .sort((a: any, b: any) => b.foreign_net_5d - a.foreign_net_5d)
            .slice(0, 6)
            .map((i: any) => (
              <span
                key={i.ticker}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  i.foreign_net_5d >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {i.ticker} {fmtB(i.foreign_net_5d)}
              </span>
            ))}
        </div>
      </section>

      {/* Watchlist */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-300">
          📊 Watchlist ({(data?.items ?? []).length})
        </h3>
        {error && (
          <p className="text-xs text-red-400">Gagal memuat data — cek server API.</p>
        )}
        {(data?.items ?? []).map((item: any) => (
          <TickerCard key={item.ticker} item={item} />
        ))}
        {data && (data.items ?? []).length === 0 && !error && (
          <p className="text-xs text-neutral-500">Belum ada data broker.</p>
        )}
      </section>

      {/* Quick Access */}
      <section className="pt-2 grid grid-cols-2 gap-2 text-center text-xs">
        <a
          href="/dashboard"
          className="bg-neutral-900 border border-neutral-800 rounded-xl py-3 text-neutral-300"
        >
          🖥️ Dashboard Penuh
        </a>
        <a
          href="/broker/BBCA"
          className="bg-neutral-900 border border-neutral-800 rounded-xl py-3 text-neutral-300"
        >
          🔍 Analisis BBCA
        </a>
      </section>
    </main>
  );
}
