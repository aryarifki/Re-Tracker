"use client";

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import ForeignFlowDeepDiveTab from '@/app/components/ff/ForeignFlowDeepDiveTab';

export default function ForeignPage() {
  const { activeTicker } = useAppStore();

  return (
    <main className="min-h-screen bg-[#08090C]">
      
      {/* Sub-Header Ticker (Menduplikasi gaya Dashboard) */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.07] bg-[#0F1117] sticky top-0 z-10">
        <button className="text-slate-400 hover:text-white transition-colors focus:outline-none">
          {/* Ikon Hamburger bawaan */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </button>
        <h2 className="text-[17px] font-bold text-slate-100 tracking-wide">{activeTicker}</h2>
      </div>

      {/* Komponen Utama */}
      <ForeignFlowDeepDiveTab />
      
    </main>
  );
}
