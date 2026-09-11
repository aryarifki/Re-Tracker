"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function VARChart({ irfData }: { irfData: any }) {
  if (!irfData || !irfData.foreign_shock_to_ret || !irfData.lower_bound || !irfData.upper_bound) return null;

  const horizon = irfData.foreign_shock_to_ret.length;
  const xAxisData = Array.from({ length: horizon }, (_, i) => `T+${i}`);
  
  const lowerBound = irfData.lower_bound;
  const upperBound = irfData.upper_bound;
  
  // Kalkulasi selisih tinggi area untuk ECharts stack
  const bandDifference = upperBound.map((up: number, i: number) => up - lowerBound[i]);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
    yAxis: { type: 'value', name: 'Shock Response' },
    series: [
      {
        name: 'Lower Bound',
        type: 'line',
        data: lowerBound,
        lineStyle: { opacity: 0 },
        stack: 'confidence',
        symbol: 'none'
      },
      {
        name: 'Upper Bound',
        type: 'line',
        data: bandDifference,
        lineStyle: { opacity: 0 },
        areaStyle: { color: '#93c5fd', opacity: 0.3 },
        stack: 'confidence',
        symbol: 'none'
      },
      {
        name: 'Impulse Response',
        type: 'line',
        data: irfData.foreign_shock_to_ret,
        smooth: true,
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3 }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />;
}
