"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";

export default function DocsContent() {
  return (
    <ContentTemplate
      title="Docs"
      subtitle="Your documentation hub for guides, FAQs, and developer resources."
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
          Documentation crafted for gamers, creators, and developers
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("mutedForeground") }}>
          Centralize how-to guides, best practices, onboarding checklists, and developer references. 
          Clear search, versioned content, and copy-ready code blocks to speed you up.
        </Typography>

      </Box>
    </ContentTemplate>
  );
}


