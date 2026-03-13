"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function HireContent() {
  return (
    <ContentTemplate
      title="Hire"
      subtitle="Discover and hire talented artists, editors, and creators."
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
          A creator marketplace for gamers, esports and communities
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Post what you need and browse talent with portfolios and reviews. Creators publish example work and service packages
          (like logo design, overlays, video edits, music cues, thumbnails, and more). You choose a package, discuss details,
          and complete the order with clear timelines, deliverables, and revisions.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


