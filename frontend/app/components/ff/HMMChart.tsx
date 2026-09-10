"use client";
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function HMMChart({ timeSeries }: { timeSeries: any }) {
  if (!timeSeries || !timeSeries.dates) return null;

  const { dates, close_prices, hmm_states } = timeSeries;

  // Memetakan deret HMM menjadi blok warna area (markArea)
  const markAreaData = useMemo(() => {
    const areas = [];
    let startIdx = 0;
    
    for (let i = 1; i <= hmm_states.length; i++) {
      if (i === hmm_states.length || hmm_states[i] !== hmm_states[i - 1]) {
        const state = hmm_states[i - 1];
        // Asumsi: State 2 = Akumulasi (Hijau), 0 = Distribusi (Merah), 1 = Netral (Abu)
        // Note: Mapping ini mungkin terbalik tergantung hasil fitting unsupervised HMM
        let color = 'rgba(229, 231, 235, 0.3)'; // Abu
        if (state === 2) color = 'rgba(187, 247, 208, 0.4)'; // Hijau
        if (state === 0) color = 'rgba(254, 202, 202, 0.4)'; // Merah

        areas.push([
          { xAxis: dates[startIdx], itemStyle: { color } },
          { xAxis: dates[i === hmm_states.length ? i - 1 : i] }
        ]);
        startIdx = i;
      }
    }
    return areas;
  }, [dates, hmm_states]);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        name: 'Close Price',
        type: 'line',
        data: close_prices,
        smooth: true,
        itemStyle: { color: '#1f2937' },
        markArea: {
          silent: true,
          data: markAreaData
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />;
}

