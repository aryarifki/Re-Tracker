"use client";

import { Icon } from "@iconify/react";

export default function RefreshButton() {
  const handleRefresh = () => {
    // Memaksa browser memuat ulang halaman untuk mereset cache state dan menarik data DB terbaru
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md transition-colors text-neutral-400 hover:text-white active:scale-95"
      title="Refresh Data & Connection"
    >
      <Icon icon="ph:arrows-clockwise-duotone" width="16" />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">Refresh</span>
    </button>
  );
}
