import { create } from "zustand";

interface AppState {
  // Ticker aktif & navigasi
  activeTicker: string;
  sidebarOpen: boolean;
  
  // Kontrol Filter Global (Eks-Sidebar)
  summaryDays: number;
  universe: string;
  analysisDate: string;
  windowDays: number;
  horizon: number;
  minEvents: number;
  minNetBuy: number;

  // Actions
  setActiveTicker: (ticker: string) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSummaryDays: (days: number) => void;
  setUniverse: (universe: string) => void;
  setAnalysisDate: (date: string) => void;
  setWindowDays: (days: number) => void;
  setHorizon: (horizon: number) => void;
  setMinEvents: (events: number) => void;
  setMinNetBuy: (buy: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTicker: "BBCA", // Default
  sidebarOpen: false,
  
  summaryDays: 30,
  universe: "watchlist",
  analysisDate: "",
  windowDays: 20,
  horizon: 10,
  minEvents: 5,
  minNetBuy: 0,

  setActiveTicker: (ticker) => set({ activeTicker: ticker.toUpperCase() }),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setSummaryDays: (days) => set({ summaryDays: days }),
  setUniverse: (universe) => set({ universe }),
  setAnalysisDate: (date) => set({ analysisDate: date }),
  setWindowDays: (days) => set({ windowDays: days }),
  setHorizon: (horizon) => set({ horizon }),
  setMinEvents: (events) => set({ minEvents: events }),
  setMinNetBuy: (buy) => set({ minNetBuy: buy }),
}));
