import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import RefreshButton from "@/components/layout/RefreshButton";
import Sidebar from "@/components/layout/Sidebar";
import SidebarToggle from "@/components/layout/SidebarToggle";
import ThemeToggle from "@/components/layout/ThemeToggle";
import AuthProvider from "@/components/providers/AuthProvider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var local = localStorage.getItem('investowl-global-state');
                  var theme = 'dark';
                  if (local) {
                    var parsed = JSON.parse(local);
                    if (parsed.state && parsed.state.theme) {
                      theme = parsed.state.theme;
                    }
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] antialiased transition-colors duration-300`}>
        <AuthProvider>
          {/* GLOBAL TOP NAVIGATION */}
          <nav className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-2.5">
              <SidebarToggle />
              <div className="relative w-5 h-5">
                <Image src="/logo.png" alt="InvestOwl" fill sizes="20px" className="object-contain" priority />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-[var(--md-sys-color-primary)]">InvestOwl</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] hidden sm:block">Dashboard Bandarmologi IDX</span>
              <ThemeToggle />
              <RefreshButton />
            </div>
          </nav>
          
          {/* KONTEN UTAMA DENGAN SIDEBAR GLOBAL */}
          <div className="flex pb-16 min-h-screen">
              <Sidebar />
              
              {/* Area Halaman */}
              <div className="flex-1 min-w-0">
                  {children}
              </div>
          </div>

          {/* GLOBAL BOTTOM NAVIGATION */}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
