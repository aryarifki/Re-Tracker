// ══════════════════════════════════════════════════════════
// Types — mirror of backend/schemas.py
// ══════════════════════════════════════════════════════════

export interface PriceBar {
  date: string; // YYYY-MM-DD
  ticker: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface PriceHistoryResponse {
  ticker: string;
  count: number;
  data: PriceBar[];
  sort_order: "asc" | "desc";
}

export interface BrokerFlowRow {
  date: string;
  ticker: string;

  bandar_signal: string | null;
  bandar_signal_score: number | null;
  foreign_signal: string | null;

  foreign_net_broker: number | null;
  local_net_broker: number | null;
  gov_net_broker: number | null;

  foreign_net_flow: number | null;
  domestic_net_flow: number | null;
  total_value: number | null;

  conclusion_broker: string | null;
  conclusion_flow: string | null;

  fetched_at: string | null;
}

export interface BrokerFlowHistoryResponse {
  ticker: string;
  count: number;
  data: BrokerFlowRow[];
  sort_order: "asc" | "desc";
}

export interface BrokerFlowSummary {
  ticker: string;
  period_days: number;
  trading_days: number;

  foreign_net_broker_sum: number;
  local_net_broker_sum: number;
  gov_net_broker_sum: number;
  total_value_sum: number;
  foreign_dominance_pct: number;

  latest_bandar_signal: string | null;
  latest_bandar_signal_score: number | null;
  latest_foreign_signal: string | null;

  accumulation_days: number;
  distribution_days: number;

  latest_date: string | null;
}
