const IS_CLIENT = typeof window !== 'undefined';

const API_BASE_URL = IS_CLIENT 
  ? (process.env.NEXT_PUBLIC_API_URL || '') 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export async function fetchWithCache<T>(
  path: string,
  revalidateSeconds: number = 60,
  token?: string // Opsional: injeksi token jika endpoint membutuhkan autentikasi
): Promise<T | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: revalidateSeconds },
      headers,
    });

    if (!res.ok) {
      // Penanganan khusus jika token expired / unauthorized
      if (res.status === 401 || res.status === 403) {
        console.warn(`[API Auth Error] Token invalid/expired untuk path: ${path}`);
        return null; 
      }

      const errorBody = await res.json().catch(() => null);
      console.error(`[API Error ${res.status}] ${path}:`, errorBody?.detail || res.statusText);
      
      // Mengembalikan null alih-alih melempar error agar komponen UI bisa me-render fallback
      return null;
    }

    return await res.json();
  } catch (error) {
    // Menangkap error jaringan (misal: backend mati/timeout)
    console.error(`[Network Error] Gagal fetch ${path}:`, error);
    return null;
  }
}

// ── Tambahan: Fetcher untuk SWR (Broker & Stock History) ──

export const fetchBrokerLatest = async (ticker: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/broker-flow/${ticker.toUpperCase()}/latest`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Gagal fetch broker latest:", e);
    return null;
  }
};

export const fetchBrokerSummary = async (ticker: string, days: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/broker-flow/${ticker.toUpperCase()}/summary?days=${days}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Gagal fetch broker summary:", e);
    return null;
  }
};

export const fetchStockHistory = async (ticker: string, limit: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stocks/${ticker.toUpperCase()}/history?limit=${limit}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Gagal fetch stock history:", e);
    return null;
  }
};

export const fetchBrokerHistory = async (ticker: string, days: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/broker-flow/${ticker.toUpperCase()}/history?limit=${days}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Gagal fetch broker history:", e);
    return null;
  }
};
