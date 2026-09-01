// frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
        // Anda bisa menambahkan logika trigger logout di sini jika diperlukan
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
