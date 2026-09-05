import type { Metadata } from 'next';
import { Suspense } from 'react';
import TickerClientIsland from './TickerClientIsland';

// SEO Dinamis: Sangat krusial untuk indeksasi Google
export async function generateMetadata({ params }: { params: { ticker: string } }): Promise<Metadata> {
  const ticker = params.ticker.toUpperCase();
  return {
    title: `${ticker} Analytics`,
    description: `Analitik aliran broker dan pergerakan smart money untuk saham ${ticker} di Bursa Efek Indonesia.`,
  };
}

export default function TickerPage({ params }: { params: { ticker: string } }) {
  // Server Component murni. Interaktivitas diserahkan ke Client Island.
  return (
    <Suspense fallback={<div className="p-10 text-center text-neutral-500 animate-pulse">Menyiapkan Dashboard Analitik...</div>}>
      <TickerClientIsland />
    </Suspense>
  );
}
