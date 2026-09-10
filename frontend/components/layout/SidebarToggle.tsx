"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useAppStore } from "@/store/useAppStore";

export default function SidebarToggle() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  
  return (
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="lg:hidden p-1.5 mr-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white transition-colors focus:outline-none"
    >
      <Icon icon="ph:list" width="20" />
    </button>
  );
}
