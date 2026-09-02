"use client";

import Image from "next/image";

interface LoaderProps {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export default function InvestOwlLoader({
  title = "INITIALIZING SYSTEM",
  subtitle = "Loading InvestOwl Engine...",
  fullScreen = false,
}: LoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center select-none text-orange-400 font-mono ${
        fullScreen
          ? "fixed inset-0 z-50 bg-[#08090C]"
          : "min-h-[calc(100vh-16rem)] w-full"
      }`}
    >
      {/* Container Logo - Di-copy persis dari page_2.tsx (Home) baris 108 */}
      <div className="relative w-28 h-28 mb-5 animate-pulse drop-shadow-[0_0_20px_rgba(251,146,60,0.3)]">
        <Image 
          src="/logo.png" 
          alt="InvestOwl Logo" 
          fill 
          sizes="112px"
          className="object-contain" 
          priority 
        />
      </div>

      {/* Tipografi Terminal - Di-copy persis dari page_2.tsx (Home) baris 111-112 */}
      <div className="text-xs font-bold tracking-[0.3em] uppercase animate-pulse">
        {title}
      </div>
      {subtitle && (
        <div className="text-[10px] text-orange-400/50 mt-2 tracking-widest">
          {subtitle}
        </div>
      )}
    </div>
  );
}
