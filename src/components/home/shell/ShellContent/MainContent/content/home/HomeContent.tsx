"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UiButton from "@/components/ui/UiButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useShellView } from "../../../viewContext";

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setView } = useShellView();

  const goToFeedback = () => {
    setView("ecosystemHub");
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.set("ecoHubView", "feedback");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
        // Fill to the edges — no rounded corners
        borderRadius: 0,
        bgcolor: "transparent",
        // Layered cyberpunk background using theme variables
        backgroundImage: `
          radial-gradient(1200px 600px at 10% -10%, var(--highlight) 0%, transparent 60%),
          radial-gradient(1000px 500px at 110% 110%, var(--secondaryHover) 0%, transparent 60%),
          radial-gradient(800px 400px at -10% 110%, var(--primaryHover) 0%, transparent 60%),
          linear-gradient(135deg, var(--background) 0%, var(--backgroundAlt) 60%)
        `,
        backgroundBlendMode: "screen, screen, screen, normal",
        p: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
   >
      {/* Neon grid overlay */}
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px, 32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          borderRadius: "inherit",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1040,
          mx: "auto",
          textAlign: "center",
          color: "var(--textPrimary)",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: ".2em",
            color: "var(--textSecondary)",
            textTransform: "uppercase",
          }}
        >
          Welcome to
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            lineHeight: 1.05,
            textShadow: "0 0 16px var(--highlight)",
            color: "var(--textLight)",
          }}
        >
          EcoSystem
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mt: 1.5,
            color: "var(--textSecondary)",
            maxWidth: 720,
            mx: "auto",
          }}
        >
          Your Ecosystem for friends, chat, gamining, esports, and more. Kick back, explore, and have fun while we grow. 
          You have ideas or issues? We want to hear them! Share them in the EcoSystem Hub. 
          We will be adding features to this page as we grow. feedback is appreciated!
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 3, flexWrap: "wrap" }}>
          <UiButton variant="primary" size="lg" pill onClick={goToFeedback}>
            Give your feedback!
          </UiButton>
        </Box>

        {/* Floating accent orbs */}
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
              background: "radial-gradient(circle at 30% 30%, var(--secondaryLight), transparent 60%)",
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
              background: "radial-gradient(circle at 70% 70%, var(--primaryLight), transparent 60%)",
              filter: "blur(18px)",
              opacity: 0.25,
              transform: "translateZ(0)",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
