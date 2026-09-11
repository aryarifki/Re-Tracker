"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function BrokerHeatmap({ heatmapData }: { heatmapData: any }) {
  if (!heatmapData || !heatmapData.matrix_data || heatmapData.matrix_data.length === 0) {
    return <div className="flex h-full items-center justify-center text-neutral-500 text-xs">Data transaksi broker tidak memadai</div>;
  }

  const { x_dates, y_brokers, matrix_data } = heatmapData;

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: '#0F1117',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e5e5e5', fontSize: 11 },
      formatter: function (params: any) {
        const date = x_dates[params.value[0]];
        const broker = y_brokers[params.value[1]];
        const zScore = params.value[2].toFixed(2);
        const action = zScore > 0 ? 'Accumulation' : zScore < 0 ? 'Distribution' : 'Neutral';
        const color = zScore > 0 ? '#10b981' : zScore < 0 ? '#f43f5e' : '#94a3b8';
        return `<b>${broker}</b> on ${date}<br/>Z-Score: <span style="color:${color}; font-weight:bold;">${zScore}</span> (${action})`;
      }
    },
    animation: false,
    grid: { left: '3%', right: '4%', bottom: '15%', top: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: x_dates,
      axisLabel: { color: '#737373', fontSize: 9 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] } }
    },
    yAxis: {
      type: 'category',
      data: y_brokers,
      axisLabel: { color: '#e5e5e5', fontSize: 10, fontWeight: 'bold' },
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
      textStyle: { color: '#737373', fontSize: 10 },
      inRange: {
        color: ['rgba(244, 63, 94, 0.7)', '#0F1117', 'rgba(16, 185, 129, 0.7)'] // Merah Soft -> Gelap -> Hijau Soft
      }
    },
    series: [
      {
        name: 'Broker Flow Intensity',
        type: 'heatmap',
        data: matrix_data,
        label: { show: false },
        itemStyle: {
          borderColor: '#171a21', // Garis pemisah antar kotak
          borderWidth: 1
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
}
