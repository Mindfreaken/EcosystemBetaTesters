"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UiButton from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function LolMyInsights({ onMockSignIn }: { onMockSignIn?: () => void }) {
  return (
    <Box sx={{ p: 2 }}>
      <MuiCard variant="interactive" size="lg" sx={{ maxWidth: 820, mx: "auto", textAlign: "center", display: 'grid', placeItems: 'center', gap: 1.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--foreground)" }}>Link Riot to view your insights</Typography>
        <Typography variant="body2" sx={{ color: "var(--muted-foreground)" }}>This is a demo. Clicking the button will mock sign-in and load your overview.</Typography>
        <UiButton variant="outline" size="md" pill onClick={() => onMockSignIn?.()}>
          Sign in with Riot (Mock)
        </UiButton>
      </MuiCard>
    </Box>
  );
}


