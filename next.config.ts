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
  // Moved from experimental to root in newer Next.js versions
  // @ts-ignore: outputFileTracingRoot is valid at runtime but might be missing in types
  outputFileTracingRoot: path.join(__dirname),
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

export default withPWA(nextConfig);
