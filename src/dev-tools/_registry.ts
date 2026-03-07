import type { DevTool } from "./_types";

/**
 * Registry of all available dev tools.
 *
 * To add a new tool:
 *   1. Create a directory under `src/dev-tools/` for your tool.
 *   2. Export a component and a `DevTool` descriptor.
 *   3. Add one entry to this array.
 *
 * To remove a tool:
 *   1. Delete the entry from this array.
 *   2. Delete the tool's directory.
 */
export const DEV_TOOLS: DevTool[] = [];
