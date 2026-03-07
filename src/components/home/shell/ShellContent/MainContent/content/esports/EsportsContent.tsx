"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UiButton from "@/components/ui/UiButton";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { useShellView } from "../../../viewContext";
import { themeVar } from "@/theme/registry";

export default function EsportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setView } = useShellView();

  const goToFeatureRequests = () => {
    setView("ecosystemHub");
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.set("ecoHubView", "features");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };

  return (
    <ContentTemplate title="Esports" subtitle="Tournaments, teams, stats, and competitive play.">
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        <Box
          sx={{
            textAlign: "left",
            mb: 2.5,
            p: 1.5,
            borderRadius: 1.5,
            backgroundColor: `color-mix(in oklab, ${themeVar("warning")}, transparent 90%)`,
            border: `1px solid color-mix(in oklab, ${themeVar("warningDark")}, transparent 45%)`,
            color: themeVar("textPrimary"),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: themeVar("textLight") }}>
            Preview: This section is currently non-functional and is queued for design and development.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: themeVar("textSecondary") }}>
            Tell us what you want here: brackets, standings, team pages, match history, APIs, and more.
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, color: themeVar("textLight"), textShadow: `0 0 12px ${themeVar("highlight")}` }}>
          Competitive play made simple
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("textSecondary") }}>
          Follow teams, track/play in tournaments, and schedule scrims etc.
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
          <UiButton variant="primary" size="lg" pill onClick={goToFeatureRequests}>
            Share your wishlist
          </UiButton>
        </Box>
      </Box>
    </ContentTemplate>
  );
}
