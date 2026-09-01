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

  if (isLoading) return <div className="text-neutral-400 font-medium p-8 flex items-center justify-center gap-3 text-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> Analyzing Granger causality matrix...</div>;
  if (error || !causalityData) return <div className="text-rose-400 font-medium p-4 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg">Failed to load causality insights.</div>;

  const granger = causalityData.granger_test;
  const score = detailData?.conviction?.score ?? detailData?.conviction_score ?? detailData?.score ?? 0;
  
  let brokerNote = detailData?.conviction?.broker_note || detailData?.broker_note;
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
  let scoreTheme = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 icon-emerald-400";
  if (score < 40) scoreTheme = "text-rose-400 bg-rose-500/10 border-rose-500/20 icon-rose-400";
  else if (score <= 70) scoreTheme = "text-amber-400 bg-amber-500/10 border-amber-500/20 icon-amber-400";

  return (
    <div className="space-y-6">
      
      {/* METRIC CARDS (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Granger */}
        <div className={`bg-[#0f0f11] border rounded-xl p-5 shadow-sm flex flex-col justify-between ${granger?.is_significant ? "border-emerald-500/30" : "border-amber-500/30"}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:chart-line-up-duotone" className={granger?.is_significant ? "text-emerald-400" : "text-amber-400"} width="18" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Foreign flow granger</span>
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
                    <div className="text-xs text-neutral-600 mt-1">Insufficient observations</div>
                </div>
            )}
        </div>

        {/* Card 2: Conviction */}
        <div className={`bg-[#0f0f11] border rounded-xl p-5 shadow-sm flex flex-col justify-between ${scoreTheme.split(' ').find(c => c.startsWith('border-'))}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:scales-duotone" className={scoreTheme.split(' ').find(c => c.startsWith('text-'))} width="18" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Conviction model</span>
            </div>
            <div>
                <div className={`text-2xl font-semibold tracking-tight tabular-nums ${scoreTheme.split(' ').find(c => c.startsWith('text-'))}`}>
                    {score.toFixed(1)}<span className="text-sm font-medium opacity-50">/100</span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">Weighted validation score</div>
            </div>
        </div>

        {/* Card 3: Validation */}
        <div className="bg-[#0f0f11] border border-blue-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:check-circle-duotone" className="text-blue-400" width="18" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Broker validation</span>
            </div>
            <div>
                <div className="text-xl font-semibold tracking-tight text-blue-100 truncate" title={brokerNote}>
                    {brokerNote}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Historical forward returns</div>
            </div>
        </div>
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Table 1: Participant */}
        <div className="bg-[#0f0f11] border border-neutral-800/80 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3 flex-shrink-0">
                <div className="p-1.5 bg-neutral-800/50 rounded-md border border-neutral-700/50">
                    <Icon icon="ph:users-three-duotone" className="text-neutral-300" width="18" height="18" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-100 tracking-tight">Participant causality</h3>
            </div>
          
            <div className="overflow-x-auto rounded-lg border border-neutral-800/60 bg-[#141417] flex-grow">
                <table className="w-full text-left whitespace-nowrap text-sm">
                <thead className="sticky top-0 bg-[#1a1a1d] text-neutral-400 font-medium border-b border-neutral-800/80 z-10">
                    <tr>
                    <th className="py-2.5 px-4 font-medium">Participant</th>
                    <th className="py-2.5 px-4 text-right font-medium">Lag</th>
                    <th className="py-2.5 px-4 text-right font-medium">P-Value</th>
                    <th className="py-2.5 px-4 text-center font-medium">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                    {(causalityData.participant_causality || []).map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-neutral-200">{p.participant}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-neutral-400">{p.lag}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-neutral-300">{p.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-center">
                        {p.is_significant ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-500 border border-neutral-700">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                    {(causalityData.participant_causality || []).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-neutral-500 text-xs">Insufficient participant history.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>

        {/* Table 2: Top Broker */}
        <div className="bg-[#0f0f11] border border-neutral-800/80 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3 flex-shrink-0">
                <div className="p-1.5 bg-neutral-800/50 rounded-md border border-neutral-700/50">
                    <Icon icon="ph:buildings-duotone" className="text-neutral-300" width="18" height="18" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-100 tracking-tight">Top broker causality</h3>
            </div>
          
            <div className="overflow-x-auto rounded-lg border border-neutral-800/60 bg-[#141417] flex-grow">
                <table className="w-full text-left whitespace-nowrap text-sm">
                <thead className="sticky top-0 bg-[#1a1a1d] text-neutral-400 font-medium border-b border-neutral-800/80 z-10">
                    <tr>
                    <th className="py-2.5 px-4 font-medium">Broker</th>
                    <th className="py-2.5 px-4 text-right font-medium">Lag</th>
                    <th className="py-2.5 px-4 text-right font-medium">P-Value</th>
                    <th className="py-2.5 px-4 text-center font-medium">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                    {(causalityData.top_brokers || []).map((b: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-400">{b.code}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-neutral-400">{b.lag}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-neutral-300">{b.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-4 text-center">
                        {b.is_significant ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-500 border border-neutral-700">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                    {(causalityData.top_brokers || []).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-neutral-500 text-xs">Insufficient broker history.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
