"use client";

import React, { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Icon } from "@iconify/react";
import { useAppStore } from "@/store/useAppStore";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const UNIVERSES = [
  "watchlist", "idx80", "lq45", "idx_high_dividend", "idx_bumn", 
  "idx_smc", "esg_kehati", "idxenergy", "idxtrans", "idxinfra", 
  "idxtechno", "idxpropert", "idxfinance", "idxhealth", "idxcyclic", 
  "idxnoncyc", "idxindust", "idxbasic", "bisnis-27"
];
const WINDOWS = [20, 30, 60, 90, 180];
const HORIZONS = [1, 3, 5, 10];

export default function Sidebar() {
  const { mutate } = useSWRConfig();
  
  // Ambil state dari global store
  const { 
    sidebarOpen, setSidebarOpen, activeTicker,
    universe, setUniverse, analysisDate, setAnalysisDate,
    windowDays, setWindowDays, horizon, setHorizon,
    minEvents, setMinEvents, minNetBuy, setMinNetBuy
  } = useAppStore();

  const [localWatchlist, setLocalWatchlist] = useState<string[]>([]);
  const [backfillStart, setBackfillStart] = useState("");
  const [backfillEnd, setBackfillEnd] = useState("");
  const [pipelineRunning, setPipelineRunning] = useState<string | null>(null);
  const [isRefreshingMaster, setIsRefreshingMaster] = useState(false);

  useEffect(() => {
    try {
      const ls = localStorage.getItem("tradepulse_watchlist");
      if (ls) setLocalWatchlist(JSON.parse(ls));
    } catch (e) {}
  }, []);

  const { data: statusData, mutate: mutateStatus } = useSWR("/api/bandar/system-status", fetcher);
  const { data: datesData } = useSWR(activeTicker ? "/api/bandar/dates/" + activeTicker : null, fetcher);
  const availableDates: string[] = datesData?.dates || [];

  useEffect(() => {
    if (availableDates.length > 0 && !analysisDate) {
      const latest = availableDates[availableDates.length - 1];
      setAnalysisDate(latest);
      setBackfillEnd(latest);
      const d = new Date(latest);
      d.setDate(d.getDate() - 90);
      setBackfillStart(d.toISOString().split("T")[0]);
    }
  }, [availableDates, analysisDate, setAnalysisDate]);

  const handleCalendarChange = (selected: string) => {
    if (!selected || availableDates.length === 0) return;
    if (availableDates.includes(selected)) {
      setAnalysisDate(selected);
      return;
    }
    const priorDates = availableDates.filter((d) => d <= selected);
    if (priorDates.length > 0) {
      setAnalysisDate(priorDates[priorDates.length - 1]);
    } else {
      setAnalysisDate(availableDates[0]);
    }
  };

  const handleRefreshMaster = async () => {
    if (isRefreshingMaster) return;
    setIsRefreshingMaster(true);
    try {
      const res = await fetch("/api/bandar/universe/refresh", { method: "POST" });
      const json = await res.json();
      if (json.status === "success") {
        await mutate("/api/bandar/universe/all");
        await mutateStatus();
        alert(`Sukses: ${json.message}`);
      } else {
        alert(`Gagal: ${json.error || "Gagal refresh master tickers"}`);
      }
    } catch (e: any) {
      alert(`Error koneksi: ${e.message}`);
    } finally {
      setIsRefreshingMaster(false);
    }
  };

  const runPipeline = async (type: "today" | "missing" | "backfill") => {
    setPipelineRunning(type);
    try {
      const payload: any = { universe_mode: universe };
      if (universe === "watchlist" && localWatchlist.length > 0) {
          payload.tickers = localWatchlist;
      }
      let res;
      if (type === "today") {
        res = await fetch("/api/bandar/pipeline/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (type === "missing") {
        payload.start_date = analysisDate || statusData?.latest_date;
        payload.end_date = new Date().toISOString().split("T")[0];
        res = await fetch("/api/bandar/pipeline/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        payload.start_date = backfillStart;
        payload.end_date = backfillEnd;
        res = await fetch("/api/bandar/pipeline/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (res.ok) {
        alert("Pipeline selesai dijalankan.");
        mutate(() => true, undefined, { revalidate: true });
      } else {
        alert("Pipeline error: " + (json.detail || "Gagal"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setPipelineRunning(null);
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={
        "fixed lg:sticky top-[60px] z-50 h-[calc(100vh-60px)] w-72 bg-neutral-900 border-r border-neutral-800 overflow-y-auto " +
        "transition-transform duration-300 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
      }>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">IDX Smart Flow</div>
              <h2 className="text-sm font-bold text-white">Controls</h2>
            </div>
            <button 
              onClick={handleRefreshMaster} 
              disabled={isRefreshingMaster}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 hover:text-orange-400 transition-colors"
            >
              <Icon icon="ph:arrows-clockwise-duotone" width="16" className={isRefreshingMaster ? "animate-spin text-orange-400" : ""} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Universe Filter</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
            >
              {UNIVERSES.map((u) => <option key={u} value={u}>{u.toUpperCase()}</option>)}
            </select>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex flex-col gap-0.5 bg-neutral-950/40 p-2 rounded border border-neutral-800/80">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <b>{statusData?.active_tickers ?? "..."}</b> emiten aktif
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Analysis Date</label>
            <input
              type="date"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none [color-scheme:dark]"
              value={analysisDate}
              max={availableDates[availableDates.length - 1] || statusData?.latest_date || ""}
              onChange={(e) => handleCalendarChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Broker Window</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
            >
              {WINDOWS.map((w) => <option key={w} value={w}>{w} days</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Validation Horizon</label>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
            >
              {HORIZONS.map((h) => <option key={h} value={h}>{h} days</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Min Events</label>
              <input type="number" min={3} max={30} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none" value={minEvents} onChange={(e) => setMinEvents(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Min Buy Rp B</label>
              <input type="number" min={0} step={0.5} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none" value={minNetBuy} onChange={(e) => setMinNetBuy(Number(e.target.value))} />
            </div>
          </div>

          <hr className="border-neutral-800" />

          <div className="space-y-2">
            <button onClick={() => runPipeline("today")} disabled={pipelineRunning !== null} className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors text-left flex items-center justify-between">
              <span>Run latest pipeline</span>
              {pipelineRunning === "today" && <Icon icon="ph:spinner-gap" className="animate-spin text-orange-400" />}
            </button>
            <button onClick={() => runPipeline("missing")} disabled={pipelineRunning !== null} className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors text-left flex items-center justify-between">
              <span>Fetch missing broker dates</span>
              {pipelineRunning === "missing" && <Icon icon="ph:spinner-gap" className="animate-spin text-orange-400" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
