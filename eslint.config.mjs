import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // --- Dev-tools boundary enforcement ---
  // Prevent production code from importing anything under @/dev-tools/*.
  // One-way dependency: dev-tools → production is allowed; production → dev-tools is NOT.
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
    ],
    // Exclude the root layout — it is the sole allowed integration point.
    ignores: ["src/app/layout.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/dev-tools/*"],
              message:
                "Production code must not import from @/dev-tools/. Dev-tools have a one-way dependency on production code, not the other way around.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

