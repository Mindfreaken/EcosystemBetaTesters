"use client";

import React from "react";
import Box from "@mui/material/Box";
import LolLeaderboard from "./LolLeaderboard";

export default function LolGlobalInsights() {
  return (
    <Box sx={{ p: 2 }}>
      <LolLeaderboard
        region="NA1"
        queue="RANKED_SOLO_5x5"
        limit={5}
        offset={0}
        order="lp_desc"
        title="NA Challenger Top 5 (Mock)"
        useMock
      />
    </Box>
  );
}


