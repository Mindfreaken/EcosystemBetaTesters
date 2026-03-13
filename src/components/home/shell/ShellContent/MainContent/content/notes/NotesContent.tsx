"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function NotesContent() {
  return (
    <ContentTemplate title="Notes" subtitle="Capture thoughts, ideas, and plans.">
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, color: themeVar("foreground"), textShadow: `0 0 12px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` }}>
          A lightweight knowledge base for your Ecosystem
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Draft ideas and organize with ease.
        </Typography>
      </Box>
    </ContentTemplate>
  );
}


