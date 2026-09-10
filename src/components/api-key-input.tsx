"use client";

/**
 * BYOK (Bring Your Own Key) AI provider settings component.
 *
 * Lets the user pick an AI provider (Gemini or an OpenAI-compatible
 * endpoint) and persist their API key in localStorage. For OpenAI-compatible
 * providers, optional base URL and model overrides are exposed so any
 * endpoint implementing the chat completions API works (OpenAI, OpenRouter,
 * Ollama, etc.).
 *
 * Shows a toggle to reveal/hide the key and a badge when a key is active.
 * Persists via the categoriser client helpers to keep localStorage in sync.
 */

import * as React from "react";
import { Eye, EyeOff, Key, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  setAIProvider,
  setBYOKKey,
  setOpenAIKey,
  type AiProvider,
} from "@/lib/categoriser/client";
import {
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
} from "@/lib/categoriser/openai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All BYOK-related settings shown in this component. */
export interface AiProviderSettings {
  /** Selected provider. */
  provider: AiProvider;
  /** Saved Gemini API key ("" = unset). */
  geminiKey: string;
  /** Saved OpenAI-compatible API key ("" = unset). */
  openaiKey: string;
  /** Saved OpenAI-compatible base URL override ("" = default). */
  openaiBaseUrl: string;
  /** Saved OpenAI-compatible model override ("" = default). */
  openaiModel: string;
}

export interface ApiKeyInputProps {
  /**
   * Current provider settings managed by the parent (persisted via
   * useLocalStorage). Empty strings mean unset.
   */
  settings: AiProviderSettings;
  /**
   * Callback fired when the user changes any setting.
   *
   * @param patch - Partial settings to merge into the parent's state.
   */
  onSettingsChange: (patch: Partial<AiProviderSettings>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AI provider picker + API key input with show/hide toggle and active badge.
 *
 * @param props - See ApiKeyInputProps.
 */
export function ApiKeyInput({ settings, onSettingsChange }: ApiKeyInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { provider } = settings;
  const isOpenAI = provider === "openai";

  // Defer to client-only to avoid SSR/client hydration mismatch
  // (keys come from localStorage which is unavailable during SSR).
  const activeKey = isOpenAI ? settings.openaiKey : settings.geminiKey;
  const isActive = mounted && activeKey.trim().length > 0;

  /** Switch provider and clear any in-progress key input. */
  function handleProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AiProvider;
    // Reason: setAIProvider writes to localStorage so the categoriser
    // client can read it independently of component state.
    setAIProvider(next);
    onSettingsChange({ provider: next });
    setInputValue("");
    setShowKey(false);
  }

  /** Persist the entered key to parent state and localStorage. */
  function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (isOpenAI) {
      setOpenAIKey(trimmed);
      onSettingsChange({ openaiKey: trimmed });
    } else {
      setBYOKKey(trimmed);
      onSettingsChange({ geminiKey: trimmed });
    }
    setInputValue("");
    setShowKey(false);
  }

  /** Remove the active key from state and localStorage. */
  function handleClear() {
    if (isOpenAI) {
      setOpenAIKey(null);
      onSettingsChange({ openaiKey: "" });
    } else {
      setBYOKKey(null);
      onSettingsChange({ geminiKey: "" });
    }
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
  }

  const keyLabel = isOpenAI ? "OpenAI-compatible API key" : "Gemini API key";
  const keyPlaceholder = isOpenAI
    ? "Enter API key (e.g. sk-…)…"
    : "Enter Gemini API key…";

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">AI Provider</span>
        </div>
        {isActive && (
          <Badge variant="default" className="gap-1">
            <Key className="size-3" />
            BYOK Active
          </Badge>
        )}
      </div>

      {/* Provider selector */}
      <select
        value={provider}
        onChange={handleProviderChange}
        className={cn(
          "h-9 w-full rounded-md border bg-transparent px-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring",
        )}
        aria-label="AI provider"
      >
        <option value="gemini">Gemini (Google)</option>
        <option value="openai">OpenAI-compatible</option>
      </select>

      {isActive ? (
        /* Active state: show masked key and clear button */
        <div className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center rounded-md border bg-muted/30 px-3 font-mono text-sm text-muted-foreground">
            {"•".repeat(20)}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            aria-label="Clear API key"
          >
            <X className="size-4" />
            Clear
          </Button>
        </div>
      ) : (
        /* Inactive state: show input with show/hide and save */
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={keyPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="pr-9"
              aria-label={keyLabel}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!inputValue.trim()}
            aria-label="Save API key"
          >
            <Save className="size-4" />
            Save
          </Button>
        </div>
      )}

      {/* OpenAI-compatible extras: endpoint + model overrides */}
      {isOpenAI && (
        <div className="flex flex-col gap-2">
          <div>
            <label
              htmlFor="openai-base-url"
              className="mb-1 block text-xs text-muted-foreground"
            >
              Base URL <span className="opacity-70">(optional)</span>
            </label>
            <Input
              id="openai-base-url"
              type="text"
              placeholder={DEFAULT_OPENAI_BASE_URL}
              value={settings.openaiBaseUrl}
              onChange={(e) =>
                onSettingsChange({ openaiBaseUrl: e.target.value })
              }
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-9 font-mono text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="openai-model"
              className="mb-1 block text-xs text-muted-foreground"
            >
              Model <span className="opacity-70">(optional)</span>
            </label>
            <Input
              id="openai-model"
              type="text"
              placeholder={DEFAULT_OPENAI_MODEL}
              value={settings.openaiModel}
              onChange={(e) =>
                onSettingsChange({ openaiModel: e.target.value })
              }
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-9 font-mono text-sm"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {isActive
          ? isOpenAI
            ? "Your key is stored locally and sent directly to your OpenAI-compatible endpoint — relayed through the server proxy only if the endpoint blocks browser requests."
            : "Your key is stored locally and sent directly to Gemini — bypassing the server proxy."
          : "Optional. Leave blank to use the shared server proxy."}
      </p>
    </div>
  );
}
