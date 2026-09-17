"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isDashboard = !isHome && !pathname.includes("/foreign") && !pathname.includes("/konglo") && !pathname.includes("/signal") && !pathname.includes("/logs");
  const isForeign = pathname.includes("/foreign");
  const isKonglo = pathname.includes("/konglo");
  const isSignal = pathname.includes("/signal");
  const isLogs = pathname.includes("/logs");

  // Fungsi pembantu untuk indikator kapsul MD3 pada ikon
  const getIconWrapper = (active: boolean) =>
    active
      ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] px-4 py-1 rounded-full transition-all duration-300"
      : "text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] px-4 py-1 rounded-full transition-all duration-300 bg-transparent";

  // Fungsi pembantu untuk ketebalan teks
  const getTextTheme = (active: boolean) =>
    active
      ? "text-[10px] font-bold text-[var(--md-sys-color-on-surface)] mt-1 transition-all"
      : "text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] mt-1 transition-all";

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[var(--md-sys-color-surface-container)]/95 backdrop-blur-md border-t border-[var(--md-sys-color-outline-variant)] z-50 transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-1 pb-1">
         
         <Link href="/" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isHome)}>
              <Icon icon={isHome ? "ph:house-fill" : "ph:house-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isHome)}>Home</span>
         </Link>

         <Link href="/BBCA" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isDashboard)}>
              <Icon icon={isDashboard ? "ph:chart-line-up-fill" : "ph:chart-line-up-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isDashboard)}>Dashboard</span>
         </Link>
         
         <Link href="/foreign" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isForeign)}>
              <Icon icon={isForeign ? "ph:globe-stand-fill" : "ph:globe-stand-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isForeign)}>Foreign</span>
         </Link>
         
         <Link href="/konglo" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isKonglo)}>
              <Icon icon={isKonglo ? "ph:buildings-fill" : "ph:buildings-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isKonglo)}>Konglo</span>
         </Link>
         
         <Link href="/signal" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isSignal)}>
              <Icon icon={isSignal ? "ph:lightning-fill" : "ph:lightning-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isSignal)}>Signal</span>
         </Link>
         
         <Link href="/logs" className="group flex flex-col items-center justify-center w-full h-full">
            <div className={getIconWrapper(isLogs)}>
              <Icon icon={isLogs ? "ph:terminal-window-fill" : "ph:terminal-window-duotone"} width="22" />
            </div>
            <span className={getTextTheme(isLogs)}>Logs</span>
         </Link>
         
      </div>
    </nav>
  );
}
