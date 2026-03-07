"use client";

import dynamic from "next/dynamic";

/**
 * Thin bootstrap wrapper rendered by the root layout.
 *
 * Uses `next/dynamic` to lazy-load the entire dev-tools shell into a
 * separate chunk. This keeps the root layout's static import graph clean
 * of any dev-tools references — the only static import is this bootstrap
 * file (which itself is guarded by the env check in layout.tsx).
 */
const DevToolsShell = dynamic(() => import("./_shell"), { ssr: false });

export default function DevToolsBootstrap() {
    return <DevToolsShell />;
}
