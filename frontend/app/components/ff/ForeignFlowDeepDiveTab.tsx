"use client";
import React, { useState } from 'react';
import { useForeignFlowAnalytics } from '@/hooks/useForeignFlow';
import dynamic from 'next/dynamic';

// Dynamic import diubah menjadi satu level direktori ('./')
const VARChart = dynamic(() => import('./VARChart'), { ssr: false });
const HMMChart = dynamic(() => import('./HMMChart'), { ssr: false });

interface Props {
  ticker: string;
}

export default function ForeignFlowDeepDiveTab({ ticker }: Props) {
  const [lookback, setLookback] = useState<number>(60);
  const { data, isLoading, isError } = useForeignFlowAnalytics(ticker, lookback);

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Menghitung Model Kuantitatif...</div>;
  if (isError || !data) return <div className="p-8 text-center text-red-500">Gagal memuat analitik. Pastikan histori data cukup.</div>;

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Analisis Kuantitatif Institusional</h2>
          <p className="text-sm text-gray-500">HMM Regime Detection & Vector Autoregression Causality</p>
        </div>
        <select 
          className="border rounded-md px-3 py-1.5 text-sm"
          value={lookback}
          onChange={(e) => setLookback(Number(e.target.value))}
        >
          <option value={20}>20 Hari</option>
          <option value={60}>60 Hari</option>
          <option value={120}>120 Hari</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Konsentrasi Asing (HHI)</div>
          <div className="text-xl font-bold">{data.features.foreign_hhi.toFixed(3)}</div>
          <div className="text-xs text-gray-400 mt-1">{data.features.foreign_hhi > 0.3 ? 'Terkonsentrasi' : 'Terdistribusi'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Momentum Z-Score</div>
          <div className={`text-xl font-bold ${data.features.foreign_zscore > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.features.foreign_zscore > 0 ? '+' : ''}{data.features.foreign_zscore.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Deviasi Standar Historis</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">HMM Market Regime</h3>
          <HMMChart timeSeries={data.timeseries} />
        </div>
        
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Foreign Shock Causality (VAR)</h3>
          <VARChart irfData={data.models.impulse_response} />
        </div>
      </div>
    </div>
  );
}

