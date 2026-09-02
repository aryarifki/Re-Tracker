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
      className={`flex flex-col items-center justify-center select-none ${
        fullScreen
          ? "fixed inset-0 z-50 bg-[#08090C]"
          : "min-h-[65vh] w-full"
      }`}
    >
      {/* Container Logo dengan efek breathing pulse persis di gambar */}
      <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
        <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 animate-pulse" style={{ animationDuration: "2s" }}>
          <Image
            src="/logo.png"
            alt="InvestOwl Logo"
            fill
            sizes="112px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Tipografi Terminal */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="font-mono text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
          {title}
        </span>
        {subtitle && (
          <span className="font-mono text-[11px] tracking-wider text-neutral-500">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
