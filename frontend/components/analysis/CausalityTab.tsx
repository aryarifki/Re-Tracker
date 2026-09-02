"use client";

import React from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CausalityProps {
  ticker: string;
  analysisDate: string;
  windowDays: number;
}

export default function CausalityTab({ ticker, analysisDate, windowDays }: CausalityProps) {
  const url = `/api/bandar/causality/${ticker}?analysis_date=${analysisDate}&window_days=${windowDays}`;
  const { data: causalityData, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0, revalidateOnFocus: false });

  const detailUrl = `/api/bandar/detail/${ticker}?analysis_date=${analysisDate}&window_days=${windowDays}&horizon=10`;
  const { data: detailData } = useSWR(detailUrl, fetcher, { refreshInterval: 0, revalidateOnFocus: false });

  if (isLoading) return <div className="p-8 border border-white/[0.07] bg-[#0F1117] rounded-xl flex items-center justify-center gap-3 text-neutral-400 shadow-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> <span className="text-sm font-medium">Analyzing Granger causality matrix...</span></div>;
  if (error || !causalityData) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">Failed to load causality insights.</div>;

  const granger = causalityData.granger_test;
  const score = detailData?.conviction?.score ?? detailData?.conviction_score ?? detailData?.score ?? 0;
  
  let brokerNote = detailData?.conviction_breakdown?.broker_note || detailData?.conviction?.broker_note || detailData?.broker_note;
  if (!brokerNote && detailData?.verdict) {
    const v = detailData.verdict;
    const matchBroker = v.match(/Broker ([A-Z0-9]+) is/i);
    const matchWinRate = v.match(/win rate (\d+%)/i);
    if (matchBroker && matchWinRate) {
      brokerNote = `${matchBroker[1]} win rate ${matchWinRate[1]}`;
    } else if (v.includes("not yet statistically strong")) {
      brokerNote = "No broker validation sample";
    }
  }
  brokerNote = brokerNote || "Unavailable";

  // Score styling
  let scoreThemeText = "text-emerald-400";
  let scoreThemeBorder = "border-emerald-500/30";
  if (score < 40) {
      scoreThemeText = "text-rose-400";
      scoreThemeBorder = "border-rose-500/30";
  } else if (score <= 70) {
      scoreThemeText = "text-amber-400";
      scoreThemeBorder = "border-amber-500/30";
  }

  return (
    <div className="space-y-4">
      
      {/* ====== METRIC CARDS (Vanguard Style) ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Granger */}
        <div className={`bg-[#0F1117] border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-white/[0.15] transition-colors relative overflow-hidden ${granger?.is_significant ? "border-emerald-500/30" : "border-amber-500/30"}`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] opacity-80 ${granger?.is_significant ? "bg-emerald-500" : "bg-amber-500"}`}></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:chart-line-up-duotone" className={granger?.is_significant ? "text-emerald-400" : "text-amber-400"} width="18" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider opacity-80">Foreign flow granger</span>
            </div>
            {granger ? (
                <div>
                    <div className={`text-xl font-semibold tracking-tight ${granger.is_significant ? "text-emerald-400" : "text-amber-400"}`}>
                        {granger.is_significant ? "Significant" : "Not significant"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 font-mono tabular-nums">
                        p={granger.min_p_value.toFixed(4)}, lag {granger.best_lag}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="text-xl font-semibold tracking-tight text-neutral-500">Unavailable</div>
                    <div className="text-[11px] text-neutral-600 mt-1">Insufficient observations</div>
                </div>
            )}
        </div>

        {/* Card 2: Conviction */}
        <div className={`bg-[#0F1117] border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-white/[0.15] transition-colors relative overflow-hidden ${scoreThemeBorder}`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] opacity-80 ${scoreThemeText.replace("text-", "bg-")}`}></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:scales-duotone" className={scoreThemeText} width="18" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider opacity-80">Conviction model</span>
            </div>
            <div>
                <div className={`text-2xl font-semibold tracking-tight tabular-nums ${scoreThemeText}`}>
                    {score.toFixed(1)}<span className="text-sm font-medium opacity-50">/100</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Weighted validation score</div>
            </div>
        </div>

        {/* Card 3: Validation */}
        <div className="bg-[#0F1117] border border-blue-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-white/[0.15] transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-80 bg-blue-500"></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:check-circle-duotone" className="text-blue-400" width="18" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider opacity-80">Broker validation</span>
            </div>
            <div>
                <div className="text-xl font-semibold tracking-tight text-blue-100 truncate" title={brokerNote}>
                    {brokerNote}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Historical forward returns</div>
            </div>
        </div>
      </div>

      {/* ====== DATA MATRICES ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Matrix 1: Participant */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm flex flex-col h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3 flex-shrink-0">
                <Icon icon="ph:users-three-duotone" className="text-neutral-400" width="18" height="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Participant Causality</h3>
            </div>
          
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2 flex-grow">
                <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#0F1117]">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Participant</th>
                        <th className="py-2.5 px-3 text-right font-medium">Lag</th>
                        <th className="py-2.5 px-3 text-right font-medium">P-Value</th>
                        <th className="py-2.5 px-3 text-center font-medium rounded-tr-md">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                    {(causalityData.participant_causality || []).map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-neutral-200">{p.participant}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-400">{p.lag}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-300">{p.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-center">
                        {p.is_significant ? (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-neutral-800 text-neutral-500 border-neutral-700">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(causalityData.participant_causality || []).length === 0 && (
                    <div className="py-8 text-center text-neutral-500 text-xs">Insufficient participant history.</div>
                )}
            </div>
        </div>

        {/* Matrix 2: Top Broker */}
        <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-white/[0.05] pb-3 flex-shrink-0">
                <Icon icon="ph:buildings-duotone" className="text-neutral-400" width="18" height="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Top Broker Causality</h3>
            </div>
          
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2 flex-grow">
                <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-[#0F1117] z-10">
                    <tr className="text-neutral-500 border-b border-white/[0.05] bg-[#08090C]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Broker</th>
                        <th className="py-2.5 px-3 text-right font-medium">Lag</th>
                        <th className="py-2.5 px-3 text-right font-medium">P-Value</th>
                        <th className="py-2.5 px-3 text-center font-medium rounded-tr-md">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                    {(causalityData.top_brokers || []).map((b: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{b.code}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-400">{b.lag}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-300">{b.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-center">
                        {b.is_significant ? (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-neutral-800 text-neutral-500 border-neutral-700">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(causalityData.top_brokers || []).length === 0 && (
                    <div className="py-8 text-center text-neutral-500 text-xs">Insufficient broker history.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
