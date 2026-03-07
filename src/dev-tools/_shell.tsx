"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DEV_TOOLS } from "./_registry";
import type { DevTool } from "./_types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tools that can appear inside the floating panel. */
const panelTools = () =>
    DEV_TOOLS.filter((t) => t.mode === "panel" || t.mode === "both");

/** Tools that offer a standalone (full-screen) view. */
const standaloneTools = () =>
    DEV_TOOLS.filter((t) => t.mode === "standalone" || t.mode === "both");

// ---------------------------------------------------------------------------
// Shell (top-level orchestrator)
// ---------------------------------------------------------------------------

export default function DevToolsShell() {
    const [expanded, setExpanded] = useState(false);
    const [activeToolId, setActiveToolId] = useState<string | null>(null);
    const [standaloneToolId, setStandaloneToolId] = useState<string | null>(null);

    const activeTool: DevTool | undefined = activeToolId
        ? DEV_TOOLS.find((t) => t.id === activeToolId)
        : undefined;

    const standaloneTool: DevTool | undefined = standaloneToolId
        ? DEV_TOOLS.find((t) => t.id === standaloneToolId)
        : undefined;

    // Keyboard shortcut: Ctrl+Shift+D toggles the panel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "D") {
                e.preventDefault();
                setExpanded((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const openStandalone = useCallback((id: string) => {
        setStandaloneToolId(id);
    }, []);

    const closeStandalone = useCallback(() => {
        setStandaloneToolId(null);
    }, []);

    return (
        <>
            {/* --- Standalone full-screen view --- */}
            {standaloneTool && (
                <StandaloneView tool={standaloneTool} onClose={closeStandalone} />
            )}

            {/* --- Floating panel / collapsed indicator --- */}
            {expanded ? (
                <FloatingPanel
                    activeTool={activeTool}
                    onSelectTool={setActiveToolId}
                    onCollapse={() => setExpanded(false)}
                    onOpenStandalone={openStandalone}
                />
            ) : (
                <CollapsedIndicator onExpand={() => setExpanded(true)} />
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Collapsed indicator (task 4.3)
// ---------------------------------------------------------------------------

function CollapsedIndicator({ onExpand }: { onExpand: () => void }) {
    return (
        <button
            onClick={onExpand}
            title="Dev Tools (Ctrl+Shift+D)"
            aria-label="Open Dev Tools"
            style={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 99999,
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #7c3aed",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 20px rgba(124, 58, 237, 0.5)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 14px rgba(124, 58, 237, 0.4)";
            }}
        >
            🛠
        </button>
    );
}

// ---------------------------------------------------------------------------
// Floating Panel (tasks 4.1, 4.2, 4.3)
// ---------------------------------------------------------------------------

interface FloatingPanelProps {
    activeTool: DevTool | undefined;
    onSelectTool: (id: string | null) => void;
    onCollapse: () => void;
    onOpenStandalone: (id: string) => void;
}

function FloatingPanel({
    activeTool,
    onSelectTool,
    onCollapse,
    onOpenStandalone,
}: FloatingPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [position, setPosition] = useState({ x: -1, y: -1 });
    const dragOffset = useRef({ x: 0, y: 0 });

    // Default position: bottom-right
    useEffect(() => {
        if (position.x === -1) {
            setPosition({
                x: window.innerWidth - 420,
                y: window.innerHeight - 500,
            });
        }
    }, [position.x]);

    // Drag handling
    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest("button, select, a")) return;
            setDragging(true);
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position]
    );

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            });
        };
        const onUp = () => setDragging(false);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragging]);

    const pTools = panelTools();
    const sTools = standaloneTools();
    const ActiveComponent = activeTool?.component;

    return (
        <div
            ref={panelRef}
            style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                zIndex: 99999,
                width: 400,
                maxHeight: "70vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: 12,
                border: "1px solid rgba(124, 58, 237, 0.3)",
                background: "rgba(15, 15, 25, 0.95)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#e2e8f0",
                fontSize: 13,
                overflow: "hidden",
                userSelect: dragging ? "none" : "auto",
            }}
        >
            {/* --- Toolbar / Header --- */}
            <div
                onMouseDown={onMouseDown}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background:
                        "linear-gradient(90deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%)",
                    borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
                    cursor: dragging ? "grabbing" : "grab",
                }}
            >
                {/* Dev mode badge */}
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(124, 58, 237, 0.25)",
                        color: "#a78bfa",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                    }}
                >
                    🛠 DEV
                </span>

                <span style={{ flex: 1 }} />

                {/* Standalone tool links */}
                {sTools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onOpenStandalone(tool.id)}
                        title={`Open ${tool.name} (standalone)`}
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#94a3b8",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontSize: 11,
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                            (e.currentTarget as HTMLElement).style.borderColor =
                                "rgba(124, 58, 237, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                            (e.currentTarget as HTMLElement).style.borderColor =
                                "rgba(255,255,255,0.1)";
                        }}
                    >
                        {tool.icon ?? "↗"} {tool.name}
                    </button>
                ))}

                {/* Collapse button */}
                <button
                    onClick={onCollapse}
                    title="Collapse (Ctrl+Shift+D)"
                    aria-label="Collapse Dev Tools"
                    style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        padding: "2px 4px",
                        borderRadius: 4,
                        transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#f87171";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                    }}
                >
                    ✕
                </button>
            </div>

            {/* --- Tool selector --- */}
            {pTools.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        gap: 4,
                        padding: "6px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        overflowX: "auto",
                    }}
                >
                    {pTools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() =>
                                onSelectTool(
                                    activeTool?.id === tool.id ? null : tool.id
                                )
                            }
                            title={tool.description}
                            style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "1px solid",
                                borderColor:
                                    activeTool?.id === tool.id
                                        ? "rgba(124, 58, 237, 0.5)"
                                        : "rgba(255,255,255,0.08)",
                                background:
                                    activeTool?.id === tool.id
                                        ? "rgba(124, 58, 237, 0.2)"
                                        : "transparent",
                                color:
                                    activeTool?.id === tool.id ? "#c4b5fd" : "#94a3b8",
                                fontSize: 12,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s",
                            }}
                        >
                            {tool.icon ? (
                                <span style={{ marginRight: 4 }}>{tool.icon}</span>
                            ) : null}
                            {tool.name}
                        </button>
                    ))}
                </div>
            )}

            {/* --- Tool content area --- */}
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    padding: 12,
                    minHeight: 100,
                }}
            >
                {ActiveComponent ? (
                    <ActiveComponent />
                ) : pTools.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div style={{ color: "#64748b", textAlign: "center", paddingTop: 32 }}>
                        Select a tool from the tabs above.
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Standalone full-screen view (tasks 5.1, 5.2, 5.3)
// ---------------------------------------------------------------------------

function StandaloneView({
    tool,
    onClose,
}: {
    tool: DevTool;
    onClose: () => void;
}) {
    const ToolComponent = tool.component;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                display: "flex",
                flexDirection: "column",
                background: "#0f0f19",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#e2e8f0",
            }}
        >
            {/* Header bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
                    background:
                        "linear-gradient(90deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)",
                }}
            >
                <button
                    onClick={onClose}
                    aria-label="Close standalone view"
                    title="Back to app"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#94a3b8",
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                        (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(124, 58, 237, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                        (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,255,255,0.1)";
                    }}
                >
                    ← Back
                </button>

                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(124, 58, 237, 0.25)",
                        color: "#a78bfa",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                    }}
                >
                    🛠 DEV
                </span>

                <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {tool.icon ? <span style={{ marginRight: 6 }}>{tool.icon}</span> : null}
                    {tool.name}
                </span>

                <span style={{ color: "#64748b", fontSize: 12 }}>
                    {tool.description}
                </span>
            </div>

            {/* Tool body */}
            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                <ToolComponent />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Empty state (no tools registered)
// ---------------------------------------------------------------------------

function EmptyState() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "32px 16px",
                textAlign: "center",
            }}
        >
            <span style={{ fontSize: 32, opacity: 0.5 }}>🧰</span>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
                No dev tools registered yet.
            </p>
            <p style={{ color: "#64748b", margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                Add a tool by creating a directory under{" "}
                <code
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        padding: "1px 5px",
                        borderRadius: 4,
                    }}
                >
                    src/dev-tools/
                </code>{" "}
                and registering it in{" "}
                <code
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        padding: "1px 5px",
                        borderRadius: 4,
                    }}
                >
                    _registry.ts
                </code>
                .
            </p>
        </div>
    );
}
