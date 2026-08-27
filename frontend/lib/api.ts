/**
 * API client — semua pemanggilan FastAPI lewat sini.
 * Mengembalikan SWR fetcher-compatible functions.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`APIURL{API_URL}APIU​RL{path}`, {
    headers: { Accept: "application/json" },
    // cache: "no-store" — data saham selalu fresh
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

// ── Stocks ──
export const fetchStockHistory = (
  ticker: string,
  limit = 250,
): Promise<PriceHistoryResponse> =>
  request(`/stocks/ticker/history?limit={ticker}/history?limit=ticker/history?limit={limit}`);

// ── Broker Flow ──
export const fetchBrokerLatest = (ticker: string): Promise<BrokerFlowRow> =>
  request(`/broker-flow/${ticker}/latest`);

export const fetchBrokerHistory = (
  ticker: string,
  limit = 60,
): Promise<BrokerFlowHistoryResponse> =>
  request(`/broker-flow/ticker/history?limit={ticker}/history?limit=ticker/history?limit={limit}`);

export const fetchBrokerSummary = (
  ticker: string,
  days = 30,
): Promise<BrokerFlowSummary> =>
  request(`/broker-flow/ticker/summary?days={ticker}/summary?days=ticker/summary?days={days}`);

export { ApiError };
