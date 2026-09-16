"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function BrokerHeatmap({ heatmapData }: { heatmapData: any }) {
  if (!heatmapData || !heatmapData.matrix_data || heatmapData.matrix_data.length === 0) {
    return <div className="flex h-full items-center justify-center text-[var(--md-sys-color-on-surface-variant)] text-xs">Data transaksi broker tidak memadai</div>;
  }

  const { x_dates, y_brokers, matrix_data } = heatmapData;
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute('data-theme') === 'dark';

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: isDark ? '#1C1916' : '#FFFFFF',
      borderColor: isDark ? '#52443C' : '#D7C2B4',
      textStyle: { color: isDark ? '#EBE0D9' : '#1E1A17', fontSize: 11 },
      formatter: function (params: any) {
        const date = x_dates[params.value[0]];
        const broker = y_brokers[params.value[1]];
        const zScore = params.value[2].toFixed(2);
        const action = zScore > 0 ? 'Accumulation' : zScore < 0 ? 'Distribution' : 'Neutral';
        const color = zScore > 0 ? (isDark?'#10B981':'#166534') : zScore < 0 ? (isDark?'#F43F5E':'#991B1B') : '#94a3b8';
        return `<b>${broker}</b> on ${date}<br/>Z-Score: <span style="color:${color}; font-weight:bold;">${zScore}</span> (${action})`;
      }
    },
    animation: false,
    grid: { left: '3%', right: '4%', bottom: '15%', top: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: x_dates,
      axisLabel: { color: isDark ? '#D7C2B4' : '#4E453F', fontSize: 9 },
      splitArea: { show: true, areaStyle: { color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)'] } }
    },
    yAxis: {
      type: 'category',
      data: y_brokers,
      axisLabel: { color: isDark ? '#EBE0D9' : '#1E1A17', fontSize: 10, fontWeight: 'bold' },
      splitArea: { show: true }
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      itemWidth: 10,
      itemHeight: 140,
      textStyle: { color: isDark ? '#D7C2B4' : '#4E453F', fontSize: 10 },
      inRange: {
        color: ['rgba(244, 63, 94, 0.7)', isDark ? '#1C1916' : '#F3E7DB', 'rgba(16, 185, 129, 0.7)']
      }
    },
    series: [
      {
        name: 'Broker Flow Intensity',
        type: 'heatmap',
        data: matrix_data,
        label: { show: false },
        itemStyle: {
          borderColor: isDark ? '#0B0A08' : '#EDDFD3',
          borderWidth: 1
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
}
