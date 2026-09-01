"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Icon } from "@iconify/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RawTablesProps {
  ticker: string;
  analysisDate: string;
  windowDays: number;
}

export default function RawTablesTab({ ticker, analysisDate, windowDays }: RawTablesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  const url = `/api/bandar/stocks/${ticker}/raw-tables?analysis_date=${analysisDate}&window_days=${windowDays}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, { revalidateOnFocus: false });

  if (isLoading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg h-[400px]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-800">
            <div className="h-4 bg-neutral-800 rounded w-40"></div>
            <div className="h-6 bg-neutral-800 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-neutral-800 rounded-lg w-full"></div>)}
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg h-[550px]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-800">
            <div className="h-4 bg-neutral-800 rounded w-40"></div>
            <div className="h-8 bg-neutral-800 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => <div key={i} className="h-8 bg-neutral-800 rounded-lg w-full"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-red-400 font-bold p-4 text-xs">Error loading raw tables.</div>;

  const flowRows = data?.flow || [];
  const actRows = data?.activity || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredActRows = actRows.filter((r: any) => 
    (r.broker || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredActRows.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentActRows = filteredActRows.slice(indexOfFirstRow, indexOfLastRow);

  const fmtRp = (val: any) => {
    if (val === null || val === undefined || Number.isNaN(val)) return "-";
    if (Number(val) === 0) return "Rp 0";
    const sign = val < 0 ? "-" : "";
    const n = Math.abs(val);
    if (n >= 1e12) return sign + "Rp " + (n / 1e12).toFixed(2) + " T";
    if (n >= 1e9) return sign + "Rp " + (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return sign + "Rp " + (n / 1e6).toFixed(2) + " M";
    return sign + "Rp " + n.toLocaleString("id-ID");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "FOREIGN": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "LOCAL": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "GOV": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      default: return "text-neutral-400 bg-neutral-700/50 border-neutral-600";
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-row justify-between items-center mb-3 border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
                <Icon icon="mdi:table-large" className="text-blue-400" width="18" height="18" />
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Broker Flow Rows</h3>
            </div>
            
            <button 
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md text-xs font-bold text-neutral-300 transition-all disabled:opacity-50"
            >
              <Icon 
                icon={isValidating ? "line-md:loading-twotone-loop" : "mdi:database-refresh-outline"} 
                className={isValidating ? "text-emerald-400" : "text-blue-400"} 
                width="14" height="14" 
              />
              <span className="hidden sm:inline">{isValidating ? "Syncing..." : "Refresh"}</span>
            </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="bg-neutral-800 text-neutral-500 font-bold border-b border-neutral-800">
              <tr>
                <th className="py-2 px-3 text-center">Date</th>
                <th className="py-2 px-3">Signal</th>
                <th className="py-2 px-3 text-center">Score</th>
                <th className="py-2 px-3 text-right">Foreign Net</th>
                <th className="py-2 px-3 text-right">Local Net</th>
                <th className="py-2 px-3 text-right text-blue-400">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {flowRows.map((row: any, idx: number) => {
                const isAcc = (row.signal || "").toUpperCase().includes("ACCUMULATION") || (row.signal || "").toUpperCase().includes("BUY");
                return (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition-colors text-neutral-300">
                    <td className="py-1.5 px-3 text-center font-mono text-neutral-500">{row.date}</td>
                    <td className="py-1.5 px-3 font-semibold">
                        <span className={isAcc ? "text-emerald-400" : "text-rose-400"}>{row.signal}</span>
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${row.score > 0 ? "bg-emerald-500/20 text-emerald-400" : row.score < 0 ? "bg-rose-500/20 text-rose-400" : "text-neutral-400 bg-neutral-800"}`}>
                            {row.score}
                        </span>
                    </td>
                    <td className={`py-1.5 px-3 text-right font-mono font-bold ${row.foreign_net > 0 ? "text-emerald-400" : row.foreign_net < 0 ? "text-rose-400" : "text-neutral-500"}`}>
                        {fmtRp(row.foreign_net)}
                    </td>
                    <td className={`py-1.5 px-3 text-right font-mono font-bold ${row.local_net > 0 ? "text-emerald-400" : row.local_net < 0 ? "text-rose-400" : "text-neutral-500"}`}>
                        {fmtRp(row.local_net)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-blue-400">{fmtRp(row.total_value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {flowRows.length === 0 && <div className="p-4 text-center text-neutral-500 text-xs">No flow records found.</div>}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg flex flex-col h-[550px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 border-b border-neutral-800 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
                <Icon icon="mdi:finance" className="text-purple-400" width="18" height="18" />
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Broker Activity Rows</h3>
            </div>
            
            <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-md overflow-hidden px-2 py-1 focus-within:border-blue-500 transition-colors">
                <Icon icon="mdi:magnify" className="text-neutral-500" width="16" height="16" />
                <input 
                    type="text" 
                    placeholder="SEARCH BROKER (E.G. YP)" 
                    value={searchTerm}
                    onChange={handleSearch}
                    className="bg-transparent border-none outline-none text-xs text-neutral-200 px-2 w-40 uppercase placeholder-neutral-500"
                />
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-800 flex-grow">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="sticky top-0 bg-neutral-800 text-neutral-500 font-bold border-b border-neutral-800 z-10">
              <tr>
                <th className="py-2 px-3 text-center">Date</th>
                <th className="py-2 px-3 text-center">Broker</th>
                <th className="py-2 px-3 text-center">Type</th>
                <th className="py-2 px-3 text-right">Buy</th>
                <th className="py-2 px-3 text-right">Sell</th>
                <th className="py-2 px-3 text-right font-extrabold text-blue-400">Net</th>
                <th className="py-2 px-3 text-right">Freq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {currentActRows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-neutral-800/30 transition-colors text-neutral-300">
                  <td className="py-1.5 px-3 text-center font-mono text-neutral-500">{row.date}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 font-bold rounded text-neutral-200">{row.broker}</span>
                  </td>
                  <td className="py-1.5 px-3 text-center">
                     <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getTypeColor(row.type)}`}>
                        {row.type}
                     </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-neutral-400">{fmtRp(row.buy)}</td>
                  <td className="py-1.5 px-3 text-right font-mono text-neutral-400">{fmtRp(row.sell)}</td>
                  <td className={`py-1.5 px-3 text-right font-mono font-bold ${row.net > 0 ? "text-emerald-400" : row.net < 0 ? "text-rose-400" : "text-neutral-500"}`}>
                      {fmtRp(row.net)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-neutral-500">{row.freq.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentActRows.length === 0 && (
            <div className="p-6 text-center text-neutral-500 text-xs font-medium">
              {searchTerm ? `No activity found for "${searchTerm.toUpperCase()}".` : "No activity records found."}
            </div>
          )}
        </div>

        {filteredActRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-800 pt-3 mt-2 flex-shrink-0">
            <span className="text-xs text-neutral-500 font-medium">
              Showing <span className="text-neutral-300">{indexOfFirstRow + 1}</span> to <span className="text-neutral-300">{Math.min(indexOfLastRow, filteredActRows.length)}</span> of <span className="text-neutral-300">{filteredActRows.length}</span> rows
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs font-bold text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <Icon icon="mdi:chevron-left" width="14" height="14" /> Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs font-bold text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                Next <Icon icon="mdi:chevron-right" width="14" height="14" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
