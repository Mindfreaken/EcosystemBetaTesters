"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { MuiCard } from "@/components/ui/MuiCard";

export default function AchievementsTab() {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const profile = useQuery(
    api.users.profiles.functions.profileOverview.getProfile as any,
    me?._id ? ({ userId: me._id } as any) : ("skip" as any)
  ) as any;

  if (!me) {
    return (
      <Box sx={{ textAlign: "center", color: "var(--muted-foreground)", py: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--foreground)", mb: 0.5 }}>
          Achievements
        </Typography>
        <Typography variant="body2">Loading your achievements…</Typography>
      </Box>
    );
  }

  const achievements = profile?.achievements ?? [];

  const rarityAccent = (r: string | undefined) => {
    const key = String(r || "").trim().toLowerCase();
    switch (key) {
      case "common":
        return undefined; // use default card border for common
      case "rare":
        return "#8b5cf6"; // violet - matches SVG rare
      case "epic":
        return "#f59e0b"; // amber - matches SVG epic
      case "legendary":
        return "#f43f5e"; // rose - matches SVG legendary
      case "mythic":
      case "mythical":
        return "#f59e0b"; // amber - mythic
      default:
        return "color-mix(in oklab, var(--foreground), transparent 86%)";
    }
  };

  return (
    <Box sx={{ color: "var(--muted-foreground)", py: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--foreground)", mb: 1 }}>
        Achievements
      </Typography>

      {achievements.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body2">No achievements yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
          {achievements.map((a: any) => {
            const rarityKey = String(a.rarity || "").trim().toLowerCase();
            const accent = rarityAccent(rarityKey);
            const isMythic = rarityKey === "mythic" || rarityKey === "mythical";
            const isCommon = rarityKey === "common";
            return (
            <MuiCard
              key={(a._id || a.id) as string}
              variant="profile"
              size="sm"
              sx={{
                // Common: default border. Non-common: apply accent.
                ...(isCommon ? {} : {
                  borderColor: `color-mix(in oklab, ${accent} 45%, var(--card) 55%)`,
                  '&:hover': {
                    boxShadow: isMythic
                      ? `0 0 0 1px color-mix(in oklab, ${accent} 70%, transparent), 0 10px 28px color-mix(in oklab, ${accent} 36%, transparent)`
                      : `0 8px 24px color-mix(in oklab, ${accent} 32%, transparent)`,
                    backgroundColor: `color-mix(in oklab, var(--card) 92%, ${accent} 8%)`,
                  },
                }),
                borderWidth: isMythic ? 2 : 1,
                boxShadow: isMythic ? `0 0 0 1px color-mix(in oklab, ${accent} 60%, transparent), 0 8px 24px color-mix(in oklab, ${accent} 28%, transparent)` : undefined,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "var(--foreground)", fontWeight: 700, mb: 0.25 }}>
                {a.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--muted-foreground)", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap", display: 'block' }}>
                {a.description}
              </Typography>
              {a.earnedDate ? (
                <Typography variant="caption" sx={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em", display: 'block', mt: 0.5 }}>
                  {new Date(a.earnedDate).toLocaleString()}
                </Typography>
              ) : null}
              <Typography variant="caption" sx={{ color: "var(--muted-foreground)", display: 'block', mt: 0.25 }}>
                {a.category} · {a.rarity}
              </Typography>
            </MuiCard>
          );})}
        </Box>
      )}
    </Box>
  );
}


