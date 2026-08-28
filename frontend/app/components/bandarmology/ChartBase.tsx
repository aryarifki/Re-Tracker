"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export const axisCommon = {
  axisLine: { lineStyle: { color: "#333" } },
  axisLabel: { color: "#8a8a8a", fontSize: 10 },
  splitLine: { lineStyle: { color: "#1c1c1c" } },
};

export default function ChartBase({ option, height = 300 }: { option: any; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, true);
      chartRef.current.resize();
    }
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height: height }} />;
}
