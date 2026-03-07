"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Leaderboard, { LeaderboardRow } from "../../_shared/Leaderboard";

export type LolLeaderboardProps = {
  region: string; // e.g. "NA1"
  queue: string; // e.g. "RANKED_SOLO_5x5"
  limit?: number; // default 100
  offset?: number; // default 0
  order?: "lp_desc" | "lp_asc";
  title?: string;
  onRowClick?: (row: LeaderboardRow) => void;
  useMock?: boolean;
};

export default function LolLeaderboard({
  region,
  queue,
  limit = 100,
  offset = 0,
  order = "lp_desc",
  title,
  onRowClick,
  useMock = true,
}: LolLeaderboardProps) {
  // Avoid unused var lints while Convex is disabled
  void region; void queue; void offset; void order; void useMock;

  return (
    <Box sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
      )}
      <Leaderboard
        game="LoL"
        pageSize={limit}
        useMock
        loadingText="Loading LOL-leaderboard...!"
        emptyText="No LOL leaderboard data."
        onRowClick={onRowClick}
      />
    </Box>
  );
}
