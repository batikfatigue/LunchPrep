import type { ReactNode, ComponentType } from "react";

/**
 * Contract that every registered dev tool must satisfy.
 *
 * - **id** – unique slug used as a key and in URLs.
 * - **name** – human-readable display name shown in the toolbar.
 * - **description** – one-liner shown in tooltips / tool selector.
 * - **icon** – optional React node rendered next to the name.
 * - **mode** – where the tool renders:
 *     - `'panel'` → inside the floating panel only
 *     - `'standalone'` → full-screen view only
 *     - `'both'` → available in both modes
 * - **component** – React component rendered when the tool is active.
 */
export interface DevTool {
    id: string;
    name: string;
    description: string;
    icon?: ReactNode;
    mode: "panel" | "standalone" | "both";
    component: ComponentType;
}
