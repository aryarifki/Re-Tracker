"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function BrokerNetworkGraph({ networkData }: { networkData: any }) {
  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    return <div className="flex h-full items-center justify-center text-neutral-500 text-xs">Jaringan broker terlalu sepi/terpecah</div>;
  }

  // Terapkan warna garis berdasarkan korelasi (Positif = Hijau, Negatif = Merah)
  const styledLinks = networkData.links.map((link: any) => ({
    ...link,
    lineStyle: {
      color: link.value > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
      width: Math.abs(link.value) * 5, // Semakin kuat korelasi, semakin tebal
      curveness: 0.2
    }
  }));

  const option = {
    tooltip: {
      backgroundColor: '#0F1117',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e5e5e5', fontSize: 11 },
      formatter: function (params: any) {
        if (params.dataType === 'edge') {
          const type = params.data.value > 0 ? 'Sync Action' : 'Opposite Action';
          const color = params.data.value > 0 ? '#10b981' : '#f43f5e';
          return `${params.data.source} & ${params.data.target}<br/>Correlation: <span style="color:${color}; font-weight:bold;">${params.data.value}</span> (${type})`;
        }
        return `<b>${params.data.name}</b><br/>Syndicate Cluster: ${params.data.category + 1}`;
      }
    },
    // Palet warna kluster sindikat (Soft Pastel)
    color: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
    legend: {
      show: true,
      bottom: '0%',
      textStyle: { color: '#737373', fontSize: 10 },
      icon: 'circle'
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        nodes: networkData.nodes,
        links: styledLinks,
        categories: networkData.categories,
        roam: true, // Bisa di-zoom & pan
        label: {
          show: true,
          position: 'right',
          color: '#e5e5e5',
          fontSize: 10,
          fontWeight: 'bold'
        },
        force: {
          repulsion: 250,
          edgeLength: 60,
          gravity: 0.1
        },
        itemStyle: {
          borderColor: '#0F1117',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
}
