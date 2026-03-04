import type { NextConfig } from "next";

// Reason: When dev-tools are disabled (production), Turbopack still resolves
// all import() paths even inside dead-code ternaries. Since .vercelignore
// physically excludes src/dev-tools/, we alias those imports to an empty stub
// so the resolver succeeds and the ternary discards the result at runtime.
const devToolsAliases: Record<string, string> =
  process.env.NEXT_PUBLIC_DEV_TOOLS === "true"
    ? {}
    : {
        "@/dev-tools/_bootstrap": "./src/lib/empty-module.ts",
        "@/dev-tools/categorisation-debugger":
          "./src/lib/empty-module.ts",
      };

const nextConfig: NextConfig = {
  // Reason: standalone output bundles only the required files for production,
  // enabling a minimal Docker image (~150 MB) without the full node_modules tree.
  output: "standalone",

  // Turbopack config: resolveAlias redirects excluded dev-tools to a no-op
  // stub in production deployments (see devToolsAliases above).
  turbopack: {
    resolveAlias: {
      ...devToolsAliases,
    },
  },

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

