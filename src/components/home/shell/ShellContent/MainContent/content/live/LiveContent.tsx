"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function LiveContent() {
  return (
    <ContentTemplate
      title="Live"
      subtitle="A live streaming hub for gamers and communities."
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
          Go live, get discovered, and grow your community
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          A streamlined live hub focused on the gaming experience: easy go-live flows, category tags, team channels,
          stream schedules, and instant clip creation. Clean viewing with chat that doesn’t get in your way.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


