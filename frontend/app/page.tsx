"use client";

import { useEffect, useState } from "react";
import { fetchStockHistory } from "@/lib/api";
import type { PriceHistoryResponse } from "@/types";

export default function Home() {
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStockHistory("BBCA", 5)
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="mb-4 text-xl font-bold">SM Tracker — Sanity Check</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
      {data ? (
        <pre className="rounded bg-neutral-900 p-4 text-neutral-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading…</p>
      )}
    </main>
  );
}
