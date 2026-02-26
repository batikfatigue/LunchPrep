"use client";

/**
 * BYOK (Bring Your Own Key) Gemini API key input component.
 *
 * Allows the user to enter and persist their Gemini API key in localStorage.
 * Shows a toggle to reveal/hide the key and a badge when a key is active.
 * Calls setBYOKKey() from the categoriser client to keep localStorage in sync.
 */

import * as React from "react";
import { Eye, EyeOff, Key, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setBYOKKey } from "@/lib/categoriser/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiKeyInputProps {
  /**
   * Current API key value managed by the parent.
   * Empty string means no key is set.
   */
  apiKey: string;
  /**
   * Callback fired when the user saves or clears the API key.
   *
   * @param key - The new API key value (empty string means cleared).
   */
  onApiKeyChange: (key: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Input for the user's Gemini API key with show/hide toggle and active indicator.
 *
 * @param props - See ApiKeyInputProps.
 */
export function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);

  const isActive = apiKey.trim().length > 0;

  /** Persist the entered key to parent state and localStorage. */
  function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    // Reason: setBYOKKey writes to localStorage so the categoriser
    // client can read it independently of component state.
    setBYOKKey(trimmed);
    onApiKeyChange(trimmed);
    setInputValue("");
    setShowKey(false);
  }

  /** Remove the active key from state and localStorage. */
  function handleClear() {
    setBYOKKey(null);
    onApiKeyChange("");
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Gemini API Key</span>
        </div>
        {isActive && (
          <Badge variant="default" className="gap-1">
            <Key className="size-3" />
            BYOK Active
          </Badge>
        )}
      </div>

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
              placeholder="Enter Gemini API key…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="pr-9"
              aria-label="Gemini API key"
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

      <p className="text-xs text-muted-foreground">
        {isActive
          ? "Your key is stored locally and sent directly to Gemini — bypassing the server proxy."
          : "Optional. Leave blank to use the shared server proxy."}
      </p>
    </div>
  );
}
