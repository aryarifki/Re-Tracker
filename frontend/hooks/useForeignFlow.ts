import useSWR from 'swr';
import { fetcher } from '@/lib/api'; 

export function useForeignFlowAnalytics(ticker: string, lookbackDays: number = 60) {
  const { data, error, isLoading } = useSWR(
    ticker ? `/api/foreign-flow/${ticker}?lookback_days=${lookbackDays}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Menghindari fetch ulang berlebih karena data sudah di-cache Redis
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    isError: error
  };
}

