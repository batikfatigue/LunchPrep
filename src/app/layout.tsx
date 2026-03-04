import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

// Conditional dynamic import — no static reference to dev-tools.
// Next.js replaces NEXT_PUBLIC_* at compile time: when the var is absent
// (production), this becomes `false ? dynamic(...) : null` and the bundler
// eliminates the import() as dead code. The module never enters the graph.
// Turbopack backstop: next.config.ts aliases @/dev-tools/* to an empty module
// in production, so even if Turbopack resolves the path it gets a no-op stub.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        {DevToolsBootstrap && <DevToolsBootstrap />}
      </body>
    </html>
  );
}

