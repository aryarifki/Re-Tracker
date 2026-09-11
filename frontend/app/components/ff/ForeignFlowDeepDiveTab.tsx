"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { useForeignFlowAnalytics } from '@/hooks/useForeignFlow';
import { Icon } from "@iconify/react";

// Z-index aman dari hydration error (ssr: false)
const VARChart = dynamic(() => import('./VARChart'), { ssr: false });
const HMMChart = dynamic(() => import('./HMMChart'), { ssr: false });

export default function ForeignFlowDeepDiveTab() {
  // Langsung membaca activeTicker dan windowDays dari Sidebar global
  const { activeTicker, windowDays } = useAppStore();
  
  const { data, isLoading, isError } = useForeignFlowAnalytics(activeTicker, windowDays);

  const getHmmTone = (state: number): string => {
    if (state === 2) return "#10b981"; // Hijau Akumulasi
    if (state === 0) return "#f43f5e"; // Merah Distribusi
    return "#94a3b8";                  // Abu Netral
  };

  const getHmmLabel = (state: number): string => {
    if (state === 2) return "Accumulation";
    if (state === 0) return "Distribution";
    return "Neutral";
  };

  const zScoreValue = data?.features?.foreign_zscore || 0;
  const hhiValue = data?.features?.foreign_hhi || 0;
  const latestState = data?.timeseries?.hmm_states?.length > 0 
    ? data.timeseries.hmm_states[data.timeseries.hmm_states.length - 1] 
    : 1;

  const companyName = data?.company?.name || "Perusahaan Tidak Diketahui";
  const groupName = data?.company?.group || "Independen / Belum Terpetakan";

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 pb-24">
      
      {/* 1. Header Ticker & Nama Grup (BOLD Putih, Tanpa teks lama) */}
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          {activeTicker} 
          <span className="text-sm font-semibold bg-white/10 text-neutral-300 px-3 py-1 rounded-full">
            {windowDays} Days Window
          </span>
        </h1>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-neutral-400">
          <span>{companyName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
          <span className="text-orange-400 font-semibold">{groupName}</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-neutral-500 animate-pulse font-mono tracking-wider text-sm">
          <Icon icon="ph:spinner-gap-duotone" className="animate-spin mr-2" width="20" /> RUNNING ALGORITHMS...
        </div>
      )}
      
      {isError && !isLoading && (
        <div className="p-4 text-center text-rose-400 bg-rose-500/10 rounded-xl border-l-4 border-l-rose-500 border border-white/[0.07] text-sm">
          Gagal memuat analitik. Histori aliran dana asing untuk {activeTicker} pada window {windowDays} hari tidak mencukupi (Min 20 hari).
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* 2. Compact Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-3 border-l-4" style={{ borderLeftColor: getHmmTone(latestState) }}>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">CURRENT REGIME</div>
              <div className="text-base font-bold" style={{ color: getHmmTone(latestState) }}>{getHmmLabel(latestState)}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Hidden Markov Model</div>
            </div>
            
            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-3 border-l-4" style={{ borderLeftColor: zScoreValue > 1 ? "#10b981" : zScoreValue < -1 ? "#f43f5e" : "#94a3b8" }}>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">FLOW MOMENTUM</div>
              <div className="text-base font-bold text-white">{`${zScoreValue > 0 ? '+' : ''}${zScoreValue.toFixed(2)}`}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Z-Score (Std Deviasi)</div>
            </div>

            <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-3 border-l-4" style={{ borderLeftColor: hhiValue > 0.3 ? "#f59e0b" : "#94a3b8" }}>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">CONCENTRATION (HHI)</div>
              <div className="text-base font-bold text-white">{hhiValue.toFixed(4)}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{hhiValue > 0.3 ? "Highly Concentrated" : "Distributed"}</div>
            </div>
          </div>

          {/* 3. Baris Charts dengan Teks Keterangan & Z-Index aman */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            
            {/* HMM Chart */}
            <div className="bg-[#0F1117] p-4 rounded-xl border border-white/[0.07] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:chart-line-up-bold" className="text-neutral-500" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-neutral-200 uppercase">HMM Market Regime</h3>
              </div>
              <div className="w-full h-[280px] relative z-0">
                <HMMChart timeSeries={data.timeseries} />
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.05] flex-grow">
                <p className="text-[11px] leading-relaxed text-neutral-400 text-justify">
                  <strong className="text-neutral-200">Cara Membaca:</strong> Latar area <span className="text-emerald-400">Hijau (Akumulasi)</span>, <span className="text-rose-400">Merah (Distribusi)</span>, dan <span className="text-neutral-500">Abu-Abu (Netral)</span> menunjukkan fase aliran dana asing. Jika harga saham turun namun latar berubah hijau, hal tersebut mengindikasikan sinyal <span className="text-white italic">hidden accumulation</span> (asing diam-diam akumulasi saat harga lemah), yang sering menjadi indikator <strong className="text-emerald-400">early reversal</strong>.
                </p>
              </div>
            </div>
            
            {/* VAR Chart */}
            <div className="bg-[#0F1117] p-4 rounded-xl border border-white/[0.07] flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:pulse-bold" className="text-neutral-500" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-neutral-200 uppercase">Foreign Shock Causality (VAR)</h3>
              </div>
              <div className="w-full h-[280px] relative z-0">
                <VARChart irfData={data.models.impulse_response} />
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.05] flex-grow">
                <p className="text-[11px] leading-relaxed text-neutral-400 text-justify">
                  <strong className="text-neutral-200">Cara Membaca:</strong> Sumbu X (T+0 s/d T+10) adalah hari pasca *shock* dana asing. Garis biru jauh di atas 0 menandakan dampak positif kuat terhadap harga. Jika garis melengkung turun mendekati 0 di T+5, efeknya sangat <span className="text-rose-300">sementara</span>. Jika konsisten di atas 0 hingga T+10, pembelian asing tersebut memiliki efek <strong className="text-blue-400">persisten</strong> dalam menahan harga tetap kuat.
                </p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
