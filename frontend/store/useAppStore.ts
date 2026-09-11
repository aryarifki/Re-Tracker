import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppState {
  activeTicker: string;
  sidebarOpen: boolean;
  
  summaryDays: number;
  universe: string;
  analysisDate: string;
  windowDays: number;
  horizon: number;
  minEvents: number;
  minNetBuy: number;
  
  // State sinkronisasi Screener
  localWatchlist: string[];

  setActiveTicker: (ticker: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSummaryDays: (days: number) => void;
  setUniverse: (universe: string) => void;
  setAnalysisDate: (date: string) => void;
  setWindowDays: (days: number) => void;
  setHorizon: (horizon: number) => void;
  setMinEvents: (events: number) => void;
  setMinNetBuy: (buy: number) => void;
  setLocalWatchlist: (list: string[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTicker: "BBCA",
      sidebarOpen: false,
      
      summaryDays: 30,
      universe: "watchlist",
      analysisDate: "",
      windowDays: 20,
      horizon: 10,
      minEvents: 5,
      minNetBuy: 0,
      
      localWatchlist: [], // Default kosong

      setActiveTicker: (ticker) => set({ activeTicker: ticker.toUpperCase() }),
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      setSummaryDays: (days) => set({ summaryDays: days }),
      setUniverse: (universe) => set({ universe }),
      setAnalysisDate: (date) => set({ analysisDate: date }),
      setWindowDays: (days) => set({ windowDays: days }),
      setHorizon: (horizon) => set({ horizon }),
      setMinEvents: (events) => set({ minEvents: events }),
      setMinNetBuy: (buy) => set({ minNetBuy: buy }),
      setLocalWatchlist: (list) => set({ localWatchlist: list }),
    }),
    {
      name: "investowl-global-state",
      storage: createJSONStorage(() => localStorage),
      // Mencegah sidebarOpen ikut tersimpan di memori lokal agar menu tidak selalu terbuka otomatis saat web di-refresh
      partialize: (state) => ({ ...state, sidebarOpen: false }), 
    }
  )
);
