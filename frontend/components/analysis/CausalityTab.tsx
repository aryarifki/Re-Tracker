"use client";

import React from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CausalityProps {
  ticker: string;
  analysisDate: string;
  windowDays: number;
}

export default function CausalityTab({ ticker, analysisDate, windowDays }: CausalityProps) {
  // 1. Fetch Causality Data
  const url = "/api/bandar/causality-insight/" + ticker + "?analysis_date=" + analysisDate + "&window_days=" + windowDays;
  const { data: causalityData, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0 });

  // 2. Fetch Detail Data MANDIRI
  const detailUrl = "/api/bandar/detail/" + ticker + "?analysis_date=" + analysisDate + "&window_days=" + windowDays + "&horizon=10";
  const { data: detailData } = useSWR(detailUrl, fetcher, { refreshInterval: 0 });

  if (isLoading) return <div className="text-neutral-300 font-medium p-4 animate-pulse">Loading causality analysis...</div>;
  if (error || !causalityData) return <div className="text-red-400 font-bold p-4">Error loading causality data.</div>;

  const granger = causalityData.granger_test;
  const score = detailData?.conviction?.score ?? detailData?.conviction_score ?? detailData?.score ?? 0;
  
  // LOGIKA JENIUS: Jika backend tidak mereturn broker_note, kita ambil dari verdict!
  let brokerNote = detailData?.conviction?.broker_note || detailData?.broker_note;
  if (!brokerNote && detailData?.verdict) {
    const v = detailData.verdict;
    const matchBroker = v.match(/Broker ([A-Z0-9]+) is/i);
    const matchWinRate = v.match(/win rate (\d+%)/i);
    if (matchBroker && matchWinRate) {
      brokerNote = matchBroker[1] + " win rate " + matchWinRate[1];
    } else if (v.includes("not yet statistically strong")) {
      brokerNote = "No broker validation sample";
    }
  }
  brokerNote = brokerNote || "Unavailable";

  let scoreColor = "border-emerald-500";
  let scoreText = "text-emerald-400";
  if (score < 40) {
    scoreColor = "border-rose-500";
    scoreText = "text-rose-400";
  } else if (score <= 70) {
    scoreColor = "border-amber-500";
    scoreText = "text-amber-400";
  }

  return (
    <div className="space-y-6">
      {/* KARTU ATAS (3 KOLOM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={"bg-neutral-800 border border-neutral-700 rounded-xl p-3 border-l-4 shadow-md " + (granger?.is_significant ? "border-emerald-500" : "border-amber-500")}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Foreign Flow Granger</h3>
          {granger ? (
            <React.Fragment>
              <div className={"text-base font-bold " + (granger.is_significant ? "text-emerald-400" : "text-amber-400")}>
                {granger.is_significant ? "Significant" : "Not Significant"}
              </div>
              <div className="text-[12px] text-neutral-300 mt-1 truncate">
                p={granger.min_p_value.toFixed(4)}, lag {granger.best_lag}
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="text-base font-bold text-amber-400">Unavailable</div>
              <div className="text-[12px] text-neutral-400 mt-1 truncate">insufficient observations</div>
            </React.Fragment>
          )}
        </div>

        <div className={"bg-neutral-800 border border-neutral-700 rounded-xl p-3 border-l-4 shadow-md " + scoreColor}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Conviction Model</h3>
          <div className={"text-base font-bold tabular-nums " + scoreText}>
            {score.toFixed(1)}/100
          </div>
          <div className="text-[12px] text-neutral-300 mt-1 truncate">hover score card for formula</div>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 border-l-4 shadow-md border-slate-400">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Broker Validation</h3>
          <div className="text-base font-bold text-slate-100 truncate" title={brokerNote}>
            {brokerNote}
          </div>
          <div className="text-[12px] text-neutral-300 mt-1 truncate">historical forward returns</div>
        </div>
      </div>

      {/* TABEL BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 flex flex-col h-full shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">Participant Type Causality</h3>
          <div className="overflow-auto max-h-80 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-800 text-neutral-300 border-b border-neutral-600 text-xs">
                <tr>
                  <th className="py-2 px-3 font-semibold">Participant</th>
                  <th className="py-2 px-3 text-right font-semibold">Lag</th>
                  <th className="py-2 px-3 text-right font-semibold">P Value</th>
                  <th className="py-2 px-3 text-center font-semibold">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {(causalityData.participant_causality || []).map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-700/60 transition-colors">
                    <td className="py-2 px-3 font-bold text-neutral-100">{p.participant}</td>
                    <td className="py-2 px-3 text-right font-semibold text-neutral-200">{p.lag}</td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-neutral-200">{p.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">
                      {p.is_significant ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold">YES</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300 border border-neutral-500 font-bold">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(causalityData.participant_causality || []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-400 font-medium text-xs">Insufficient participant history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-600 flex flex-col h-full shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">Top Broker Causality</h3>
          <div className="overflow-auto max-h-80 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-800 text-neutral-300 border-b border-neutral-600 text-xs">
                <tr>
                  <th className="py-2 px-3 font-semibold">Broker</th>
                  <th className="py-2 px-3 text-right font-semibold">Lag</th>
                  <th className="py-2 px-3 text-right font-semibold">P Value</th>
                  <th className="py-2 px-3 text-center font-semibold">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {(causalityData.top_brokers || []).map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-700/60 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-blue-300">{b.code}</td>
                    <td className="py-2 px-3 text-right font-semibold text-neutral-200">{b.lag}</td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-neutral-200">{b.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">
                      {b.is_significant ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold">YES</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300 border border-neutral-500 font-bold">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(causalityData.top_brokers || []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-400 font-medium text-xs">Insufficient broker history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
