"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function MusicContent() {
  return (
    <ContentTemplate
      title="Music"
      subtitle="Discover, share, and use music across your gaming and creator workflows."
    >
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            color: themeVar("foreground"),
            textShadow: `0 0 12px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
          }}
        >
          A music hub for gamers and creators
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Explore curated playlists for focus, hype, and streaming. Save tracks, manage queues, and connect with your creation tools.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


