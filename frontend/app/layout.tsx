import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SM Tracker — Saham & Bandarmologi IDX",
  description: "Pelacak data saham dan bandarmologi Bursa Efek Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        {/* Header aplikasi */}
        <header className="border-b border-neutral-800 bg-neutral-900 px-4 py-2 flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-tight">
            <span className="text-emerald-500">SM</span> Tracker
          </h1>
          <span className="text-xs text-neutral-500">
 Dashboard Bandarmologi IDX
          </span>
        </header>

        {children}
      </body>
    </html>
  );
}
