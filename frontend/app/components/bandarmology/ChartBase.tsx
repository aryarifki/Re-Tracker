"use client";
import ReactECharts from "echarts-for-react";

const base = {
  backgroundColor: "transparent",
  textStyle: { color: "#8a8a8a" },
};

export default function ChartBase({ option, height = 300 }: { option: object; height?: number }) {
  return (
    <ReactECharts
      option={{ ...base, ...option }}
      style={{ height }}
      notMerge
      theme="dark"
    />
  );
}

export const axisCommon = {
  axisLine: { lineStyle: { color: "#222" } },
  axisLabel: { color: "#8a8a8a", fontSize: 10 },
  splitLine: { lineStyle: { color: "#161616" } },
};
