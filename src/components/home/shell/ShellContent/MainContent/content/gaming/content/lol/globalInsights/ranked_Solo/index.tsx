"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import RecentMatches from "./general_overview/RecentMatches";
import HeaderIdentity from "./shared/HeaderIdentity"
import PeakCurrentCard from "./general_overview/PeakCurrentCard";
import Last50Summary from "./general_overview/Last50Summary";
import TrendMini from "./general_overview/TrendMini";
import { cardSx, sectionLabelSx } from "./general_overview/styles";
import { useSearchParams } from "next/navigation";
import type { RoleKey } from "./general_overview/utils";

export default function LolGlobalProfileContent({ onBack }: { onBack?: () => void }) {
  const search = useSearchParams();
  const puuid = search.get("puuid") || undefined;
  const region = (search.get("region") || "NA1").toUpperCase();
  const queue = search.get("queue") || "RANKED_SOLO_5x5";
  const roleParam = (search.get("role") || "overview").toLowerCase();
  const role: RoleKey | "all" = ["jungle","top","mid","bot","sup"].includes(roleParam) ? (roleParam as RoleKey) : "all";
  // Mock data for now; wire to real data later
  const profile = {
    name: "Tree Frog",
    iconId: 1235,
    region: "NA",
    rank: "Challenger",
    peak: { tier: "challenger", lp: 4321, badgeText: "4321 LP" },
    current: { tier: "grandmaster", lp: 4180, leaderboard: 128 },
  } as const;

  // Trend is computed dynamically from recent matches in TrendMini
  const [trendCount, setTrendCount] = React.useState<number>(0);

  return (
    <Box sx={{ px: 0, py: 0, width: "100%" }}>

      {/* Identity */}
      <HeaderIdentity region={region} queue={queue} puuid={puuid} />

      {/* Peak/Current/Δ + Current Form + Trend */}
      <Box sx={{
        // Bleed like the banner so left/right edges align perfectly
        mx: { xs: -1, sm: -2, md: -3 },
        px: { xs: 1, sm: 2, md: 3 },
        mb: 1.5,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' },
        gridAutoRows: 'minmax(0, auto)',
        gap: 1.5,
        alignItems: 'stretch',
      }}>
        {/* Left meta column */}
        <Box sx={{ gridColumn: { xs: '1', md: '1' }, justifySelf: { xs: 'stretch', md: 'start' }, width: { xs: 'auto', md: 'fit-content' } }}>
          <PeakCurrentCard region={region} queue={queue} puuid={puuid} />
        </Box>

        {/* Current Form */}
        <Box sx={{ gridColumn: { xs: '1', md: '2' } }}>
          <Last50Summary region={region} queue={queue} puuid={puuid} role={role} />
        </Box>
        {/* Trend */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Paper elevation={0} sx={{ ...cardSx, p: 1.25, height: '100%' }}>
            <Typography variant="subtitle2" sx={sectionLabelSx}>Trend ({trendCount})</Typography>
            <TrendMini region={region} queue={queue} puuid={puuid} role={role} onCount={setTrendCount} />
          </Paper>
        </Box>
    </Box>

      {/* Recent Matches */}
      <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mt: 1.5 }}>
        <Typography variant="subtitle2" sx={sectionLabelSx}>Recent Matches</Typography>
        <RecentMatches region={region} queue={queue} puuid={puuid} role={role} />
      </Paper>
    </Box>
  );
}


