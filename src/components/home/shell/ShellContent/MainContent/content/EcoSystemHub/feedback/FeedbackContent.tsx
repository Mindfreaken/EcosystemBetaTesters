"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentTemplate from "../../_shared/ContentTemplate";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackList from "./components/FeedbackList";
import { useRouter, useSearchParams } from "next/navigation";
import { useFeedback } from "./hooks/useFeedback";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createFeedback } = useFeedback();

  const goBack = () => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.delete("ecoHubView");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };

  return (
    <ContentTemplate
      title="Feedback"
      subtitle="See community feedback, vote, and contribute your thoughts"
      maxWidth={"lg"}
      gutterX={{ xs: 1, sm: 2, md: 3 }}
      gutterY={{ xs: 1, sm: 2, md: 3 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <UiButton size="sm" variant="outline" startIcon={<ArrowBackIcon fontSize="small" />} onClick={goBack}>
          Back to Hub
        </UiButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
          gap: 1.5,
        }}
      >
        <MuiCard variant="interactive">
          <FeedbackForm
            onSubmit={(payload) => {
              createFeedback({
                topic: payload.topic,
                overall: payload.overall,
                comments: payload.comments,
                answers: payload.answers,
              });
            }}
          />
        </MuiCard>

        <Box>
          <MuiCard variant="interactive">
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "var(--text)" }}>
              Community feedback
            </Typography>
            <FeedbackList />
          </MuiCard>
        </Box>
      </Box>
    </ContentTemplate>
  );
}
