"use client";

import { useSWRConfig } from "swr";
import { useState } from "react";
import { Icon } from "@iconify/react";

export default function RefreshButton() {
  const { mutate } = useSWRConfig();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Revalidasi cache SWR global secara background (tanpa memuat ulang halaman)
      await mutate(() => true, undefined, { revalidate: true });
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md transition-colors text-neutral-400 hover:text-white active:scale-95 disabled:opacity-50"
      title="Sinkronisasi Data Pasar"
    >
      <Icon 
        icon="ph:arrows-clockwise-duotone" 
        width="16" 
        className={refreshing ? "animate-spin text-orange-400" : ""} 
      />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
        {refreshing ? "SYNCING..." : "REFRESH"}
      </span>
    </button>
  );
}
