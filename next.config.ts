import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reason: standalone output bundles only the required files for production,
  // enabling a minimal Docker image (~150 MB) without the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
