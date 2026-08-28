import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/bandar/:path*',
        destination: 'http://localhost:8000/api/bandar/:path*',
      },
    ];
  },
};

export default nextConfig;

