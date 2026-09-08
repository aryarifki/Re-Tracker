"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Icon } from "@iconify/react";

export default function RefreshButton() {
  const { mutate } = useSWRConfig();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // Panggil endpoint refresh database tanpa reload browser
      await fetch("/api/bandar/daily-summary?universe_mode=watchlist&refresh=1");
      // Revalidasi semua cache SWR di halaman
      await mutate(() => true, undefined, { revalidate: true });
    } catch (e) {
      console.error("Gagal sinkronisasi data:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md transition-all text-neutral-400 hover:text-white active:scale-95 disabled:opacity-50"
      title="Sinkronisasi Data Real-Time DB"
    >
      <Icon 
        icon="ph:arrows-clockwise-duotone" 
        width="16" 
        className={isSyncing ? "animate-spin text-orange-400" : ""} 
      />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
        {isSyncing ? "Syncing..." : "Sync DB"}
      </span>
    </button>
  );
}
