import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mengizinkan build produksi selesai meskipun ada file legacy yang error tipe datanya
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
