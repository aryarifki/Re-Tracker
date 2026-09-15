"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { useForeignFlowAnalytics } from '@/hooks/useForeignFlow';
import { Icon } from "@iconify/react";

const VARChart = dynamic(() => import('./VARChart'), { ssr: false });
const HMMChart = dynamic(() => import('./HMMChart'), { ssr: false });
const BrokerHeatmap = dynamic(() => import('./BrokerHeatmap'), { ssr: false });
const BrokerNetworkGraph = dynamic(() => import('./BrokerNetworkGraph'), { ssr: false });

export default function ForeignFlowDeepDiveTab() {
  const { activeTicker, windowDays } = useAppStore();
  const { data, isLoading, isFetching, isError } = useForeignFlowAnalytics(activeTicker, windowDays);

  const getHmmTone = (state: number): string => {
    if (state === 2) return "var(--color-positive)"; 
    if (state === 0) return "var(--color-negative)"; 
    return "var(--md-sys-color-outline)";                  
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
    <div className="flex flex-col gap-4 pb-24 transition-colors duration-300">
      
      <div className="mb-1 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3.5 shadow-sm transition-colors duration-300">
        <div className="text-[10px] font-bold text-[var(--md-sys-color-primary)] uppercase tracking-widest mb-0.5">
          FOREIGN FLOW DEEP DIVE
        </div>
        
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--md-sys-color-on-surface)]">{activeTicker}</h1>
          <span className="text-[10px] font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-full px-2.5 py-1 shadow-sm">
            {windowDays} Days Window
          </span>
          {isFetching && !isLoading && (
            <span className="text-[10px] font-mono tracking-wider text-blue-500 animate-pulse flex items-center gap-1.5">
              <Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="12" />
              Updating...
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)] font-medium">{companyName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-outline-variant)]" />
          <span className="text-[var(--md-sys-color-primary)] font-semibold">{groupName}</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-[var(--md-sys-color-on-surface-variant)] animate-pulse font-mono tracking-wider text-sm">
          <Icon icon="ph:spinner-gap-duotone" className="animate-spin mr-2" width="20" /> RUNNING ALGORITHMS...
        </div>
      )}
      
      {isError && !isLoading && (
        <div className="p-4 text-center text-[var(--color-negative)] bg-rose-500/10 rounded-xl border-l-4 border-l-rose-500 border border-[var(--md-sys-color-outline-variant)] text-sm">
          Gagal memuat analitik. Histori aliran dana asing untuk {activeTicker} pada window {windowDays} hari tidak mencukupi (Min 20 hari).
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Compact Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 border-l-4 transition-colors" style={{ borderLeftColor: getHmmTone(latestState) }}>
              <div className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-0.5">CURRENT REGIME</div>
              <div className="text-base font-bold" style={{ color: getHmmTone(latestState) }}>{getHmmLabel(latestState)}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Hidden Markov Model</div>
            </div>
            
            <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 border-l-4 transition-colors" style={{ borderLeftColor: zScoreValue > 1 ? "var(--color-positive)" : zScoreValue < -1 ? "var(--color-negative)" : "var(--md-sys-color-outline)" }}>
              <div className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-0.5">FLOW MOMENTUM</div>
              <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">{`${zScoreValue > 0 ? '+' : ''}${zScoreValue.toFixed(2)}`}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Z-Score (Std Deviasi)</div>
            </div>

            <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-3 border-l-4 transition-colors" style={{ borderLeftColor: hhiValue > 0.5 ? "#f59e0b" : "var(--md-sys-color-outline)" }}>
              <div className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-0.5">CONCENTRATION (HHI)</div>
              <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">{hhiValue.toFixed(4)}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{hhiValue > 0.5 ? "Highly Concentrated" : "Distributed"}</div>
            </div>
          </div>

          {/* Baris Charts 1: HMM & VAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="bg-[var(--md-sys-color-surface-container)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] flex flex-col transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:chart-line-up-bold" className="text-[var(--md-sys-color-on-surface-variant)]" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-[var(--md-sys-color-on-surface)] uppercase">HMM Market Regime</h3>
              </div>
              <div className="w-full h-[280px] relative z-0">
                <HMMChart timeSeries={data.timeseries} />
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex-grow">
                <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)] text-justify">
                  <strong className="text-[var(--md-sys-color-on-surface)]">Cara Membaca:</strong> Latar area <span className="text-[var(--color-positive)] font-medium">Hijau (Akumulasi)</span>, <span className="text-[var(--color-negative)] font-medium">Merah (Distribusi)</span>, dan <span className="text-neutral-500 font-medium">Abu-Abu (Netral)</span> menunjukkan fase aliran dana asing. Jika harga saham turun namun latar berubah hijau, hal tersebut mengindikasikan sinyal <span className="italic font-medium">hidden accumulation</span> (asing diam-diam akumulasi saat harga lemah), yang sering menjadi indikator <strong className="text-[var(--color-positive)]">early reversal</strong>.
                </p>
              </div>
            </div>
            
            <div className="bg-[var(--md-sys-color-surface-container)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] flex flex-col transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:pulse-bold" className="text-[var(--md-sys-color-on-surface-variant)]" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-[var(--md-sys-color-on-surface)] uppercase">Foreign Shock Causality (VAR)</h3>
              </div>
              <div className="w-full h-[280px] relative z-0">
                <VARChart irfData={data.models.impulse_response} />
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex-grow">
                <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)] text-justify">
                  <strong className="text-[var(--md-sys-color-on-surface)]">Cara Membaca:</strong> Sumbu X (T+0 s/d T+10) adalah hari pasca shock dana asing. Garis biru jauh di atas 0 menandakan dampak positif kuat terhadap harga. Jika garis melengkung turun mendekati 0 di T+5, efeknya sangat <span className="text-[var(--color-negative)]">sementara</span>. Jika konsisten di atas 0 hingga T+10, pembelian asing tersebut memiliki efek <strong className="text-blue-500">persisten</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Baris Charts 2: Broker Heatmap & Network Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            
            <div className="bg-[var(--md-sys-color-surface-container)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] flex flex-col transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:squares-four-bold" className="text-[var(--md-sys-color-on-surface-variant)]" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-[var(--md-sys-color-on-surface)] uppercase">Top Broker Calendar Heatmap</h3>
              </div>
              <div className="w-full h-[320px] relative z-0">
                <BrokerHeatmap heatmapData={data.models.broker_heatmap} />
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex-grow">
                <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)] text-justify">
                  <strong className="text-[var(--md-sys-color-on-surface)]">Cara Membaca:</strong> Matriks aktivitas broker harian yang telah di-normalisasi (Z-Score). Warna <span className="text-[var(--color-positive)] font-medium">Hijau</span> menandakan akumulasi dominan, sedangkan <span className="text-[var(--color-negative)] font-medium">Merah</span> menandakan distribusi kuat. Membantu melacak konsistensi akumulasi dari broker asing spesifik selama jendela periode berjalan.
                </p>
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface-container)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] flex flex-col transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:share-network-bold" className="text-[var(--md-sys-color-on-surface-variant)]" width="16" />
                <h3 className="text-xs font-semibold tracking-wider text-[var(--md-sys-color-on-surface)] uppercase">Syndicate Network Graph</h3>
              </div>
              <div className="w-full h-[320px] relative z-0">
                <BrokerNetworkGraph networkData={data.models.broker_network} />
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline-variant)] flex-grow">
                <p className="text-[11px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)] text-justify">
                  <strong className="text-[var(--md-sys-color-on-surface)]">Cara Membaca:</strong> Analisis hubungan pergerakan antar broker (Pearson Correlation). Ukuran lingkaran (node) menunjukkan dominasi sentral broker penggerak utama (Anchor Broker). Garis <span className="text-[var(--color-positive)] font-medium">Hijau</span> menandakan sinkronisasi akumulasi bersama (ko-akumulasi), dan kluster warna yang sama menandakan satu sindikat aksi menurut algoritma Louvain.
                </p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
