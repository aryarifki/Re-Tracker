"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  // Deteksi rute aktif
  const isHome = pathname === "/";
  const isScreener = pathname === "/screener";
  const isPortfolio = pathname === "/portfolio";
  const isSettings = pathname === "/settings";
  // Jika tidak berada di rute-rute utama di atas, kita asumsikan sedang berada di rute dinamis Analysis (/[ticker])
  const isAnalysis = !isHome && !isScreener && !isPortfolio && !isSettings;

  const getTheme = (active: boolean) => 
    active ? "text-orange-400" : "text-neutral-500 hover:text-neutral-300 transition-colors";
  
  const getIcon = (active: boolean, iconActive: string, iconInactive: string) =>
    active ? iconActive : iconInactive;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#0F1117]/95 backdrop-blur-md border-t border-white/[0.05] z-50">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2 pb-1">
         
         <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isHome)}`}>
            <Icon icon={getIcon(isHome, "ph:binoculars-fill", "ph:binoculars-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Watchlist</span>
         </Link>
         
         <Link href="/BBCA" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isAnalysis)}`}>
            <Icon icon={getIcon(isAnalysis, "ph:magnifying-glass-fill", "ph:magnifying-glass-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Analysis</span>
         </Link>
         
         <Link href="/screener" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isScreener)}`}>
            <Icon icon={getIcon(isScreener, "ph:funnel-fill", "ph:funnel-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Screener</span>
         </Link>
         
         <Link href="/portfolio" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isPortfolio)}`}>
            <Icon icon={getIcon(isPortfolio, "ph:briefcase-fill", "ph:briefcase-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Portfolio</span>
         </Link>
         
         <Link href="/settings" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isSettings)}`}>
            <Icon icon={getIcon(isSettings, "ph:gear-fill", "ph:gear-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Settings</span>
         </Link>
         
      </div>
    </nav>
  );
}
