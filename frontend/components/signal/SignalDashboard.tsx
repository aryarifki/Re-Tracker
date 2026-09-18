"use client";

import React from 'react';
import useSWR from 'swr';
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SignalDashboard() {
  const { data, error, isLoading } = useSWR('/api/signal/daily?limit=5', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false
  });

  if (isLoading) return (
    <div className="py-24 flex flex-col items-center justify-center text-[var(--md-sys-color-primary)] animate-pulse gap-4">
      <Icon icon="ph:cpu-bold" width="48" />
      <span className="font-extrabold tracking-widest uppercase text-sm">Extracting AI Signals...</span>
    </div>
  );

  if (error || !data?.data) return (
    <div className="p-6 bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error-container)] font-bold rounded-[24px] shadow-sm">
      Gagal memuat sinyal harian. Pastikan backend SMtracker telah berjalan dan endpoint API sudah aktif.
    </div>
  );

  const signals = data.data;

  if (signals.length === 0) return (
    <div className="p-6 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold rounded-[24px] shadow-sm text-center">
      Belum ada sinyal yang memenuhi kriteria ketat algoritma hari ini.
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {signals.map((sig: any, idx: number) => {
        const isWin = sig.ml_label === "WIN";
        const themeColor = isWin ? "var(--color-positive)" : "#f59e0b";
        const themeBg = isWin ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30";
        
        const wp = sig.features?.wyckoff_phase || "Unknown";
        const smNotes = sig.features?.smart_money_notes || "Netral";
        const secNotes = sig.features?.sector_notes?.split("(")[0].trim() || "Neutral";
        
        return (
          <div key={idx} className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-[32px] p-5 md:p-7 shadow-sm transition-all duration-300 relative overflow-hidden group hover:shadow-md">
            
            {/* Header Emiten */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--md-sys-color-outline-variant)] pb-5">
              <div>
                <div className="text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Icon icon="ph:robot-bold" /> AI SIGNAL DASHBOARD
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">{sig.ticker}</h2>
                  <span className="text-[10px] font-extrabold bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-full px-3 py-1 shadow-sm">
                    Scanned: {sig.date}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <span className={`px-4 py-2 rounded-full border text-xs font-extrabold tracking-widest shadow-sm ${themeBg}`} style={{ color: themeColor }}>
                    {sig.ml_label} PROB: {sig.ml_win_prob.toFixed(1)}%
                  </span>
              </div>
            </div>

            {/* Grid Metrik */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
              
              <div className="bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-[20px] p-4 flex flex-col justify-center border-l-4" style={{ borderLeftColor: themeColor }}>
                <div className="text-[9px] font-extrabold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-1">COMPOSITE SCORE</div>
                <div className="text-2xl font-extrabold tracking-tight" style={{ color: themeColor }}>{sig.composite_score}<span className="text-sm font-bold opacity-60 ml-1">/100</span></div>
              </div>

              <div className="bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-[20px] p-4 flex flex-col justify-center border-l-4 border-l-[#3b82f6]">
                <div className="text-[9px] font-extrabold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-1">TECHNICAL PHASE</div>
                <div className="text-lg font-extrabold tracking-tight text-[#3b82f6] truncate">Phase {wp}</div>
              </div>

              <div className="bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-[20px] p-4 flex flex-col justify-center border-l-4 border-l-[#10b981]">
                <div className="text-[9px] font-extrabold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-1">SMART MONEY</div>
                <div className="text-lg font-extrabold tracking-tight text-[#10b981] truncate" title={smNotes}>{smNotes.split("·")[0].trim()}</div>
              </div>

              <div className="bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] rounded-[20px] p-4 flex flex-col justify-center border-l-4 border-l-[#8b5cf6]">
                <div className="text-[9px] font-extrabold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-1">SECTOR MOMENTUM</div>
                <div className="text-lg font-extrabold tracking-tight text-[#8b5cf6] truncate" title={secNotes}>{secNotes}</div>
              </div>

            </div>

            {/* Alert Box Bottom */}
            <div className={`mt-2 rounded-[20px] p-4 border flex items-start gap-3 ${sig.scores?.smart_money >= 65 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500"}`}>
              <div className="mt-0.5">
                <Icon icon={sig.scores?.smart_money >= 65 ? "ph:check-circle-bold" : "ph:warning-circle-bold"} width="18" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold leading-relaxed">
                {sig.scores?.smart_money >= 65 
                  ? "Sinyal didukung oleh akumulasi kuat dan konfirmasi rotasi sektor. Probabilitas probabilitas tren (WIN Rate) tinggi." 
                  : "Sinyal valid secara teknikal, namun aliran dana Smart Money masih netral/distribusi ringan. Atur manajemen risiko porsi masuk."}
              </p>
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
