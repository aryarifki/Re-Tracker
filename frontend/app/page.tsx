"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import TickerCard from "@/components/home/TickerCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const LS_KEY = "tradepulse_watchlist";

/* =========================================================
   WATCHLIST FETCHER (LAZY LOAD PER TICKER)
========================================================= */
function WatchlistFetcher({ ticker, onRemove }: { ticker: string; onRemove?: (t: string) => void }) {
  const { data, isLoading, error } = useSWR(`/api/bandar/detail/${ticker}?window_days=20`, fetcher, { revalidateOnFocus: false });

  if (isLoading) return (
     <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between h-[80px] animate-pulse shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-12 h-5 bg-[#08090C] rounded-md"></div>
            <div className="w-16 h-4 bg-[#08090C] rounded-md"></div>
        </div>
        <div className="w-16 h-6 bg-[#08090C] rounded-md"></div>
     </div>
  );
  
  if (error || data?.error) return null;

  const item = {
    ticker: data.ticker,
    signal: data.signal_raw || data.signal,
    close: data.close,
    ret_5d: data.ret_5d,
    foreign_net_5d: data.foreign_5d,
    spark: data.price_chart?.slice(-20).map((d: any) => d.close) || []
  };

  return <TickerCard item={item} onRemove={onRemove} />;
}

/* =========================================================
   MAIN HOME PAGE
========================================================= */
export default function HomeMobile() {
  const [booted, setBooted] = useState(false);
  const [myList, setMyList] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  // Terminal Boot Animation
  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Load Watchlist from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
         const parsed = JSON.parse(saved);
         setMyList(parsed.length > 0 ? parsed : ["BBCA", "ASII"]);
      } else {
         setMyList(["BBCA", "BMRI", "GOTO"]);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Fetch lightweight Universe for Search Autocomplete
  const { data: universeData } = useSWR("/api/bandar/universe/all", fetcher, { revalidateOnFocus: false });
  const allTickers = universeData?.tickers || [];

  // Fetch Proxy Date (BBCA) untuk Status Indikator yang Super Cepat
  const { data: dateData } = useSWR("/api/bandar/dates/BBCA", fetcher, { revalidateOnFocus: false });
  const latestDate = dateData?.dates?.[dateData.dates.length - 1] || "SYNCING...";

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

  const searchResults = useMemo(() => {
    if (!query) return [];
    const q = query.toUpperCase();
    return allTickers.filter((t: string) => t.includes(q)).slice(0, 8);
  }, [query, allTickers]);

  if (!booted) {
    return (
      <div className="min-h-[100dvh] bg-[#08090C] flex flex-col items-center justify-center text-orange-400 font-mono selection:bg-transparent">
        <div className="relative w-28 h-28 mb-5 animate-pulse drop-shadow-[0_0_20px_rgba(251,146,60,0.3)]">
          <Image 
            src="/logo.png" 
            alt="InvestOwl Logo" 
            fill 
            className="object-contain" 
            priority 
          />
        </div>
        <div className="text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Initializing System</div>
        <div className="text-[10px] text-orange-400/50 mt-2 tracking-widest">Loading InvestOwl Engine...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#08090C] text-neutral-200 selection:bg-blue-500/30">
      <main className="max-w-xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        
        {/* HEADER SECTION */}
        <header className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <div className="relative w-5 h-5">
                      <Image src="/logo.png" alt="InvestOwl" fill className="object-contain" priority />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-400/90">InvestOwl</span>
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight leading-none">IDX Terminal</h1>
          </div>
          <div className="text-right flex flex-col items-end">
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  ONLINE <span className="text-neutral-500 mx-0.5">•</span> {latestDate}
              </div>
          </div>
        </header>

        {/* INTRO & AUTHOR CARD */}
        <section className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-4 relative overflow-hidden shadow-sm">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 opacity-80"></div>
           <div className="flex items-center gap-2 mb-3">
               <Icon icon="ph:info-duotone" className="text-blue-400" width="18" />
               <h2 className="text-sm font-semibold text-neutral-100">Quant Flow Architecture</h2>
           </div>
           <p className="text-[11px] text-neutral-400 leading-relaxed mb-4 text-justify">
             Platform analisis kuantitatif kelas institusional untuk Bursa Efek Indonesia. Dirancang untuk melacak jejak <i>Smart Money</i>, kausalitas broker, dan memvalidasi rekam jejak akumulasi secara historis guna mengidentifikasi fase awal sebelum <i>price breakout</i>.
           </p>
           
           <div className="flex items-center justify-between border-t border-white/[0.05] pt-3 mt-1">
             <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
               <Icon icon="ph:terminal-duotone" width="14" /> Author: <span className="text-neutral-300 font-semibold">arya rifky</span>
             </div>
             <a 
               href="https://www.instagram.com/rifqiaarya?igsi=bzJzbzZhZW1qanFr" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md"
             >
               <Icon icon="ph:instagram-logo-duotone" width="14" /> @rifqiaarya
             </a>
           </div>
        </section>

        {/* WATCHLIST SECTION */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
               <Icon icon="ph:binoculars-duotone" className="text-neutral-400" width="18" />
               Active Watchlist
               <span className="text-[10px] font-mono text-neutral-500 ml-1 bg-[#0F1117] border border-white/[0.05] px-1.5 py-0.5 rounded">
                 {myList.length} ASSETS
               </span>
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors active:scale-[0.98] ${
                editing
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-[#0F1117] text-neutral-400 border-white/[0.07] hover:border-white/[0.15] hover:text-neutral-200"
              }`}
            >
              <Icon icon={editing ? "ph:check-bold" : "ph:pencil-simple-duotone"} />
              {editing ? "Done" : "Edit List"}
            </button>
          </div>

          {editing && (
            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-4 space-y-3 shadow-md">
              <div className="relative">
                  <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" width="16" />
                  <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search ticker (e.g. BBCA)..."
                      className="w-full bg-[#08090C] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500/50 uppercase font-mono placeholder:normal-case placeholder:font-sans"
                  />
              </div>
              
              {query && (
                  <div className="flex flex-wrap gap-2 pt-1">
                  {searchResults.map((t: string) => {
                      const added = myList.includes(t);
                      return (
                      <button
                          key={t}
                          onClick={() => addTicker(t)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-bold font-mono transition-all active:scale-[0.98] ${
                          added
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 opacity-60 cursor-default"
                              : "bg-[#08090C] text-neutral-300 border-white/[0.07] hover:border-blue-500/50 hover:text-blue-400"
                          }`}
                      >
                          <Icon icon={added ? "ph:check-bold" : "ph:plus-bold"} width="12" />
                          {t}
                      </button>
                      );
                  })}
                  {searchResults.length === 0 && <span className="text-xs text-neutral-500 italic">No tickers found.</span>}
                  </div>
              )}
            </div>
          )}

          <div className="grid gap-3">
              {loaded && myList.map((ticker) => (
                 <WatchlistFetcher 
                    key={ticker} 
                    ticker={ticker} 
                    onRemove={editing ? removeTicker : undefined} 
                 />
              ))}
          </div>

          {loaded && myList.length === 0 && (
            <div className="py-10 flex flex-col items-center justify-center text-neutral-500 bg-[#0F1117] border border-white/[0.07] rounded-xl">
               <Icon icon="ph:ghost-duotone" width="32" className="mb-2 opacity-50" />
               <p className="text-xs">Your watchlist is empty.</p>
            </div>
          )}
        </section>
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0F1117]/95 backdrop-blur-md border-t border-white/[0.05] z-50">
        <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2 pb-1">
           {/* 1. Watchlist (Active) */}
           <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-orange-400">
              <Icon icon="ph:binoculars-fill" width="22" />
              <span className="text-[9px] mt-1 font-semibold">Watchlist</span>
           </Link>
           
           {/* 2. Analysis */}
           <Link href="/BBCA" className="flex flex-col items-center justify-center w-full h-full text-neutral-500 hover:text-neutral-300 transition-colors">
              <Icon icon="ph:magnifying-glass-duotone" width="22" />
              <span className="text-[9px] mt-1 font-medium">Analysis</span>
           </Link>
           
           {/* 3. Screener */}
           <button className="flex flex-col items-center justify-center w-full h-full text-neutral-500 hover:text-neutral-300 transition-colors">
              <Icon icon="ph:funnel-duotone" width="22" />
              <span className="text-[9px] mt-1 font-medium">Screener</span>
           </button>
           
           {/* 4. Portfolio */}
           <button className="flex flex-col items-center justify-center w-full h-full text-neutral-500 hover:text-neutral-300 transition-colors">
              <Icon icon="ph:briefcase-duotone" width="22" />
              <span className="text-[9px] mt-1 font-medium">Portfolio</span>
           </button>
           
           {/* 5. Settings */}
           <button className="flex flex-col items-center justify-center w-full h-full text-neutral-500 hover:text-neutral-300 transition-colors">
              <Icon icon="ph:gear-duotone" width="22" />
              <span className="text-[9px] mt-1 font-medium">Settings</span>
           </button>
        </div>
      </nav>
    </div>
  );
}
