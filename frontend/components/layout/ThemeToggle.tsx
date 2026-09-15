"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAppStore } from "@/store/useAppStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  // Menerapkan tema ke elemen HTML (document.documentElement)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-full transition-all duration-300 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] active:scale-95"
      title={`Beralih ke Mode ${theme === "dark" ? "Terang" : "Gelap"}`}
    >
      <Icon 
        icon={theme === "dark" ? "ph:sun-duotone" : "ph:moon-duotone"} 
        width="18" 
      />
    </button>
  );
}
