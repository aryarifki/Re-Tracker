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
      await fetch("/api/bandar/daily-summary?universe_mode=watchlist&refresh=1");
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
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-md transition-all text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] active:scale-95 disabled:opacity-50"
      title="Sinkronisasi Data Real-Time DB"
    >
      <Icon 
        icon="ph:arrows-clockwise-duotone" 
        width="16" 
        className={isSyncing ? "animate-spin text-[var(--md-sys-color-primary)]" : ""} 
      />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
        {isSyncing ? "Syncing..." : "Sync DB"}
      </span>
    </button>
  );
}
