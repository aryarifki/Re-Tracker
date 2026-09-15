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
      className={`flex flex-col items-center justify-center select-none font-mono transition-colors duration-300 ${
        fullScreen
          ? "fixed inset-0 z-50 bg-[var(--md-sys-color-surface)]"
          : "min-h-[calc(100vh-16rem)] w-full"
      }`}
    >
      <div 
        className="relative w-28 h-28 mb-5 animate-pulse"
        style={{ filter: "drop-shadow(0 0 20px var(--md-sys-color-primary))" }}
      >
        <Image 
          src="/logo.png" 
          alt="InvestOwl Logo" 
          fill 
          sizes="112px"
          className="object-contain" 
          priority 
        />
      </div>

      <div className="text-xs font-bold tracking-[0.3em] uppercase animate-pulse text-[var(--md-sys-color-primary)]">
        {title}
      </div>
      {subtitle && (
        <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-2 tracking-widest">
          {subtitle}
        </div>
      )}
    </div>
  );
}
