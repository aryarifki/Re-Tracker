"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function VARChart({ irfData }: { irfData: any }) {
  if (!irfData || !irfData.foreign_shock_to_ret) return null;

  const horizon = irfData.foreign_shock_to_ret.length;
  const xAxisData = Array.from({ length: horizon }, (_, i) => `T+${i}`);
  
  const lowerBound = irfData.lower_bound;
  const upperBound = irfData.foreign_shock_to_ret.map((val: number, i: number) => 
    val + (val - lowerBound[i])
  );
  const bandDifference = upperBound.map((up: number, i: number) => up - lowerBound[i]);

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
      data: xAxisData,
      axisLabel: { color: '#737373', fontSize: 10 }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#737373', fontSize: 10 }
    },
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
        areaStyle: { color: '#3b82f6', opacity: 0.1 }, // Transparansi sangat soft (0.1)
        stack: 'confidence',
        symbol: 'none'
      },
      {
        name: 'Impulse Response',
        type: 'line',
        data: irfData.foreign_shock_to_ret,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 3 },
        symbol: 'none'
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
}
