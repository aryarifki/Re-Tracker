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

  const getTheme = (active: boolean) => 
    active ? "text-orange-400 font-semibold" : "text-neutral-500 hover:text-neutral-300 transition-colors";

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#0F1117]/95 backdrop-blur-md border-t border-white/[0.05] z-50">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-1 pb-1">
         
         {/* Home */}
         <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isHome)}`}>
            <Icon icon={isHome ? "ph:house-fill" : "ph:house-duotone"} width="20" />
            <span className="text-[9px] mt-1">Home</span>
         </Link>

         {/* Dashboard (Analisis Ticker Default BBCA) */}
         <Link href="/BBCA" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isDashboard)}`}>
            <Icon icon={isDashboard ? "ph:chart-line-up-fill" : "ph:chart-line-up-duotone"} width="20" />
            <span className="text-[9px] mt-1">Dashboard</span>
         </Link>
         
         {/* Foreign */}
         <Link href="/foreign" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isForeign)}`}>
            <Icon icon={isForeign ? "ph:globe-stand-fill" : "ph:globe-stand-duotone"} width="20" />
            <span className="text-[9px] mt-1">Foreign</span>
         </Link>
         
         {/* Konglo */}
         <Link href="/konglo" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isKonglo)}`}>
            <Icon icon={isKonglo ? "ph:buildings-fill" : "ph:buildings-duotone"} width="20" />
            <span className="text-[9px] mt-1">Konglo</span>
         </Link>
         
         {/* Signal */}
         <Link href="/signal" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isSignal)}`}>
            <Icon icon={isSignal ? "ph:lightning-fill" : "ph:lightning-duotone"} width="20" />
            <span className="text-[9px] mt-1">Signal</span>
         </Link>
         
         {/* Logs Terminal */}
         <Link href="/logs" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isLogs)}`}>
            <Icon icon={isLogs ? "ph:terminal-window-fill" : "ph:terminal-window-duotone"} width="20" />
            <span className="text-[9px] mt-1">Logs</span>
         </Link>
         
      </div>
    </nav>
  );
}
