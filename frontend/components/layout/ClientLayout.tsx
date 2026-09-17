"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import RefreshButton from "./RefreshButton";
import Sidebar from "./Sidebar";
import SidebarToggle from "./SidebarToggle";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/pending";

  return (
    <>
      {/* NAVIGASI ATAS GLOBAL */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] sticky top-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          {/* Toggle Sidebar hanya muncul jika BUKAN di halaman login */}
          {!isAuthPage && <SidebarToggle />}
          
          {/* Judul Seragam untuk Semua Halaman (Tanpa Logo) */}
          <span className="font-bold text-base tracking-wide text-[var(--md-sys-color-on-surface)]">
            The Investowl
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Elemen ini hanya muncul di Dasbor */}
          {!isAuthPage && <span className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] hidden sm:block mr-2">Dashboard Bandarmologi</span>}
          
          {/* Tombol Tema SELALU muncul */}
          <ThemeToggle /> 
          
          {/* Tombol Refresh & Logout hanya di Dasbor */}
          {!isAuthPage && <RefreshButton />}
          {!isAuthPage && <LogoutButton />}
        </div>
      </nav>
      
      {/* KONTEN UTAMA */}
      <div className="flex pb-16 min-h-screen">
          {!isAuthPage && <Sidebar />}
          <div className="flex-1 min-w-0">
              {children}
          </div>
      </div>
      
      {/* NAVIGASI BAWAH */}
      {!isAuthPage && <BottomNav />}
    </>
  );
}
