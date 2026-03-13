"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function CampaignsContent() {
  return (
    <ContentTemplate
      title="Campaigns"
      subtitle="Run giveaways and engagement campaigns for your community."
    >
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            color: themeVar("foreground"),
            textShadow: `0 0 12px ${themeVar("primary")}4d`,
          }}
        >
          Giveaways and community campaigns made simple
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Create campaigns with multiple entry methods like following a channel, joining a server, watching a clip, or sharing a post.
          Participants complete actions to earn entries; you review entries, draw winners, and publish results. Built-in tools help you track
          engagement, prevent abuse, and export data for sponsors or partners.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


