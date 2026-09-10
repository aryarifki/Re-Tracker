"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { useAppStore } from "@/store/useAppStore";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TickerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActiveTicker } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tarik data seluruh ticker dari API
  const { data: allUniverseData, isLoading: isLoadingUniverse } = useSWR("/api/bandar/universe/all", fetcher);
  const allTickers = allUniverseData?.tickers || [];

  const filteredTickers = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return [];
    return allTickers.filter((t: string) => t.includes(term)).slice(0, 10);
  }, [allTickers, searchTerm]);

  const handleSelectTicker = (t: string) => {
    setActiveTicker(t);
    setSearchTerm("");
    
    // Jika user berada di halaman Dashboard (/[ticker]), pindahkan URL-nya.
    // Jika berada di /foreign, biarkan saja halamannya memuat data baru secara otomatis.
    if (!pathname.includes("/foreign")) {
      router.push(`/${t}`);
    }
  };

  return (
    <div className="relative z-40 mb-5">
      <div className="flex items-center bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-500/30 hover:border-amber-500/60 focus-within:border-amber-500 rounded-xl px-3.5 py-2.5 shadow-[0_0_12px_rgba(245,158,11,0.08)] focus-within:shadow-[0_0_20px_rgba(245,158,11,0.22)] transition-all">
        <Icon icon="ph:magnifying-glass-duotone" className="text-amber-500/70 mr-2.5" width="18" height="18" />
        <input
          type="text"
          className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 font-mono uppercase tracking-wider"
          placeholder="Cari Ticker Saham (Contoh: BBCA)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden shadow-2xl z-50">
          {isLoadingUniverse && allTickers.length === 0 ? (
            <div className="px-4 py-3 text-xs text-neutral-500 font-mono">Memuat daftar saham bursa...</div>
          ) : filteredTickers.length > 0 ? (
            filteredTickers.map((t: string) => (
              <button
                key={t}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-neutral-300 hover:bg-neutral-800 hover:text-orange-400 transition-colors border-b border-neutral-800/40 last:border-0"
                onClick={() => handleSelectTicker(t)}
              >
                <span>{t}</span>
                <Icon icon="ph:arrow-up-right-bold" className="text-neutral-600" width="12" />
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-neutral-500 font-mono">Saham tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
