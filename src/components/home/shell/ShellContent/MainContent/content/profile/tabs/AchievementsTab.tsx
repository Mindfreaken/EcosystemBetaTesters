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
  const categories = Array.from(new Set(achievements.map((a: any) => a.category))).sort();

  const rarityAccent = (r: string | undefined) => {
    const key = String(r || "").trim().toLowerCase();
    switch (key) {
      case "common":
        return undefined; // use default card border for common
      case "rare":
        return "#8b5cf6"; // violet
      case "epic":
        return "#f59e0b"; // amber
      case "legendary":
        return "#f43f5e"; // rose
      case "mythic":
      case "mythical":
        return "#f59e0b"; // amber - mythic
      default:
        return "color-mix(in oklab, var(--foreground), transparent 86%)";
    }
  };

  return (
    <Box sx={{ color: "var(--muted-foreground)", py: 2 }}>
      {achievements.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body2">No achievements yet.</Typography>
        </Box>
      ) : (
        categories.map((category: any) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--foreground)", mb: 2, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 }}>
              {category} Achievements
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2 }}>
              {achievements
                .filter((a: any) => a.category === category)
                .map((a: any) => {
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
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
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
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                        {a.imageUrl && (
                          <Box 
                            component="img" 
                            src={a.imageUrl} 
                            alt={a.name}
                            sx={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: 1,
                              objectFit: 'contain',
                              flexShrink: 0,
                              filter: isMythic ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' : undefined
                            }} 
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: "var(--foreground)", fontWeight: 700, lineHeight: 1.2 }}>
                            {a.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--muted-foreground)", display: 'block', mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
                            {a.rarity.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" sx={{ color: "var(--muted-foreground)", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap", display: 'block', mb: 1, flex: 1 }}>
                        {a.description}
                      </Typography>
                      
                      {a.earnedDate ? (
                        <Box sx={{ pt: 1, borderTop: '1px solid color-mix(in oklab, var(--foreground), transparent 94%)' }}>
                          <Typography variant="caption" sx={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em", fontStyle: 'italic' }}>
                            Earned {new Date(a.earnedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : null}
                    </MuiCard>
                  );
                })}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}


