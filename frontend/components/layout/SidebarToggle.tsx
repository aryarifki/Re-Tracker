"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useAppStore } from "@/store/useAppStore";

export default function SidebarToggle() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  
  return (
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="lg:hidden p-1.5 mr-2 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors focus:outline-none"
    >
      <Icon icon="ph:list" width="20" />
    </button>
  );
}
