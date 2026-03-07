"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentTemplate from "../../_shared/ContentTemplate";
import BugForm from "./components/BugForm";
import BugList from "./components/BugList";
import { useRouter, useSearchParams } from "next/navigation";
import { useBugs } from "./hooks/useBugs";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function BugsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createBug } = useBugs();

  const goBack = () => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.delete("ecoHubView");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };

  return (
    <ContentTemplate
      title="Bug tracker"
      subtitle="Report issues and upvote to help prioritize fixes"
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
          <BugForm onSubmit={(payload) => { void createBug(payload); }} />
        </MuiCard>
        <MuiCard variant="interactive">
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'var(--text)' }}>Open issues</Typography>
          <BugList />
        </MuiCard>
      </Box>
    </ContentTemplate>
  );
}
