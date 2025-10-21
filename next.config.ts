import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // new location for typedRoutes (no warning)
  typedRoutes: true,
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
};

export default nextConfig;
