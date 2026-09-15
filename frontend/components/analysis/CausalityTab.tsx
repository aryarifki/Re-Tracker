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

  if (isLoading) return <div className="p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] rounded-xl flex items-center justify-center gap-3 text-[var(--md-sys-color-on-surface-variant)] shadow-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin text-[var(--md-sys-color-primary)]" width="20" /> <span className="text-sm font-medium">Analyzing Granger causality matrix...</span></div>;
  if (error || !causalityData) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-[var(--color-negative)] text-sm rounded-xl">Failed to load causality insights.</div>;

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

  let scoreThemeText = "var(--color-positive)";
  let scoreThemeBorder = "border-[var(--color-positive)] opacity-80";
  let scoreBg = "bg-[var(--color-positive)] opacity-20";
  if (score < 40) {
      scoreThemeText = "var(--color-negative)";
      scoreThemeBorder = "border-[var(--color-negative)] opacity-80";
      scoreBg = "bg-[var(--color-negative)] opacity-20";
  } else if (score <= 70) {
      scoreThemeText = "#f59e0b";
      scoreThemeBorder = "border-amber-500/50";
      scoreBg = "bg-amber-500/20";
  }

  return (
    <div className="space-y-4">
      
      {/* ====== METRIC CARDS (Vanguard Style) ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Granger */}
        <div className={`bg-[var(--md-sys-color-surface-container)] border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[var(--md-sys-color-outline)] transition-colors relative overflow-hidden ${granger?.is_significant ? "border-[var(--color-positive)]" : "border-amber-500/30"}`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] opacity-80 ${granger?.is_significant ? "bg-[var(--color-positive)]" : "bg-amber-500"}`}></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:chart-line-up-duotone" style={{ color: granger?.is_significant ? "var(--color-positive)" : "#f59e0b" }} width="18" />
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider opacity-80">Foreign flow granger</span>
            </div>
            {granger ? (
                <div>
                    <div className="text-xl font-semibold tracking-tight" style={{ color: granger?.is_significant ? "var(--color-positive)" : "#f59e0b" }}>
                        {granger.is_significant ? "Significant" : "Not significant"}
                    </div>
                    <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 font-mono tabular-nums">
                        p={granger.min_p_value.toFixed(4)}, lag {granger.best_lag}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="text-xl font-semibold tracking-tight text-[var(--md-sys-color-on-surface-variant)]">Unavailable</div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">Insufficient observations</div>
                </div>
            )}
        </div>

        {/* Card 2: Conviction */}
        <div className={`bg-[var(--md-sys-color-surface-container)] border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[var(--md-sys-color-outline)] transition-colors relative overflow-hidden ${scoreThemeBorder}`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] ${scoreBg}`}></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:scales-duotone" style={{ color: scoreThemeText }} width="18" />
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider opacity-80">Conviction model</span>
            </div>
            <div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums" style={{ color: scoreThemeText }}>
                    {score.toFixed(1)}<span className="text-sm font-medium opacity-50">/100</span>
                </div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">Weighted validation score</div>
            </div>
        </div>

        {/* Card 3: Validation */}
        <div className="bg-[var(--md-sys-color-surface-container)] border border-blue-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[var(--md-sys-color-outline)] transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] opacity-80 bg-blue-500"></div>
            <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:check-circle-duotone" className="text-blue-500" width="18" />
                <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider opacity-80">Broker validation</span>
            </div>
            <div>
                <div className="text-xl font-semibold tracking-tight text-blue-500 dark:text-blue-400 truncate" title={brokerNote}>
                    {brokerNote}
                </div>
                <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">Historical forward returns</div>
            </div>
        </div>
      </div>

      {/* ====== DATA MATRICES ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Matrix 1: Participant */}
        <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 shadow-sm flex flex-col h-fit transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3 flex-shrink-0">
                <Icon icon="ph:users-three-duotone" className="text-[var(--md-sys-color-on-surface-variant)]" width="18" height="18" />
                <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Participant Causality</h3>
            </div>
          
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--md-sys-color-outline-variant)] pb-2 flex-grow">
                <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[var(--md-sys-color-surface-container)]">
                    <tr className="text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Participant</th>
                        <th className="py-2.5 px-3 text-right font-medium">Lag</th>
                        <th className="py-2.5 px-3 text-right font-medium">P-Value</th>
                        <th className="py-2.5 px-3 text-center font-medium rounded-tr-md">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                    {(causalityData.participant_causality || []).map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[var(--md-sys-color-on-surface)]">{p.participant}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">{p.lag}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">{p.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-center">
                        {p.is_significant ? (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(causalityData.participant_causality || []).length === 0 && (
                    <div className="py-8 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">Insufficient participant history.</div>
                )}
            </div>
        </div>

        {/* Matrix 2: Top Broker */}
        <div className="bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 shadow-sm flex flex-col h-[400px] transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--md-sys-color-outline-variant)] pb-3 flex-shrink-0">
                <Icon icon="ph:buildings-duotone" className="text-[var(--md-sys-color-on-surface-variant)]" width="18" height="18" />
                <h3 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Top Broker Causality</h3>
            </div>
          
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--md-sys-color-outline-variant)] pb-2 flex-grow">
                <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-[var(--md-sys-color-surface-container)] z-10">
                    <tr className="text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)]">
                        <th className="py-2.5 px-3 font-medium rounded-tl-md">Broker</th>
                        <th className="py-2.5 px-3 text-right font-medium">Lag</th>
                        <th className="py-2.5 px-3 text-right font-medium">P-Value</th>
                        <th className="py-2.5 px-3 text-center font-medium rounded-tr-md">Significant</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/30">
                    {(causalityData.top_brokers || []).map((b: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-500 dark:text-blue-400">{b.code}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface-variant)]">{b.lag}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">{b.p_value.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-center">
                        {b.is_significant ? (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">YES</span>
                        ) : (
                            <span className="px-2 py-[1.5px] rounded border font-semibold tracking-wide text-[9px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)]">NO</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(causalityData.top_brokers || []).length === 0 && (
                    <div className="py-8 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">Insufficient broker history.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
