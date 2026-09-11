"use client";
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function HMMChart({ timeSeries }: { timeSeries: any }) {
  if (!timeSeries || !timeSeries.dates) return null;

  const { dates, close_prices, hmm_states } = timeSeries;

  const markAreaData = useMemo(() => {
    const areas = [];
    let startIdx = 0;
    
    for (let i = 1; i <= hmm_states.length; i++) {
      if (i === hmm_states.length || hmm_states[i] !== hmm_states[i - 1]) {
        const state = hmm_states[i - 1];
        // Warna Dibuat Lebih Soft / Transparan (0.15)
        let color = 'rgba(229, 231, 235, 0.05)'; // Abu (Sangat tipis)
        if (state === 2) color = 'rgba(16, 185, 129, 0.15)'; // Hijau Soft
        if (state === 0) color = 'rgba(244, 63, 94, 0.15)';  // Merah Soft

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
    tooltip: { 
      trigger: 'axis',
      backgroundColor: '#0F1117',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e5e5e5', fontSize: 11 }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { 
      type: 'category', 
      boundaryGap: false, 
      data: dates,
      axisLabel: { color: '#737373', fontSize: 10 }
    },
    yAxis: { 
      type: 'value', 
      scale: true,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#737373', fontSize: 10 }
    },
    series: [
      {
        name: 'Close Price',
        type: 'line',
        data: close_prices,
        smooth: true,
        itemStyle: { color: '#f59e0b' }, // Aksen harga oranye InvestOwl
        lineStyle: { width: 2 },
        symbol: 'none',
        markArea: {
          silent: true,
          data: markAreaData
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
}
