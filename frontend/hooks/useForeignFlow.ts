import useSWR from 'swr';
import { fetchWithCache } from '@/lib/api'; 

export function useForeignFlowAnalytics(ticker: string, lookbackDays: number = 60) {
  const { data, error, isLoading } = useSWR(
    ticker ? `/api/foreign-flow/${ticker}?lookback_days=${lookbackDays}` : null,
    async (url) => {
      const res = await fetchWithCache(url);
      // Jika fetchWithCache mereturn null (gagal), paksa SWR membacanya sebagai error
      if (!res) throw new Error("Gagal mengambil data dari API");
      return res;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    isError: error
  };
}
