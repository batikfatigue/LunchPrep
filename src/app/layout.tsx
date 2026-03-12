import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

// Conditional dynamic import — no static reference to dev-tools.
// Next.js replaces NEXT_PUBLIC_* at compile time: when the var is absent
// (production), this becomes `false ? dynamic(...) : null` and the bundler
// eliminates the import() as dead code. The module never enters the graph.
// Note: no { ssr: false } here — layout.tsx is a server component.
// Client-only rendering is handled inside _bootstrap.tsx.
const DevToolsBootstrap =
  process.env.NEXT_PUBLIC_DEV_TOOLS === "true"
    ? dynamic(() => import("@/dev-tools/_bootstrap"))
    : null;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LunchPrep",
  description:
    "Convert Singapore bank CSVs into Lunch Money imports with Gemini AI categorisation.",
};

/**
 * Inline script source for FOUC prevention.
 *
 * Reason: This runs synchronously before the browser paints, so the correct
 * `dark` class is on `<html>` before any CSS is applied. We duplicate the
 * resolution logic from `src/lib/theme.ts` here because module imports are not
 * available inside a raw script string.
 *
 * Logic mirrors: getStoredTheme() → resolveTheme() → applyTheme()
 */
const themeScript = `
(function() {
  var stored;
  try { stored = localStorage.getItem('lunchprep-theme'); } catch(e) {}
  var pref = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
  var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the inline script may add 'dark' before React
    // hydrates, causing a class mismatch warning. This suppresses it safely.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking theme script — must be first in <head> to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        {DevToolsBootstrap && <DevToolsBootstrap />}
      </body>
    </html>
  );
}

