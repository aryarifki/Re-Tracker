import { create } from "zustand";

interface AppState {
  /** Ticker yang sedang aktif diklik di Watchlist */
  activeTicker: string;
  /** Periode agregasi bandarmologi (dipakai kolom kanan & overlay) */
  summaryDays: number;

  setActiveTicker: (ticker: string) => void;
  setSummaryDays: (days: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTicker: "BBCA", // default saat aplikasi dibuka
  summaryDays: 30,

  setActiveTicker: (ticker) => set({ activeTicker: ticker.toUpperCase() }),
  setSummaryDays: (days) => set({ summaryDays: days }),
}));
