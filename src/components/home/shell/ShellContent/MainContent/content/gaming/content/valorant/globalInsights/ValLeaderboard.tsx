"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Leaderboard, { LeaderboardRow } from "../../_shared/Leaderboard";

export type ValLeaderboardProps = {
  title?: string;
  onRowClick?: (row: LeaderboardRow) => void;
};

export default function ValLeaderboard({ title = "Valorant Leaderboard (Mock)", onRowClick }: ValLeaderboardProps) {
  return (
    <Box sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
      )}
      <Leaderboard
        game="Valorant"
        useMock
        loadingText="Loading VAL-leaderboard..."
        emptyText="No VAL leaderboard data."
        onRowClick={onRowClick}
      />
    </Box>
  );
}


