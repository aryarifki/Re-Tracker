# Re-Tracker (The Investowl)

Platform analitik kuantitatif pasar modal (*Bandarmology & Smart Money Tracking*) untuk Bursa Efek Indonesia (IDX).

---

## 📑 Dokumentasi & Analisis Arsitektur

Laporan komprehensif analisis arsitektur, pemetaan kode, alur kerja sistem, audit dependensi, dan rekomendasi teknis dapat dibaca di:
👉 **[ANALISIS_ARSITEKTUR.md](./ANALISIS_ARSITEKTUR.md)**

---

## 🏗️ Struktur Proyek

- **`backend/`**: Layanan backend analitik berbasis **Python 3.11** & **FastAPI**, dilengkapi modul kalkulasi kuantitatif bandarmologi, integrasi API IDX & Stockbit, model Gaussian Hidden Markov Model (HMM), dan Vector Autoregression (VAR).
- **`frontend/`**: Aplikasi web interaktif berbasis **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4** dengan visualisasi grafik TradingView Lightweight Charts & Apache ECharts.
