import path from "path";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },
};

export default withPWA(nextConfig);
