"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { ArrowRight, Megaphone, MessageSquare, FlaskConical, Bug, Lightbulb, Home as HomeIcon } from "lucide-react";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import FeedbackContent from "./feedback/FeedbackContent";
import FeaturesContent from "./features/FeaturesContent";
import BugsContent from "./bugs/BugsContent";
import BetasContent from "./betas/BetasContent";
import AnnouncementsContent from "./announcements/AnnouncementsContent";
import OverseerHomeContent from "./overseer/OverseerHomeContent";
import CommunityActionsContent from "./overseer/CommunityActionsContent";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function EcoSystemHubContent() {
  const counts = useQuery(api.hub.analytics.queries.getCounts, { hub: "site" });
  const dau = counts?.dau ?? 0;
  const mau = counts?.mau ?? 0;
  const router = useRouter();
  const searchParams = useSearchParams();

  const hubView = searchParams?.get("ecoHubView");
  if (hubView === "feedback") {
    return <FeedbackContent />;
  }
  if (hubView === "features") {
    return <FeaturesContent />;
  }
  if (hubView === "bugs") {
    return <BugsContent />;
  }
  if (hubView === "betas") {
    return <BetasContent />;
  }
  if (hubView === "announcements") {
    return <AnnouncementsContent />;
  }
  if (hubView === "overseerHome") {
    return <OverseerHomeContent />;
  }
  if (hubView === "communityActions") {
    return <CommunityActionsContent />;
  }
  return (
    <>
      <ContentTemplate
        maxWidth={"lg"}
        gutterX={{ xs: 1, sm: 2, md: 3 }}
        gutterY={{ xs: 1, sm: 2, md: 3 }}
      >
        {/* Hero / Overview */}
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          background: "linear-gradient(180deg, color-mix(in oklab, var(--primary), transparent 92%) 0%, transparent 100%)",
          border: "1px solid color-mix(in oklab, var(--foreground), transparent 90%)",
        }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--textLight)' }}>Welcome to the Ecosystem Overseer Hub</Typography>
              <Typography variant="body2" sx={{ color: "var(--textSecondary)" }}>
                Discover what's new, share feedback, and try experimental features. Everyone is an Overseer — please help the site grow by helping it evolve.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
              <Chip label="Alpha" color="primary" variant="outlined" size="small" />
              <Chip label={`DAU: ${dau.toLocaleString()} · MAU: ${mau.toLocaleString()}`} size="small" sx={{ color: 'var(--textLight)' }} />
            </Stack>
          </Stack>
        </Box>

        {/* Quick Actions */}
        <Box sx={{
          mt: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(2, 1fr)'
          },
          gap: 1.5,
        }}>
          {[
            { icon: <HomeIcon size={18} />, title: "Overseer Home", desc: "Take part in overseeing the ecosystem and managing the community", cta: "Open" },
            { icon: <Megaphone size={18} />, title: "Community", desc: "Announcements and ways to get involved.", cta: null as any },
          ].map((item, i) => (
            <Box key={i}>
              <MuiCard variant="interactive" className="h-full">
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ fontSize: 0, display: 'grid', placeItems: 'center', width: 28, height: 28, color: 'var(--textSecondary)' }}>{item.icon}</Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--textLight)' }}>{item.title}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'var(--textSecondary)' }}>{item.desc}</Typography>
                  <Box sx={{ flex: 1 }} />
                  {item.title === 'Community' ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <UiButton variant="outline" size="sm" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "announcements");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}>Announcements</UiButton>
                      <UiButton variant="outline" size="sm" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "feedback");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}>Feedback</UiButton>
                      <UiButton variant="outline" size="sm" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "features");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}>Feature</UiButton>
                      <UiButton variant="outline" size="sm" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "bugs");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}>Bugs</UiButton>
                      <UiButton variant="outline" size="sm" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "betas");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}>Betas</UiButton>
                    </Stack>
                  ) : item.title === 'Overseer Home' ? (
                    <UiButton
                      size="sm"
                      variant="secondary"
                      endIcon={<ArrowRight size={14} />}
                      className="self-start"
                      onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("ecoHubView", "overseerHome");
                        const qs = sp.toString();
                        router.replace(qs ? `/home?${qs}` : "/home");
                      }}
                    >
                      {item.cta}
                    </UiButton>
                  ) : (
                    item.cta ? (
                      <UiButton size="sm" variant="secondary" endIcon={<ArrowRight size={14} />} className="self-start">
                        {item.cta}
                      </UiButton>
                    ) : null
                  )}
                </Stack>
              </MuiCard>
            </Box>
          ))}
        </Box>
      </ContentTemplate>
    </>
  );
}

