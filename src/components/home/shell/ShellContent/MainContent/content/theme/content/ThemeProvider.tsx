"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { availableThemes, applyTheme, getThemeById } from "@/theme/registry";

interface ThemeCtxValue {
  currentThemeId: string | null;
  setAndSaveTheme: (themeId: string) => Promise<void>;
  previewTheme: (themeId: string) => void;
  themes: { id: string; name: string }[];
  isSaving: boolean;
}

const ThemeCtx = createContext<ThemeCtxValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useQuery(api.users.settings.getSettings, {});
  const updateSettings = useMutation(api.users.settings.updateSettings);

  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Derive available themes (id + name) for UI
  const themes = useMemo(
    () => Object.values(availableThemes).map((t) => ({ id: t.id, name: t.name })),
    []
  );

  // Apply theme from settings when loaded (or default)
  useEffect(() => {
    const themeId = settings?.theme ?? null;
    const resolved = themeId && availableThemes[themeId] ? themeId : null;
    const id = resolved ?? Object.values(availableThemes)[0]?.id ?? null;
    if (id && id !== currentThemeId) {
      setCurrentThemeId(id);
      const theme = getThemeById(id);
      // Apply to CSS variables immediately
      if (typeof window !== "undefined") applyTheme(theme);
    }
  }, [settings, currentThemeId]);

  const previewTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    if (typeof window !== "undefined") applyTheme(theme);
  }, []);

  const setAndSaveTheme = useCallback(
    async (themeId: string) => {
      setIsSaving(true);
      try {
        // Apply immediately for instant feedback
        previewTheme(themeId);
        // Persist to user settings
        await updateSettings({ settings: { theme: themeId } });
        setCurrentThemeId(themeId);
      } finally {
        setIsSaving(false);
      }
    },
    [previewTheme, updateSettings]
  );

  const value = useMemo<ThemeCtxValue>(
    () => ({ currentThemeId, setAndSaveTheme, previewTheme, themes, isSaving }),
    [currentThemeId, setAndSaveTheme, previewTheme, themes, isSaving]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeManager() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useThemeManager must be used within ThemeProvider");
  return ctx;
}
