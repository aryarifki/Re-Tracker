import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Gagal mengambil data analitik");
  }
  
  return res.json();
};

export function useForeignFlowAnalytics(ticker: string, lookbackDays: number = 60) {
  const { data, error, isLoading } = useSWR(
    ticker ? `/api/foreign-flow/${ticker}?lookback_days=${lookbackDays}` : null,
    fetcher,
    {
      revalidateOnFocus: false, 
      dedupingInterval: 60000,  
      shouldRetryOnError: false 
    }
  );

  return {
    data,
    isLoading,
    isError: error
  };
}
