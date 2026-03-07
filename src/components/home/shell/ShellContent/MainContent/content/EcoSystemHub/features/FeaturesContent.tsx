"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentTemplate from "../../_shared/ContentTemplate";
import FeatureForm from "./components/FeatureForm";
import FeatureList from "./components/FeatureList";
import { useRouter, useSearchParams } from "next/navigation";
import { useFeatures } from "./hooks/useFeatures";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function FeaturesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createFeature } = useFeatures("all");

  const goBack = () => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.delete("ecoHubView");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };

  return (
    <ContentTemplate
      title="Feature requests"
      subtitle="Propose and vote on features"
      maxWidth={"lg"}
      gutterX={{ xs: 1, sm: 2, md: 3 }}
      gutterY={{ xs: 1, sm: 2, md: 3 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <UiButton size="sm" variant="outline" startIcon={<ArrowBackIcon fontSize="small" />} onClick={goBack}>
          Back to Hub
        </UiButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 1.5 }}>
        <MuiCard variant="interactive">
          <FeatureForm onSubmit={(payload) => { void createFeature(payload); }} />
        </MuiCard>
        <MuiCard variant="interactive">
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'var(--text)' }}>Popular requests</Typography>
          <FeatureList />
        </MuiCard>
      </Box>
    </ContentTemplate>
  );
}
