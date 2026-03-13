"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function ViewContent() {
  return (
    <ContentTemplate
      title="View"
      subtitle="Watch, discover, and share videos across games and communities."
    >
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            color: themeVar("foreground"),
            textShadow: `0 0 12px color-mix(in oklab, ${themeVar("primary")}, transparent 40%)`,
          }}
        >
          A short-and-long form video hub for gamers
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Think of a hybrid between platforms that host long-form videos and those focused on short, vertical clips. 
          Browse topic feeds, follow creators, and surface highlights from your games and communities.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


