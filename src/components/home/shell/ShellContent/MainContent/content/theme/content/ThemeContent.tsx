"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useThemeManager } from "./ThemeProvider";
import { availableThemes, themeVar, ThemeType as RegistryThemeType } from "@/theme/registry";
import { MuiCard } from "@/components/ui/MuiCard";

export default function ThemeContent() {
  const { themes, previewTheme, setAndSaveTheme, currentThemeId, isSaving } = useThemeManager();

  // All vote counts in one query to avoid N requests
  const voteCountsQuery = useQuery(api.community.themeVotes.getAllThemeVoteCounts, {});
  const voteCounts = voteCountsQuery ?? {};
  const isLoadingVotes = voteCountsQuery === undefined;
  const userVotes = useQuery(api.community.themeVotes.getUserVotes, {}) ?? {};
  const userSettings = useQuery(api.users.settings.getSettings, {});
  const castVote = useMutation(api.community.themeVotes.castVote);
  const updateSettings = useMutation(api.users.settings.updateUserSettings);
  const [voted, setVoted] = useState<Record<string, "up" | "down" | null>>({});
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    themeId: string | null;
    vote: "up" | "down" | null;
    dontShowAgain: boolean;
  }>({ open: false, themeId: null, vote: null, dontShowAgain: false });

  const themeList = useMemo(() => themes, [themes]);
  const [filter, setFilter] = useState<"all" | "dark" | "light" | "void" | "popular" | "warm" | "cool">("all");

  const classify = (t: { id: string; name: string }) => {
    const name = t.name.toLowerCase();
    const id = t.id.toLowerCase();
    const isVoid = id.startsWith("voiddark") || name.includes("void");
    const isDark = name.includes("dark");
    const isLight = name.includes("light");
    const isWarm = name.includes("sunset") || 
                   name.includes("desert") || 
                   name.includes("autumn") || 
                   name.includes("pride") || 
                   name.includes("night city") || 
                   name.includes("miami");
    const isCool = name.includes("arctic") ||
                   name.includes("sea") ||
                   name.includes("nebula") ||
                   name.includes("teal") ||
                   name.includes("blue") ||
                   name.includes("futuristic") ||
                   name.includes("haunted") ||
                   isVoid;
    return { isVoid, isDark, isLight, isWarm, isCool };
  };

  const filteredThemes = useMemo(() => {
    let list = [...themeList];
    if (filter === "dark") list = list.filter((t) => classify(t).isDark && !classify(t).isLight);
    else if (filter === "light") list = list.filter((t) => classify(t).isLight);
    else if (filter === "void") list = list.filter((t) => classify(t).isVoid);
    else if (filter === "warm") list = list.filter((t) => classify(t).isWarm);
    else if (filter === "cool") list = list.filter((t) => classify(t).isCool);
    if (filter === "popular") {
      // Only include themes with at least one vote and positive score
      list = list.filter((t) => {
        const c = voteCounts[t.id];
        if (!c) return false;
        const totalVotes = (c.upvotes ?? 0) + (c.downvotes ?? 0);
        const score = (c.upvotes ?? 0) - (c.downvotes ?? 0);
        return totalVotes > 0 && score > 0;
      });
      list.sort((a, b) => {
        const ca = voteCounts[a.id] ?? { upvotes: 0, downvotes: 0 };
        const cb = voteCounts[b.id] ?? { upvotes: 0, downvotes: 0 };
        return (cb.upvotes - cb.downvotes) - (ca.upvotes - ca.downvotes);
      });
    }
    return list;
  }, [themeList, filter, voteCounts]);

  // Collect Void Dark family for quick tweaks
  const voidDarkIds = useMemo(() => {
    const ids = Object.keys(availableThemes).filter((id) => id.startsWith("voidDark"));
    // Prefer a stable order
    const order = [
      "voidDark",
      "voidDarkGreen",
      "voidDarkRed",
      "voidDarkOrange",
      "voidDarkYellow",
      "voidDarkBlue",
      "voidDarkPurple",
    ];
    return order.filter((id) => ids.includes(id));
  }, []);

  const actuallyVote = async (themeId: string, vote: "up" | "down", persistOptOut: boolean) => {
    try {
      if (persistOptOut) {
        await updateSettings({ settings: { disableThemeVoteConfirm: true } });
      }
      setVoted((prev) => ({ ...prev, [themeId]: vote }));
      await castVote({ themeId, vote });
    } catch (e) {
      setVoted((prev) => ({ ...prev, [themeId]: null }));
      console.error("castVote failed", e);
    } finally {
      setConfirmState({ open: false, themeId: null, vote: null, dontShowAgain: false });
    }
  };

  const handleVote = (themeId: string, vote: "up" | "down") => {
    // optimistic lockout to prevent double votes
    if (voted[themeId]) return;
    const disableConfirm = !!userSettings?.disableThemeVoteConfirm;
    if (disableConfirm) {
      void actuallyVote(themeId, vote, false);
      return;
    }
    setConfirmState({ open: true, themeId, vote, dontShowAgain: false });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Theme gallery */}
      <section>
        {/* Filter Tabs */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {([
            { key: "all", label: "All" },
            { key: "dark", label: "Dark" },
            { key: "light", label: "Light" },
            { key: "warm", label: "Warm" },
            { key: "cool", label: "Cool" },
            { key: "void", label: "Void" },
            { key: "popular", label: "Most Popular" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                backgroundColor: filter === key ? themeVar("secondary") : themeVar("card"),
                color: filter === key ? "black" : themeVar("mutedForeground"),
              }}
              className={`px-3 py-1 rounded-md text-sm border border-[var(--border)] transition-colors ${
                filter !== key ? "hover:bg-[var(--cardHover)]" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((t) => {
            const counts = voteCounts[t.id] ?? { upvotes: 0, downvotes: 0 };
            const score = counts.upvotes - counts.downvotes;
            const isActive = currentThemeId === t.id;
            const themeObj = availableThemes[t.id] as RegistryThemeType | undefined;
            const c = themeObj?.colors;
            const hasUserVotedForThis = !!userVotes[t.id];
            return (
              <MuiCard
                key={t.id}
                variant="interactive"
                size="sm"
                className="overflow-hidden flex flex-col"
              >
                {/* Preview swatches (use the theme's own palette) */}
                <div className="h-12 sm:h-10 w-full flex">
                  <div
                    className="flex-1"
                    title="Background"
                    style={{ background: c?.background ?? "transparent" }}
                  />
                  <div
                    className="flex-1"
                    title="Card"
                    style={{ background: c?.card ?? "transparent" }}
                  />
                  <div
                    className="flex-1"
                    title="Primary"
                    style={{ background: c?.primary ?? "transparent" }}
                  />
                  <div
                    className="flex-1"
                    title="Secondary"
                    style={{ background: c?.secondary ?? "transparent" }}
                  />
                </div>

                <div className="p-3 flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-[var(--foreground)] truncate">{t.name}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]" title="Total sentiment (likes - dislikes)">
                      Score: {isLoadingVotes ? "…" : hasUserVotedForThis ? score : "?"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--cardHover)]"
                      onClick={() => previewTheme(t.id)}
                    >
                      Preview
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        isActive
                          ? ""
                          : ""
                      }`}
                      style={{
                        backgroundColor: isActive ? themeVar("secondary") : themeVar("primary"),
                        color: isActive ? "black" : "white",
                      }}
                      onClick={() => setAndSaveTheme(t.id)}
                      disabled={isSaving}
                    >
                      {isActive ? "Applied" : "Apply"}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      {!(hasUserVotedForThis || !!voted[t.id]) && (
                        <>
                      <button
                        className="px-2 py-1 rounded-md border border-[var(--border)] text-xs hover:bg-[var(--cardHover)]"
                        onClick={() => handleVote(t.id, "up")}
                        disabled={!!voted[t.id] || hasUserVotedForThis}
                        title="Like"
                        aria-label="Like"
                      >
                        👍
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border border-[var(--border)] text-xs hover:bg-[var(--cardHover)]"
                        onClick={() => handleVote(t.id, "down")}
                        disabled={!!voted[t.id] || hasUserVotedForThis}
                        title="Dislike"
                        aria-label="Dislike"
                      >
                        👎
                      </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </MuiCard>
            );
          })}
          </div>
          {/* Confirm Vote Modal (scoped to grid container) */}
          {confirmState.open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmState({ open: false, themeId: null, vote: null, dontShowAgain: false })} />
              <div role="dialog" aria-modal="true" className="relative w-[min(92vw,420px)] rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl">
                <div className="font-semibold text-[var(--foreground)] mb-2">Confirm your vote</div>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">Are you sure? You cannot change your vote after submitting.</p>
                <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-4 select-none">
                  <input
                    type="checkbox"
                    checked={confirmState.dontShowAgain}
                    onChange={(e) => setConfirmState((s) => ({ ...s, dontShowAgain: e.target.checked }))}
                  />
                  Don't show this again
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--cardHover)]"
                    onClick={() => setConfirmState({ open: false, themeId: null, vote: null, dontShowAgain: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1 rounded-md text-sm bg-[var(--buttonPrimary)] text-white"
                    onClick={() => confirmState.themeId && confirmState.vote && actuallyVote(confirmState.themeId, confirmState.vote, confirmState.dontShowAgain)}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

