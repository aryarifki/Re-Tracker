"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import TickerCard from "@/components/home/TickerCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const LS_KEY = "tradepulse_watchlist";

export default function HomeMobile() {
  const { data, error } = useSWR(
    "/api/bandar/daily-summary?universe_mode=all",
    fetcher,
    { refreshInterval: 60000 }
  );

  const counts = data?.signal_counts ?? {};

  const accum =
    (counts["ACCUMULATION"] ?? 0) + (counts["AKUMULASI"] ?? 0) +
    (counts["STRONG_ACCUMULATION"] ?? 0) + (counts["AKUMULASI_KUAT"] ?? 0);

  const distrib =
    (counts["DISTRIBUTION"] ?? 0) + (counts["DISTRIBUSI"] ?? 0) +
    (counts["STRONG_DISTRIBUTION"] ?? 0) + (counts["DISTRIBUSI_KUAT"] ?? 0);

  const items = data?.items ?? [];

  // ── Kustomisasi watchlist (localStorage) ──
  const [myList, setMyList] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(function () {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setMyList(JSON.parse(saved));
    } catch (e) {}
    setLoaded(true);
  }, []);

  function saveList(list: string[]) {
    setMyList(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function addTicker(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (t && !myList.includes(t)) saveList([...myList, t]);
    setQuery("");
  }

  function removeTicker(ticker: string) {
    saveList(myList.filter(function (t) { return t !== ticker; }));
  }

  const byTicker = useMemo(function () {
    const m: Record<string, any> = {};
    items.forEach(function (i: any) { m[i.ticker] = i; });
    return m;
  }, [items]);

  const searchResults = useMemo(function () {
    if (!query) return [];
    const q = query.toUpperCase();
    return items
      .filter(function (i: any) { return i.ticker.indexOf(q) !== -1; })
      .slice(0, 8);
  }, [query, items]);

  const shown = useMemo(function () {
    if (!loaded) return items.slice(0, 10);
    if (myList.length === 0) return items.slice(0, 10);
    return myList
      .filter(function (t) { return byTicker[t]; })
      .map(function (t) { return byTicker[t]; });
  }, [loaded, myList, byTicker, items]);

  return (
    <main className="max-w-md mx-auto p-3 space-y-4">
      {/* Hero: Dashboard */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <p className="text-xs text-neutral-500">
          Ringkasan bandarmologi{" "}
          {data?.as_of ? "· data s/d " + String(data.as_of).slice(0, 10) : "memuat..."}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2">
            <div className="text-emerald-400 font-bold text-lg">{accum}</div>
            <div className="text-[10px] text-neutral-400">AKUMULASI</div>
          </div>
          <div className="bg-neutral-500/10 border border-neutral-500/20 rounded-xl py-2">
            <div className="text-neutral-300 font-bold text-lg">{(counts["NETRAL"] ?? 0) + (counts["NEUTRAL"] ?? 0)}</div>
            <div className="text-[10px] text-neutral-400">NETRAL</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-2">
            <div className="text-red-400 font-bold text-lg">{distrib}</div>
            <div className="text-[10px] text-neutral-400">DISTRIBUSI</div>
          </div>
        </div>
      </section>

      {/* Navigasi View */}
      <section className="grid grid-cols-2 gap-2 text-center text-sm">
        <a href="/dashboard" className="bg-neutral-900 border border-neutral-800 rounded-xl py-3 text-neutral-200 active:border-emerald-500/50">
          📈 View Dashboard
        </a>
        <a href="/broker/BBCA" className="bg-neutral-900 border border-neutral-800 rounded-xl py-3 text-neutral-200 active:border-emerald-500/50">
          🔍 View Analisis
        </a>
      </section>

      {/* Watchlist kustom */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-300">
            📊 Watchlist ({shown.length}{loaded && myList.length > 0 ? "" : " / " + items.length})
          </h3>
          <button
            onClick={function () { setEditing(!editing); }}
            className={"text-xs px-3 py-1 rounded-lg border " +
              (editing
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-neutral-900 text-neutral-400 border-neutral-800")}
          >
            {editing ? "Selesai" : "✏️ Kustom"}
          </button>
        </div>

        {editing && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
            <p className="text-xs text-neutral-400">
              Cari & ketuk untuk menambah ke watchlist Anda (tersimpan di perangkat ini):
            </p>
            <input
              value={query}
              onChange={function (e) { setQuery(e.target.value); }}
              placeholder="Ketik kode ticker, mis. BBCA..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-emerald-500/50"
            />
            <div className="flex flex-wrap gap-2">
              {searchResults.map(function (i: any) {
                const added = myList.indexOf(i.ticker) !== -1;
                return (
                  <button
                    key={i.ticker}
                    onClick={function () { addTicker(i.ticker); }}
                    className={"text-xs px-2 py-1 rounded-lg border " +
                      (added
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-neutral-800 text-neutral-300 border-neutral-700")}
                  >
                    {added ? "✓ " : "+ "}{i.ticker}
                  </button>
                );
              })}
            </div>
            {myList.length > 0 && (
              <p className="text-[10px] text-neutral-500">
                Watchlist Anda: {myList.join(", ")} — ketuk ✏️ lalu × pada kartu untuk menghapus.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400">Gagal memuat data — cek server API.</p>}

        {shown.map(function (item: any) {
          return (
            <TickerCard
              key={item.ticker}
              item={item}
              onRemove={editing && myList.length > 0 ? removeTicker : undefined}
            />
          );
        })}

        {data && items.length === 0 && !error && (
          <p className="text-xs text-neutral-500">Belum ada data broker.</p>
        )}
      </section>
    </main>
  );
}
