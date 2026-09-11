"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import { useForeignFlowAnalytics } from '@/hooks/useForeignFlow';
import { MetricCard } from '@/app/components/MetricCard';

// Impor dinamis untuk komponen ECharts dari folder yang sama (ff/)
const VARChart = dynamic(() => import('./VARChart'), { ssr: false });
const HMMChart = dynamic(() => import('./HMMChart'), { ssr: false });

export default function ForeignFlowDeepDiveTab() {
  const { activeTicker } = useAppStore();
  const [lookback, setLookback] = useState<number>(60);
  
  const { data, isLoading, isError } = useForeignFlowAnalytics(activeTicker, lookback);

  const getHmmTone = (state: number): "positive" | "negative" | "neutral" => {
    if (state === 2) return "positive"; // Akumulasi
    if (state === 0) return "negative"; // Distribusi
    return "neutral";                   
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 pb-24">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F1117] p-4 rounded-xl border border-white/[0.07]">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Institutional Deep Dive</h1>
          <p className="text-sm text-slate-400">HMM Regime & VAR Causality for {activeTicker}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Window:
          </span>
          <select 
            className="bg-[#161922] border border-white/[0.15] rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500 font-mono-nums transition-colors cursor-pointer"
            value={lookback}
            onChange={(e) => setLookback(Number(e.target.value))}
          >
            <option value={20}>20 Days</option>
            <option value={60}>60 Days</option>
            <option value={120}>120 Days</option>
            <option value={250}>250 Days</option>
          </select>
        </div>
      </div>

      {/* State: Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500 animate-pulse font-mono-nums tracking-wider text-sm">
            RUNNING QUANTITATIVE MODELS FOR {activeTicker}...
          </div>
        </div>
      )}
      
      {/* State: Error */}
      {isError && !isLoading && (
        <div className="p-6 text-center text-rose-400 bg-rose-500/[0.02] rounded-xl border-l-4 border-l-rose-500 border border-white/[0.07]">
          Gagal memuat analitik. Histori aliran dana asing untuk {activeTicker} tidak mencukupi.
        </div>
      )}

      {/* State: Success */}
      {!isLoading && !isError && data && (
        <>
          {/* Baris MetricCards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              label="CURRENT REGIME" 
              value={getHmmLabel(latestState)}
              subValue="Hidden Markov Model"
              tone={getHmmTone(latestState)}
            />
            
            <MetricCard 
              label="FLOW MOMENTUM" 
              value={`${zScoreValue > 0 ? '+' : ''}${zScoreValue.toFixed(2)}`}
              subValue="Z-Score (Std Dev)"
              tone={zScoreValue > 1 ? "positive" : zScoreValue < -1 ? "negative" : "neutral"}
            />

            <MetricCard 
              label="FOREIGN CONCENTRATION" 
              value={hhiValue.toFixed(4)}
              subValue={hhiValue > 0.5 ? "Highly Concentrated" : "Distributed"}
              tone={hhiValue > 0.5 ? "warning" : "neutral"}
            />
          </div>

          {/* Baris Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0F1117] p-5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] transition-colors">
              <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-4">
                HMM Market Regime ({activeTicker})
              </h3>
              <div className="w-full h-[350px]">
                <HMMChart timeSeries={data.timeseries} />
              </div>
            </div>
            
            <div className="bg-[#0F1117] p-5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] transition-colors">
              <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-4">
                Foreign Shock Causality (VAR)
              </h3>
              <div className="w-full h-[350px]">
                <VARChart irfData={data.models.impulse_response} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
