"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UiButton from "@/components/ui/UiButton";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { useShellView } from "../../../viewContext";
import { themeVar } from "@/theme/registry";

export default function DocsContent() {
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
    <ContentTemplate
      title="Docs"
      subtitle="Your documentation hub for guides, FAQs, and developer resources."
    >
      <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center", mt: 2 }}>
        {/* Non-functional preview notice */}
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
            What would make Docs most helpful? Propose structure, sections, search, code samples, tutorials, and API references you want to see.
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            color: themeVar("textLight"),
            textShadow: `0 0 12px ${themeVar("highlight")}`,
          }}
        >
          Documentation crafted for gamers, creators, and developers
        </Typography>
        <Typography variant="body1" sx={{ mt: 1.5, color: themeVar("textSecondary") }}>
          Centralize how-to guides, best practices, onboarding checklists, and developer references. 
          Clear search, versioned content, and copy-ready code blocks to speed you up.
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
          <UiButton variant="primary" size="lg" pill onClick={goToFeatureRequests}>
            Share your wishlist
          </UiButton>
        </Box>

        {/* Accent orbs for visual continuity */}
        <Box sx={{ position: "relative", mt: 6 }}>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: { xs: "-6%", md: "-4%" },
              top: -10,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, ${themeVar("secondaryLight")}, transparent 60%)`,
              filter: "blur(18px)",
              opacity: 0.35,
              transform: "translateZ(0)",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              right: { xs: "-6%", md: "-4%" },
              bottom: -10,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `radial-gradient(circle at 70% 70%, ${themeVar("primaryLight")}, transparent 60%)`,
              filter: "blur(18px)",
              opacity: 0.25,
              transform: "translateZ(0)",
            }}
          />
        </Box>
      </Box>
    </ContentTemplate>
  );
}
