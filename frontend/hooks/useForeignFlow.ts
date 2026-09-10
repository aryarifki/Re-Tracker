import useSWR from 'swr';
import { fetchWithCache } from '@/lib/api'; 

export function useForeignFlowAnalytics(ticker: string, lookbackDays: number = 60) {
  const { data, error, isLoading } = useSWR(
    ticker ? `/api/foreign-flow/${ticker}?lookback_days=${lookbackDays}` : null,
    fetchWithCache,
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
