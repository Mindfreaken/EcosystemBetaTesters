"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export type HeaderIdentityProps = {
  region: string; // e.g., "NA1" or "na1"
  queue: string; // e.g., "RANKED_SOLO_5x5"
  // Optional explicit player to display; if omitted, show top of leaderboard
  puuid?: string;
};

export default function HeaderIdentity({ region, queue, puuid }: HeaderIdentityProps) {
  const normalizedRegion = React.useMemo(() => region.toLowerCase(), [region]);

  // Mocked profile data: generate a deterministic, nice-looking profile without server calls
  const profile = React.useMemo(() => {
    // Create a simple pseudo-random seed from puuid or defaults
    const seedStr = puuid ?? `${normalizedRegion}-${queue}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const iconId = 1000 + (hash % 500);
    const tiers = ["diamond", "master", "grandmaster", "challenger"] as const;
    const tier = tiers[hash % tiers.length];
    const leaderboardRank = (hash % 300) + 1;
    const lp = 3800 + (hash % 600); // 3800-4399

    const displayName = puuid ? `LoL-${puuid.slice(0, 6)}` : `LoL-Player${String((hash % 9999) + 1).padStart(4, "0")}`;
    return {
      name: displayName,
      iconId,
      region: normalizedRegion.toUpperCase(),
      rank: tier.toUpperCase(),
      current: { tier, leaderboard: leaderboardRank },
      peak: { tier, lp, badgeText: `${lp} LP` },
    } as const;
  }, [normalizedRegion, queue, puuid]);

  return (
    <Paper
      elevation={0}
      sx={{
        mx: { xs: -1, sm: -2, md: -3 },
        px: { xs: 1, sm: 2, md: 3 },
        py: 2.25,
        mb: 2,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "center",
        columnGap: 2,
        rowGap: 1,
        gridTemplateAreas: {
          xs: `'icon name'`,
          sm: `'icon name'`,
        },
        borderRadius: 0,
        border: "1px solid color-mix(in oklab, var(--border), transparent 30%)",
        borderLeft: "none",
        borderRight: "none",
        background: "linear-gradient(135deg, rgba(212,175,55,0.06), transparent)",
      }}
    >
      {!profile ? (
        <Typography variant="body2" sx={{ color: "var(--muted-foreground)", gridColumn: '1 / -1' }}>No leaderboard data.</Typography>
      ) : (
        <>
          <Box
            component="img"
            src={`/league/profile-icons/${profile.iconId}.png`}
            alt="profile icon"
            width={56}
            height={56}
            sx={{ borderRadius: 2, objectFit: "cover", gridArea: { xs: "icon", sm: "auto" } }}
          />
          <Box sx={{ gridArea: { xs: "name", sm: "auto" }, minWidth: 0, overflow: "hidden" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--textLight)", lineHeight: 1.1 }}>
              <Box component="span" sx={{ display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.name}
              </Box>
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--muted-foreground)", display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box component="span">{profile.region}</Box>
              {profile.current ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ opacity: 0.6 }}>•</Box>
                  <Box component="img" src={`/league/emblems/emblem_${profile.current.tier}.svg`} alt="current rank" sx={{ width: 16, height: 16 }} />
                  <Box component="span" sx={{ fontWeight: 800, color: 'var(--foreground)' }}>
                    {profile.current.tier}
                  </Box>
                </Box>
              ) : null}
              {profile.current?.leaderboard !== undefined ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ opacity: 0.6 }}>•</Box>
                  <Box component="span" sx={{ fontWeight: 800 }}>#{profile.current.leaderboard}</Box>
                </Box>
              ) : null}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}


