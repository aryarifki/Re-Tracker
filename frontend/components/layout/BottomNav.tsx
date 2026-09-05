"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isScreener = pathname === "/screener";
  const isPortfolio = pathname === "/portfolio";
  const isSettings = pathname === "/settings";
  const isAnalysis = !isHome && !isScreener && !isPortfolio && !isSettings;

  // Pertahankan ticker yang sedang dibuka user saat klik tab Analysis
  const activeTicker = isAnalysis ? pathname.replace("/", "") : "BBCA";

  const getTheme = (active: boolean) => 
    active ? "text-orange-400" : "text-neutral-500 hover:text-neutral-300 transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#0F1117]/95 backdrop-blur-md border-t border-white/[0.05] z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2">
         <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isHome)}`}>
            <Icon icon={isHome ? "ph:binoculars-fill" : "ph:binoculars-duotone"} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Watchlist</span>
         </Link>
         
         <Link href={`/${activeTicker}`} className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isAnalysis)}`}>
            <Icon icon={isAnalysis ? "ph:chart-line-up-fill" : "ph:chart-line-up-duotone"} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Analysis</span>
         </Link>
         
         <Link href="/screener" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isScreener)}`}>
            <Icon icon={isScreener ? "ph:funnel-fill" : "ph:funnel-duotone"} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Screener</span>
         </Link>
         
         <Link href="/portfolio" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isPortfolio)}`}>
            <Icon icon={isPortfolio ? "ph:briefcase-fill" : "ph:briefcase-duotone"} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Portfolio</span>
         </Link>
      </div>
    </nav>
  );
}
