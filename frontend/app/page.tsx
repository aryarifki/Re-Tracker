"use client";

import { useEffect, useState } from "react";
import { fetchStockHistory } from "@/lib/api";
import type { PriceHistoryResponse } from "@/types";

export default function Home() {
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Mulai fetch ke:", process.env.NEXT_PUBLIC_API_URL);

    const timeout = setTimeout(() => {
      setError((prev) => prev ?? "Timeout: fetch > 10 detik (kemungkinan host tidak reachable / CORS)");
    }, 10000);

    fetchStockHistory("BBCA", 5)
      .then((d) => {
        clearTimeout(timeout);
        setData(d);
      })
      .catch((e) => {
        clearTimeout(timeout);
        setError(`e.name:{e.name}:e.name:{e.message}`);
      });

    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="mb-4 text-xl font-bold">SM Tracker — Sanity Check</h1>
      <p className="mb-2 text-neutral-400">
        API URL: {process.env.NEXT_PUBLIC_API_URL ?? "(undefined!)"}
      </p>
      {error && <p className="text-red-500">❌ {error}</p>}
      {data ? (
        <pre className="rounded bg-neutral-900 p-4 text-neutral-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        !error && <p>Loading…</p>
      )}
    </main>
  );
}
