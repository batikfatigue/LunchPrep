import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reason: standalone output bundles only the required files for production,
  // enabling a minimal Docker image (~150 MB) without the full node_modules tree.
  output: "standalone",

  // Next.js 16 uses Turbopack by default for dev. The webpack config below
  // only applies to production builds (`next build`). An empty turbopack
  // config signals this is intentional.
  turbopack: {},

  webpack: (config, { webpack }) => {
    // Failsafe: reject ANY import from src/dev-tools/ during production builds.
    // The primary guard is the conditional dynamic import in layout.tsx
    // (dead-code eliminated when NEXT_PUBLIC_DEV_TOOLS is absent). This
    // IgnorePlugin is a hard backstop: if any dev-tools import somehow
    // survives into a production build, it becomes a build error.
    if (process.env.NODE_ENV === "production") {
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource: (resource: string) => {
            return (
              resource.includes("dev-tools") ||
              resource.startsWith("@/dev-tools")
            );
          },
        })
      );
    }
    return config;
  },
};

export default nextConfig;

