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

  if (isLoading && !data) return <div className="p-8 border border-white/[0.07] bg-[#0F1117] rounded-xl flex items-center justify-center gap-3 text-neutral-400 shadow-sm"><Icon icon="ph:spinner-gap-duotone" className="animate-spin" width="20" /> <span className="text-sm font-medium">Extracting raw database records...</span></div>;
  if (error) return <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">Error loading raw tables.</div>;

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

  const getTypeChip = (type: string) => {
    const t = (type || "").toUpperCase();
    if (t === "FOREIGN" || t === "ASING") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (t === "LOCAL" || t === "LOKAL") return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    if (t === "GOV" || t === "PEMERINTAH") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    return "text-neutral-400 bg-neutral-800 border-neutral-700";
  };

  const getSignalTheme = (sig: string) => {
    const s = (sig || "").toUpperCase();
    if (s.includes("ACCUMULATION") || s.includes("BUY")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (s.includes("DISTRIBUTION") || s.includes("SELL")) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    return "text-neutral-400 bg-[#08090C] border-white/[0.07]";
  };

  return (
    <div className="space-y-4">
      
      {/* ====== TABLE 1: BROKER FLOW ROWS ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/[0.05] pb-3 gap-4">
            <div className="flex items-center gap-2">
                <Icon icon="ph:database-duotone" className="text-blue-500" width="18" height="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Broker Flow Records</h3>
            </div>
            
            <button 
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090C] hover:bg-neutral-800 border border-white/[0.07] rounded-md text-xs font-semibold text-neutral-300 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Icon 
                icon={isValidating ? "ph:spinner-gap-duotone" : "ph:arrows-clockwise-bold"} 
                className={isValidating ? "animate-spin text-neutral-500" : "text-neutral-400"} 
                width="14" height="14" 
              />
              <span>{isValidating ? "Syncing..." : "Refresh Matrix"}</span>
            </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="sticky top-0 bg-[#0F1117] z-10">
              <tr className="bg-[#08090C] text-neutral-500 border-b border-white/[0.05]">
                <th className="py-2.5 px-4 font-medium rounded-tl-md">Date</th>
                <th className="py-2.5 px-4 font-medium">Signal</th>
                <th className="py-2.5 px-4 text-center font-medium">Score</th>
                <th className="py-2.5 px-4 text-right font-medium">Foreign Net</th>
                <th className="py-2.5 px-4 text-right font-medium">Local Net</th>
                <th className="py-2.5 px-4 text-right font-medium rounded-tr-md">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {flowRows.map((row: any, idx: number) => {
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors text-neutral-300">
                    <td className="py-2.5 px-4 font-mono text-neutral-400">{row.date}</td>
                    <td className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[10px]">
                        <span className={`px-2 py-0.5 rounded border ${getSignalTheme(row.signal)}`}>
                            {row.signal}
                        </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold">
                        <span className={`px-1.5 py-[1px] rounded text-[10px] ${row.score > 0 ? "bg-emerald-500/20 text-emerald-400" : row.score < 0 ? "bg-rose-500/20 text-rose-400" : "text-neutral-400 bg-neutral-800"}`}>
                            {row.score}
                        </span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-medium ${row.foreign_net > 0 ? "text-emerald-400/90" : row.foreign_net < 0 ? "text-rose-400/90" : "text-neutral-500"}`}>
                        {fmtRp(row.foreign_net)}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-medium ${row.local_net > 0 ? "text-emerald-400/90" : row.local_net < 0 ? "text-rose-400/90" : "text-neutral-500"}`}>
                        {fmtRp(row.local_net)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-200">{fmtRp(row.total_value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {flowRows.length === 0 && <div className="p-8 text-center text-neutral-500 text-xs">No flow records found in active window.</div>}
        </div>
      </div>

      {/* ====== TABLE 2: BROKER ACTIVITY ROWS ====== */}
      <div className="bg-[#0F1117] border border-white/[0.07] rounded-xl p-5 shadow-sm flex flex-col h-[600px]">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 border-b border-white/[0.05] pb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
                <Icon icon="ph:list-numbers-duotone" className="text-blue-500" width="18" height="18" />
                <h3 className="text-sm font-semibold text-neutral-200">Broker Activity Logs</h3>
            </div>
            
            <div className="flex items-center bg-[#08090C] border border-white/[0.07] rounded-md px-2.5 py-1.5 focus-within:border-blue-500/50 transition-colors">
                <Icon icon="ph:magnifying-glass-duotone" className="text-neutral-500 mr-2" width="16" height="16" />
                <input 
                    type="text" 
                    placeholder="Search broker (e.g. YP)" 
                    value={searchTerm}
                    onChange={handleSearch}
                    className="bg-transparent border-none outline-none text-xs text-neutral-200 w-48 uppercase placeholder-neutral-600 font-mono"
                />
            </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 pb-2 flex-grow">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="sticky top-0 bg-[#0F1117] z-10">
              <tr className="bg-[#08090C] text-neutral-500 border-b border-white/[0.05]">
                <th className="py-2.5 px-4 font-medium rounded-tl-md">Date</th>
                <th className="py-2.5 px-4 font-medium">Broker</th>
                <th className="py-2.5 px-4 font-medium">Type</th>
                <th className="py-2.5 px-4 text-right font-medium">Buy</th>
                <th className="py-2.5 px-4 text-right font-medium">Sell</th>
                <th className="py-2.5 px-4 text-right font-medium">Net</th>
                <th className="py-2.5 px-4 text-right font-medium rounded-tr-md">Freq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {currentActRows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors text-neutral-300">
                  <td className="py-2.5 px-4 font-mono text-neutral-400">{row.date}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-neutral-200">{row.broker}</td>
                  <td className="py-2.5 px-4">
                     <span className={`px-2 py-[1.5px] rounded text-[9px] font-bold border tracking-wide uppercase ${getTypeChip(row.type)}`}>
                        {row.type}
                     </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-400/80">{fmtRp(row.buy)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-400/80">{fmtRp(row.sell)}</td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.net > 0 ? "text-emerald-400" : row.net < 0 ? "text-rose-400" : "text-neutral-500"}`}>
                      {fmtRp(row.net)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-neutral-500">{row.freq.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentActRows.length === 0 && (
            <div className="p-8 text-center text-neutral-500 text-xs font-medium">
              {searchTerm ? `No activity found for broker "${searchTerm.toUpperCase()}".` : "No activity records found."}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredActRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-2 flex-shrink-0">
            <span className="text-[11px] text-neutral-500 font-medium">
              Showing <span className="text-neutral-300 font-mono">{indexOfFirstRow + 1}</span> to <span className="text-neutral-300 font-mono">{Math.min(indexOfLastRow, filteredActRows.length)}</span> of <span className="text-neutral-300 font-mono">{filteredActRows.length}</span> rows
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-[#08090C] border border-white/[0.07] rounded-md text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Icon icon="ph:caret-left-bold" /> Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 bg-[#08090C] border border-white/[0.07] rounded-md text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                Next <Icon icon="ph:caret-right-bold" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
