import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix for Turbopack root directory warning
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
