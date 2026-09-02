import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import RefreshButton from "@/components/layout/RefreshButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvestOwl Terminal",
  description: "Dashboard Bandarmologi IDX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#08090C] text-white antialiased`}>
        {/* GLOBAL TOP NAVIGATION */}
        <nav className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#0F1117] sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="relative w-5 h-5">
              <Image src="/logo.png" alt="InvestOwl" fill sizes="20px" className="object-contain" priority />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] uppercase text-orange-400">InvestOwl</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-medium text-neutral-500 hidden sm:block">Dashboard Bandarmologi IDX</span>
             <RefreshButton />
          </div>
        </nav>
        
        {/* Konten Halaman */}
        <div className="pb-16">
            {children}
        </div>

        {/* GLOBAL BOTTOM NAVIGATION */}
        <BottomNav />
      </body>
    </html>
  );
}
