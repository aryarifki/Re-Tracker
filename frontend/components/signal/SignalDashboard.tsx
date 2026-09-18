"use client";

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SignalDashboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/signal/daily?limit=500', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false
  });

  // ── FILTERING DI FRONTEND ──
  // Hanya tampilkan saham yang lolos Hard Gates (Skor > 0)
  const validSignals = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((sig: any) => sig.composite_score > 0);
  }, [data]);

  if (isLoading && !data) return (
    <div className="p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] rounded-xl flex items-center justify-center gap-3 text-[var(--md-sys-color-on-surface-variant)] shadow-sm">
      <Icon icon="ph:spinner-gap-duotone" className="animate-spin text-[var(--md-sys-color-primary)]" width="20" /> 
      <span className="text-sm font-medium">Extracting AI Signals...</span>
    </div>
  );

  if (error || !data?.data) return (
    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
      Error loading AI Signals. Pastikan backend SMtracker telah berjalan dan endpoint API sudah aktif.
    </div>
  );

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      
      {/* ====== CONTAINER TABEL (Fixed Height dengan Flexbox) ====== */}
      <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col h-[75vh] min-h-[600px] transition-colors duration-300">
        
        {/* --- TOOLBAR RINGKAS ALA RAW TABLES (Tanpa Double Header) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3 gap-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon icon="ph:radar-duotone" className="text-[var(--md-sys-color-primary)]" width="18" height="18" />
            <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mr-2">Scanner Results</h3>
            
            <span className="text-[10px] font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-md px-2 py-1 flex items-center gap-1.5">
              <Icon icon="ph:calendar-blank-duotone" /> {data.latest_date}
            </span>
            
            <span className="text-[10px] font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-md px-2 py-1">
              <span className="text-[var(--md-sys-color-primary)]">{validSignals.length}</span> Saham Lolos
            </span>
          </div>

          <button 
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-md text-xs font-semibold text-[var(--md-sys-color-on-surface)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Icon 
              icon={isValidating ? "ph:spinner-gap-duotone" : "ph:arrows-clockwise-bold"} 
              className={isValidating ? "animate-spin text-[var(--md-sys-color-on-surface-variant)]" : "text-[var(--md-sys-color-primary)]"} 
              width="14" height="14" 
            />
            <span>{isValidating ? "Syncing..." : "Refresh Matrix"}</span>
          </button>
        </div>

        {/* --- AREA TABEL (Overflow Auto & Scrollbar) --- */}
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-[var(--md-sys-color-outline-variant)] pb-2 flex-grow relative z-0">
          
          {validSignals.length === 0 ? (
            <div className="p-8 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs font-medium">
              Belum ada sinyal yang memenuhi kriteria ketat algoritma pada tanggal ini.
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap text-xs border-separate border-spacing-0">
              
              <thead className="bg-[var(--md-sys-color-surface-container)]">
                <tr className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
                  <th className="py-2.5 px-4 font-medium rounded-tl-md sticky top-0 left-0 z-30 bg-[var(--md-sys-color-surface-container-high)] border-b border-r border-[var(--md-sys-color-outline-variant)]">
                    Emiten
                  </th>
                  <th className="py-2.5 px-4 font-medium sticky top-0 z-20 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)]">
                    AI Prob
                  </th>
                  <th className="py-2.5 px-4 font-medium sticky top-0 z-20 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)]">
                    Composite
                  </th>
                  <th className="py-2.5 px-4 font-medium sticky top-0 z-20 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)]">
                    Phase
                  </th>
                  <th className="py-2.5 px-4 font-medium sticky top-0 z-20 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)]">
                    Smart Money
                  </th>
                  <th className="py-2.5 px-4 font-medium rounded-tr-md sticky top-0 z-20 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)]">
                    Sector & Context
                  </th>
                </tr>
              </thead>

              <tbody>
                {validSignals.map((sig: any, idx: number) => {
                  const isWin = sig.ml_label === "WIN";
                  const isLoss = sig.ml_label === "LOSS";
                  
                  let badgeTheme = "text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-high)] border-[var(--md-sys-color-outline-variant)]";
                  if (isWin) badgeTheme = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  else if (isLoss) badgeTheme = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
                  else badgeTheme = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
                  
                  const alertBoxClass = sig.scores?.smart_money >= 65 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";

                  const scoreColorClass = isWin ? "text-[var(--color-positive)]" : "text-amber-600 dark:text-amber-400";
                  const smColorClass = sig.scores?.smart_money >= 65 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

                  const wp = sig.features?.wyckoff_phase || "Unknown";
                  const smNotes = sig.features?.smart_money_notes?.split("·")[0].trim() || "Netral";
                  const secNotes = sig.features?.sector_notes?.split("(")[0].trim() || "Neutral";
                  
                  return (
                    <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors text-[var(--md-sys-color-on-surface)] group">
                      
                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--md-sys-color-on-surface)] sticky left-0 z-10 bg-[var(--md-sys-color-surface-container)] group-hover:bg-[var(--md-sys-color-surface-container-highest)] border-b border-r border-[var(--md-sys-color-outline-variant)]/30 transition-colors">
                        {sig.ticker}
                      </td>
                      
                      <td className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[10px] border-b border-[var(--md-sys-color-outline-variant)]/30">
                        <span className={`px-2 py-[1.5px] rounded border ${badgeTheme}`}>
                          {sig.ml_label} {(sig.ml_win_prob).toFixed(1)}%
                        </span>
                      </td>
                      
                      <td className="py-2.5 px-4 font-bold border-b border-[var(--md-sys-color-outline-variant)]/30">
                        <span className={scoreColorClass}>{sig.composite_score}</span>
                        <span className="text-[10px] opacity-60 ml-0.5 text-[var(--md-sys-color-on-surface-variant)]">/100</span>
                      </td>
                      
                      <td className="py-2.5 px-4 font-bold text-blue-500 dark:text-blue-400 border-b border-[var(--md-sys-color-outline-variant)]/30">
                        Phase {wp}
                      </td>
                      
                      <td className={`py-2.5 px-4 font-bold max-w-[200px] truncate border-b border-[var(--md-sys-color-outline-variant)]/30 ${smColorClass}`} title={smNotes}>
                        {smNotes}
                      </td>
                      
                      <td className="py-2.5 px-4 min-w-[300px] max-w-[400px] border-b border-[var(--md-sys-color-outline-variant)]/30">
                        <div className="flex flex-col gap-1.5 py-1">
                          <span className="font-bold text-indigo-500 dark:text-indigo-400 truncate" title={secNotes}>
                            {secNotes}
                          </span>
                          
                          <div className={`rounded p-1.5 border flex items-start gap-1.5 shadow-sm ${alertBoxClass}`}>
                            <Icon icon={sig.scores?.smart_money >= 65 ? "ph:check-circle-bold" : "ph:warning-circle-bold"} width="12" className="shrink-0 mt-0.5" />
                            <span className="text-[9.5px] font-medium leading-relaxed whitespace-normal break-words">
                              {sig.scores?.smart_money >= 65 
                                ? "Sinyal didukung akumulasi kuat. WIN rate tinggi." 
                                : "Valid teknikal, tapi smart-money netral/distribusi. Hati-hati."}
                            </span>
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
EOF
