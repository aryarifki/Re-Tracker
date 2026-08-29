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
  const url = "/api/bandar/causality/" + ticker + "?analysis_date=" + analysisDate + "&window_days=" + windowDays;
  const { data, error, isLoading } = useSWR(url, fetcher, { refreshInterval: 0 });

  if (isLoading) return <div className="text-neutral-400 p-4 animate-pulse">Loading causality analysis...</div>;
  if (error || !data) return <div className="text-red-400 p-4">Error loading causality data.</div>;

  const granger = data.granger_test;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Foreign Flow Granger</h3>
          {granger ? (
            <React.Fragment>
              <div className={"text-lg font-bold " + (granger.is_significant ? "text-emerald-400" : "text-amber-400")}>
                {granger.is_significant ? "Significant" : "Not Significant"}
              </div>
              <div className="text-sm text-neutral-400 mt-1">
                p={granger.min_p_value.toFixed(4)}, lag {granger.best_lag}
              </div>
            </React.Fragment>
          ) : (
            <div className="text-amber-400 font-bold">Unavailable <span className="text-sm font-normal text-neutral-400 block mt-1">insufficient observations</span></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 flex flex-col h-full">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">Participant Type Causality</h3>
          <div className="overflow-auto max-h-80 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-800 text-neutral-400 border-b border-neutral-700 text-xs">
                <tr>
                  <th className="py-2 px-3">Participant</th>
                  <th className="py-2 px-3 text-right">Lag</th>
                  <th className="py-2 px-3 text-right">P Value</th>
                  <th className="py-2 px-3 text-center">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {(data.participant_causality || []).map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-700/20 transition-colors">
                    <td className="py-2 px-3 font-medium text-neutral-200">{p.participant}</td>
                    <td className="py-2 px-3 text-right text-neutral-300">{p.lag}</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-300">{p.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">
                      {p.is_significant ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400">YES</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(data.participant_causality || []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-500 text-xs">Insufficient participant history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 flex flex-col h-full">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">Top Broker Causality</h3>
          <div className="overflow-auto max-h-80 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-neutral-800 text-neutral-400 border-b border-neutral-700 text-xs">
                <tr>
                  <th className="py-2 px-3">Broker</th>
                  <th className="py-2 px-3 text-right">Lag</th>
                  <th className="py-2 px-3 text-right">P Value</th>
                  <th className="py-2 px-3 text-center">Significant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {(data.top_brokers || []).map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-700/20 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-neutral-200">{b.code}</td>
                    <td className="py-2 px-3 text-right text-neutral-300">{b.lag}</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-300">{b.p_value.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">
                      {b.is_significant ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400">YES</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(data.top_brokers || []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-500 text-xs">Insufficient broker history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
