import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    
    throw new Error(errorData.detail || "Gagal mengambil data analitik dari server");
  }
  
  return res.json();
};

export function useForeignFlowAnalytics(ticker: string, lookbackDays: number = 60) {
  const { data, error, isLoading } = useSWR(
    // URL relatif murni, membiarkan Next.js proxy mengurus sisanya
    ticker ? `/api/foreign-flow/${ticker}?lookback_days=${lookbackDays}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Mencegah fetch berulang saat pindah tab browser
      dedupingInterval: 60000,  // Cache SWR bertahan 1 menit
      shouldRetryOnError: false // Jangan paksa retry jika API mereturn 404 (data saham memang kurang)
    }
  );

  return {
    data,
    isLoading,
    isError: error
  };
}
