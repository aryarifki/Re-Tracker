"use client";

import Watchlist from "@/components/Watchlist";
import MainChart from "@/components/MainChart";
import BrokerDetails from "@/components/BrokerDetails";

export default function Dashboard() {
  return (
    <main className="grid grid-cols-12 gap-3 p-3 h-[calc(100vh-49px)]">
      {/* Kolom 1 (Kiri): Watchlist — 3/12 lebar */}
      <div className="col-span-3 overflow-hidden">
        <Watchlist />
      </div>

      {/* Kolom 2 (Tengah): Grafik Utama — 6/12 lebar */}
      <div className="col-span-6 overflow-hidden">
        <MainChart />
      </div>

      {/* Kolom 3 (Kanan): Detail Bandarmologi — 3/12 lebar */}
      <div className="col-span-3 overflow-y-auto">
        <BrokerDetails />
      </div>
    </main>
  );
}
