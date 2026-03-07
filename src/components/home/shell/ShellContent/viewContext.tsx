"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ShellView = "home" | "friends" | "chat" | "gaming" | "dailies" | "settings" | "theme" | "spaces" | "hire" | "view" | "live" | "campaigns" | "docs" | "music" | "profile" | "ecosystemHub" | "esports" | "notes" | "collections";

interface ShellViewContextValue {
  view: ShellView;
  setView: (v: ShellView) => void;
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  selectedSpaceId: string | null;
  setSelectedSpaceId: (id: string | null) => void;
}

const ShellViewContext = createContext<ShellViewContextValue | undefined>(undefined);

export function ShellViewProvider({ children, initialView = "home" }: { children: React.ReactNode; initialView?: ShellView }) {
  const [view, setView] = useState<ShellView>(initialView);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // Initialize from URL (?view=chat/<id> or ?view=<section>)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view") || initialView;
    if (v && v.startsWith("chat/")) {
      const id = v.slice("chat/".length);
      setView("chat");
      setSelectedChatId(id || null);
    } else {
      // Check for spaceId in params
      const spaceId = params.get("spaceId");
      if (spaceId) setSelectedSpaceId(spaceId);

      // validate against allowed views
      const allowed = new Set<ShellView>(["home", "friends", "chat", "gaming", "dailies", "settings", "theme", "spaces", "hire", "view", "live", "campaigns", "docs", "music", "profile", "ecosystemHub", "esports", "notes", "collections"]);
      setView((allowed.has(v as ShellView) ? (v as ShellView) : initialView));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when view or selected IDs change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const newViewParam = view === "chat" && selectedChatId ? `chat/${selectedChatId}` : view;
    params.set("view", newViewParam);

    if (view === "spaces" && selectedSpaceId) {
      params.set("spaceId", selectedSpaceId);
    } else {
      params.delete("spaceId");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [view, selectedChatId, selectedSpaceId]);

  const value = useMemo(() => ({
    view,
    setView,
    selectedChatId,
    setSelectedChatId,
    selectedSpaceId,
    setSelectedSpaceId
  }), [view, selectedChatId, selectedSpaceId]);
  return <ShellViewContext.Provider value={value}>{children}</ShellViewContext.Provider>;
}

export function useShellView() {
  const ctx = useContext(ShellViewContext);
  if (!ctx) throw new Error("useShellView must be used within a ShellViewProvider");
  return ctx;
}
