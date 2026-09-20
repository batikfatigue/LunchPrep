"use client";

import type { AiProviderSettings } from "@/components/api-key-input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import type { AiProvider, BYOKConfig } from "@/lib/categoriser/client";

/** Keep import preferences and provider configuration consistent across the workspace. */
export function useImportPreferences() {
  const [categories, setCategories] = useLocalStorage<string[]>(
    "lunchprep_categories",
    DEFAULT_CATEGORIES,
  );
  const [provider, setProvider] = useLocalStorage<AiProvider>(
    "lunchprep_ai_provider",
    "gemini",
  );
  const [geminiKey, setGeminiKey] = useLocalStorage<string>(
    "lunchprep_gemini_key",
    "",
  );
  const [openaiKey, setOpenaiKey] = useLocalStorage<string>(
    "lunchprep_openai_key",
    "",
  );
  const [openaiBaseUrl, setOpenaiBaseUrl] = useLocalStorage<string>(
    "lunchprep_openai_base_url",
    "",
  );
  const [openaiModel, setOpenaiModel] = useLocalStorage<string>(
    "lunchprep_openai_model",
    "",
  );

  const byokConfig: BYOKConfig | null =
    provider === "openai"
      ? openaiKey.trim()
        ? {
            provider,
            apiKey: openaiKey.trim(),
            baseUrl: openaiBaseUrl || undefined,
            model: openaiModel || undefined,
          }
        : null
      : geminiKey.trim()
        ? { provider, apiKey: geminiKey.trim() }
        : null;

  const aiSettings: AiProviderSettings = {
    provider,
    geminiKey,
    openaiKey,
    openaiBaseUrl,
    openaiModel,
  };

  /** Apply only supplied settings, preserving each existing localStorage key. */
  function onAiSettingsChange(patch: Partial<AiProviderSettings>) {
    if (patch.provider !== undefined) setProvider(patch.provider);
    if (patch.geminiKey !== undefined) setGeminiKey(patch.geminiKey);
    if (patch.openaiKey !== undefined) setOpenaiKey(patch.openaiKey);
    if (patch.openaiBaseUrl !== undefined)
      setOpenaiBaseUrl(patch.openaiBaseUrl);
    if (patch.openaiModel !== undefined) setOpenaiModel(patch.openaiModel);
  }

  return {
    categories,
    setCategories,
    byokConfig,
    aiSettings,
    onAiSettingsChange,
  };
}
