import type {
  BrokerFlowHistoryResponse,
  BrokerFlowRow,
  BrokerFlowSummary,
  PriceHistoryResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request(path: string) {
  const url = API_URL + path; // ← tanpa template literal, aman dari bug copy-paste
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (err) {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export function fetchStockHistory(ticker: string, limit: number = 250) {
  return request("/stocks/" + ticker + "/history?limit=" + limit) as Promise<PriceHistoryResponse>;
}

export function fetchBrokerLatest(ticker: string) {
  return request("/broker-flow/" + ticker + "/latest") as Promise<BrokerFlowRow>;
}

export function fetchBrokerHistory(ticker: string, limit: number = 60) {
  return request("/broker-flow/" + ticker + "/history?limit=" + limit) as Promise<BrokerFlowHistoryResponse>;
}

export function fetchBrokerSummary(ticker: string, days: number = 30) {
  return request("/broker-flow/" + ticker + "/summary?days=" + days) as Promise<BrokerFlowSummary>;
}

export { ApiError };
