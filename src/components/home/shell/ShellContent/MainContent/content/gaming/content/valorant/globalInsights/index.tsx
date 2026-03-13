"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Leaderboard from "../../_shared/Leaderboard";

export default function ValorantGlobalInsights() {
  return (
    <Box sx={{ p: 2 }}>
      <Leaderboard title="Valorant Global Leaderboard" game="Valorant" pageSize={100} />
    </Box>
  );
}


