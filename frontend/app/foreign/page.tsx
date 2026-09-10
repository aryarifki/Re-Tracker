import React from 'react';
import ForeignFlowDeepDiveTab from '@/app/components/ff/ForeignFlowDeepDiveTab';
import TickerSearch from '@/components/layout/TickerSearch';

export default function ForeignPage() {
  return (
    <main className="min-h-screen bg-[#08090C] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Kolom Pencarian Global */}
        <TickerSearch />
        
        {/* Komponen Utama */}
        <ForeignFlowDeepDiveTab />
      </div>
    </main>
  );
}
