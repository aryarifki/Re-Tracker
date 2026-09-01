"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Icon } from "@iconify/react";
import TickerCard from "@/components/home/TickerCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const LS_KEY = "tradepulse_watchlist";

export default function HomeMobile() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/bandar/daily-summary?universe_mode=all",
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: false }
  );

  const counts = data?.signal_counts ?? {};

  const accum =
    (counts["ACCUMULATION"] ?? 0) + (counts["AKUMULASI"] ?? 0) +
    (counts["STRONG_ACCUMULATION"] ?? 0) + (counts["AKUMULASI_KUAT"] ?? 0);

  const distrib =
    (counts["DISTRIBUTION"] ?? 0) + (counts["DISTRIBUSI"] ?? 0) +
    (counts["STRONG_DISTRIBUTION"] ?? 0) + (counts["DISTRIBUSI_KUAT"] ?? 0);

  const items = data?.items ?? [];

  // Watchlist (localStorage)
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
    saveList(myList.filter((t) => t !== ticker));
  }

  const byTicker = useMemo(() => {
    const m: Record<string, any> = {};
    items.forEach((i: any) => { m[i.ticker] = i; });
    return m;
  }, [items]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const q = query.toUpperCase();
    return items.filter((i: any) => i.ticker.includes(q)).slice(0, 8);
  }, [query, items]);

  const shown = useMemo(() => {
    if (!loaded) return items.slice(0, 10);
    if (myList.length === 0) return items.slice(0, 10);
    return myList.filter((t) => byTicker[t]).map((t) => byTicker[t]);
  }, [loaded, myList, byTicker, items]);

  return (
    <main className="max-w-xl mx-auto p-4 md:p-6 space-y-8 min-h-[100dvh] bg-[#0a0a0a] text-neutral-200 selection:bg-blue-500/30">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-neutral-800/80">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Icon icon="ph:trend-up-duotone" className="text-emerald-400" width="20" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400/80">SM Tracker</span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight leading-none">Market Overview</h1>
            <p className="text-sm text-neutral-500 mt-2 flex items-center gap-1.5">
                Macro sentiment index 
                <span className="w-1 h-1 rounded-full bg-neutral-600"></span> 
                {data?.as_of ? String(data.as_of).slice(0, 10) : "Loading data..."}
            </p>
        </div>

        <button 
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] hover:bg-neutral-800 active:scale-[0.98] border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-medium text-neutral-300 transition-all disabled:opacity-50"
        >
            <Icon icon={isValidating ? "ph:spinner-gap-duotone" : "ph:arrows-clockwise-duotone"} className={isValidating ? "animate-spin text-neutral-400" : "text-neutral-400"} />
            {isValidating ? "Syncing" : "Refresh"}
        </button>
      </header>

      {/* DASHBOARD WIDGETS */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-[#141417] border border-emerald-500/20 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                <Icon icon="ph:trend-up-bold" width="16" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Accumulation</span>
            </div>
            <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                {isLoading && !data ? "--" : accum}
            </div>
        </div>

        <div className="bg-[#141417] border border-neutral-700/50 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-1.5 mb-2 text-neutral-400">
                <Icon icon="ph:minus-circle-bold" width="16" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Neutral</span>
            </div>
            <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                {isLoading && !data ? "--" : ((counts["NETRAL"] ?? 0) + (counts["NEUTRAL"] ?? 0))}
            </div>
        </div>

        <div className="bg-[#141417] border border-rose-500/20 rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-1.5 mb-2 text-rose-400">
                <Icon icon="ph:trend-down-bold" width="16" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Distribution</span>
            </div>
            <div className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                {isLoading && !data ? "--" : distrib}
            </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="grid grid-cols-1 gap-3">
        <Link href="/BBCA" className="group flex items-center justify-center gap-2 bg-[#141417] border border-neutral-800 hover:border-indigo-500/40 rounded-xl py-3.5 text-sm font-medium text-neutral-300 transition-all active:scale-[0.98] shadow-sm">
          <Icon icon="ph:magnifying-glass-duotone" className="text-indigo-400 group-hover:scale-110 transition-transform" width="18" />
          Ticker Analysis
        </Link>
      </section>

      {/* WATCHLIST SECTION */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
             <Icon icon="ph:binoculars-duotone" className="text-neutral-400" width="20" />
             Watchlist
             <span className="text-xs font-normal text-neutral-500 ml-1">
               {shown.length} {loaded && myList.length > 0 ? "" : `of ${items.length}`}
             </span>
          </h3>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors active:scale-[0.98] ${
              editing
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-[#141417] text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
            }`}
          >
            <Icon icon={editing ? "ph:check-bold" : "ph:pencil-simple-duotone"} />
            {editing ? "Done" : "Edit List"}
          </button>
        </div>

        {editing && (
          <div className="bg-[#141417] border border-neutral-800/80 rounded-xl p-5 space-y-4 shadow-md">
            <p className="text-xs text-neutral-400">
              Search and select tickers to build your personal watchlist.
            </p>
            <div className="relative">
                <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" width="16" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ticker (e.g. BBCA)..."
                    className="w-full bg-[#0a0a0a] border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all uppercase"
                />
            </div>
            
            {query && (
                <div className="flex flex-wrap gap-2 pt-1">
                {searchResults.map((i: any) => {
                    const added = myList.includes(i.ticker);
                    return (
                    <button
                        key={i.ticker}
                        onClick={() => addTicker(i.ticker)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-medium transition-all active:scale-[0.98] ${
                        added
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 opacity-60 cursor-default"
                            : "bg-[#0a0a0a] text-neutral-300 border-neutral-700 hover:border-blue-500/50 hover:bg-blue-500/10"
                        }`}
                    >
                        <Icon icon={added ? "ph:check-bold" : "ph:plus-bold"} width="12" />
                        {i.ticker}
                    </button>
                    );
                })}
                {searchResults.length === 0 && <span className="text-xs text-neutral-500">No tickers found.</span>}
                </div>
            )}
            
            {myList.length > 0 && (
              <div className="pt-3 mt-3 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Your tracking list: <span className="text-neutral-300 font-medium">{myList.join(", ")}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-center gap-2"><Icon icon="ph:warning-circle-duotone" width="18"/> Connection error.</div>}

        <div className="grid gap-3">
            {shown.map((item: any) => (
            <TickerCard
                key={item.ticker}
                item={item}
                onRemove={editing && myList.length > 0 ? removeTicker : undefined}
            />
            ))}
        </div>

        {data && items.length === 0 && !error && (
          <div className="py-12 flex flex-col items-center justify-center text-neutral-500">
             <Icon icon="ph:ghost-duotone" width="32" className="mb-3 opacity-50" />
             <p className="text-sm">No market data available.</p>
          </div>
        )}
      </section>
    </main>
  );
}
