"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import TickerCard from "@/components/home/TickerCard";
import InvestOwlLoader from "@/components/ui/InvestOwlLoader";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const LS_KEY = "tradepulse_watchlist";

function WatchlistFetcher({ ticker, onRemove }: { ticker: string; onRemove?: (t: string) => void }) {
  const { data, isLoading, error } = useSWR(`/api/bandar/detail/${ticker}?window_days=20`, fetcher, { revalidateOnFocus: false });

  if (isLoading) return (
     <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 h-[84px] flex flex-col justify-between animate-pulse shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-12 h-5 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
                <div className="w-20 h-4 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
            </div>
            <div className="w-16 h-6 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]/50 pt-2">
            <div className="w-10 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
            <div className="w-12 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
            <div className="w-12 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
        </div>
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

export default function HomeMobile() {
  const [booted, setBooted] = useState(false);
  const [myList, setMyList] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  const { data: dateData } = useSWR("/api/bandar/dates/BBCA", fetcher, { revalidateOnFocus: false });
  const latestDate = dateData?.dates?.[dateData.dates.length - 1] || "SYNCING...";

  const { data: universeData } = useSWR("/api/bandar/universe/all", fetcher, { revalidateOnFocus: false });
  const allTickers = universeData?.tickers || [];

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
      <InvestOwlLoader 
        title="INITIALIZING SYSTEM" 
        subtitle="Loading InvestOwl Engine..." 
        fullScreen={true} 
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] selection:bg-[var(--md-sys-color-primary-container)] transition-colors duration-300">
      {/* DIUBAH DARI max-w-xl MENJADI max-w-7xl AGAR RESPONSIF DI DESKTOP */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-6">
        
        <header className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
          <div>
              <h1 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight leading-none">IDX Terminal</h1>
              <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1.5 uppercase tracking-wider">System Dashboard</div>
          </div>
          <div className="text-right flex flex-col items-end">
              <div className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono border px-2 py-1 rounded" style={{ color: "var(--color-positive)", borderColor: "var(--color-positive)", backgroundColor: "var(--md-sys-color-surface-container)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-positive)" }}></span>
                  ONLINE <span className="text-[var(--md-sys-color-on-surface-variant)] mx-0.5">•</span> {latestDate}
              </div>
          </div>
        </header>

        <section className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-4 relative overflow-hidden shadow-sm transition-colors duration-300 max-w-xl">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--md-sys-color-primary)] opacity-80"></div>
           <div className="flex items-center gap-2 mb-3">
               <Icon icon="ph:info-duotone" className="text-[var(--md-sys-color-primary)]" width="18" />
               <h2 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Quant Flow Architecture</h2>
           </div>
           <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mb-4 text-justify">
             Platform analisis kuantitatif kelas institusional untuk Bursa Efek Indonesia. Dirancang untuk melacak jejak <i>Smart Money</i>, kausalitas broker, dan memvalidasi rekam jejak akumulasi secara historis guna mengidentifikasi fase awal sebelum <i>price breakout</i>.
           </p>
           
           <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)] pt-3 mt-1">
             <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
               <Icon icon="ph:terminal-duotone" width="14" /> Author: <span className="text-[var(--md-sys-color-on-surface)] font-semibold">arya rifky</span>
             </div>
             <a 
               href="https://www.instagram.com/rifqiaarya?igsi=bzJzbzZhZW1qanFr" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="flex items-center gap-1.5 text-[10px] font-mono hover:opacity-80 transition-opacity px-2.5 py-1 rounded-md border"
               style={{ color: "var(--color-negative)", borderColor: "var(--color-negative)", backgroundColor: "var(--md-sys-color-surface)" }}
             >
               <Icon icon="ph:instagram-logo-duotone" width="14" /> @rifqiaarya
             </a>
           </div>
        </section>

        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
               <Icon icon="ph:binoculars-duotone" className="text-[var(--md-sys-color-on-surface-variant)]" width="18" />
               Active Watchlist
               <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] ml-1 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] px-1.5 py-0.5 rounded">
                 {myList.length} ASSETS
               </span>
            </h3>
            <button
              onClick={() => setEditing(!editing)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors active:scale-[0.98] ${
                editing
                  ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]"
                  : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]"
              }`}
            >
              <Icon icon={editing ? "ph:check-bold" : "ph:pencil-simple-duotone"} />
              {editing ? "Done" : "Edit List"}
            </button>
          </div>

          {editing && (
            <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-primary)] rounded-xl p-4 space-y-3 shadow-md transition-colors max-w-xl">
              <div className="relative">
                  <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-primary)]" width="16" />
                  <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search ticker (e.g. BBCA)..."
                      className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] uppercase font-mono placeholder:normal-case placeholder:font-sans transition-colors"
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
                              ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] opacity-60 cursor-default"
                              : "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)]"
                          }`}
                      >
                          <Icon icon={added ? "ph:check-bold" : "ph:plus-bold"} width="12" />
                          {t}
                      </button>
                      );
                  })}
                  {searchResults.length === 0 && <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic">No tickers found.</span>}
                  </div>
              )}
            </div>
          )}

          {/* GRID RESPONSIVE: Ditambahkan sm:grid-cols-2 lg:grid-cols-3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!loaded ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 h-[84px] flex flex-col justify-between animate-pulse shadow-sm">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <div className="w-12 h-5 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
                              <div className="w-20 h-4 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
                          </div>
                          <div className="w-16 h-6 bg-[var(--md-sys-color-surface-container-highest)] rounded-md"></div>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]/50 pt-2">
                          <div className="w-10 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
                          <div className="w-12 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
                          <div className="w-12 h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-sm"></div>
                      </div>
                  </div>
                ))
              ) : (
                myList.map((ticker) => (
                   <WatchlistFetcher 
                      key={ticker} 
                      ticker={ticker} 
                      onRemove={editing ? removeTicker : undefined} 
                   />
                ))
              )}
          </div>

          {loaded && myList.length === 0 && (
            <div className="py-10 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl transition-colors max-w-xl">
               <Icon icon="ph:ghost-duotone" width="32" className="mb-2 opacity-50" />
               <p className="text-xs">Your watchlist is empty.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
