"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  const pathname = usePathname();

  // Logika rute aktif yang baru
  const isDashboard = pathname === "/" || (!pathname.includes("/foreign") && !pathname.includes("/konglo") && !pathname.includes("/signal") && !pathname.includes("/settings"));
  const isForeign = pathname.includes("/foreign");
  const isKonglo = pathname.includes("/konglo");
  const isSignal = pathname.includes("/signal");
  const isSettings = pathname.includes("/settings");

  const getTheme = (active: boolean) => 
    active ? "text-orange-400" : "text-neutral-500 hover:text-neutral-300 transition-colors";
  
  const getIcon = (active: boolean, iconActive: string, iconInactive: string) =>
    active ? iconActive : iconInactive;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#0F1117]/95 backdrop-blur-md border-t border-white/[0.05] z-50">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2 pb-1">
         
         <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isDashboard)}`}>
            <Icon icon={getIcon(isDashboard, "ph:squares-four-fill", "ph:squares-four-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Dashboard</span>
         </Link>
         
         <Link href="/foreign" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isForeign)}`}>
            <Icon icon={getIcon(isForeign, "ph:globe-stand-fill", "ph:globe-stand-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Foreign</span>
         </Link>
         
         <Link href="/konglo" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isKonglo)}`}>
            <Icon icon={getIcon(isKonglo, "ph:buildings-fill", "ph:buildings-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Konglo</span>
         </Link>
         
         <Link href="/signal" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isSignal)}`}>
            <Icon icon={getIcon(isSignal, "ph:lightning-fill", "ph:lightning-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Signal</span>
         </Link>
         
         <Link href="/settings" className={`flex flex-col items-center justify-center w-full h-full ${getTheme(isSettings)}`}>
            <Icon icon={getIcon(isSettings, "ph:gear-fill", "ph:gear-duotone")} width="22" />
            <span className="text-[9px] mt-1 font-semibold">Setting</span>
         </Link>
         
      </div>
    </nav>
  );
}
