"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";
import { Megaphone, MessageSquare, Bug, Lightbulb, FlaskConical, Home as HomeIcon } from "lucide-react";
import { useShellView } from "../../viewContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Keep this file focused on the RIGHT SIDEBAR CONTENT ONLY (no shell styling)
// The Shell right sidebar wrapper (background/border/padding/width) lives in shell-layout.tsx
export interface RightSidebarContentProps {
  onClose: () => void;
}

export default function RightSidebarContent({ onClose }: RightSidebarContentProps) {
  const { setView } = useShellView();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openHubHome = () => {
    if (pathname?.startsWith("/home")) {
      setView("ecosystemHub");
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.delete("ecoHubView");
      const qs = sp.toString();
      router.replace(qs ? `/home?${qs}` : "/home");
    } else {
      setView("ecosystemHub");
      router.push("/home");
    }
  };

  const openHubView = (view: "feedback" | "features" | "bugs") => {
    setView("ecosystemHub");
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.set("ecoHubView", view);
    const qs = sp.toString();
    if (pathname?.startsWith("/home")) {
      router.replace(qs ? `/home?${qs}` : "/home");
    } else {
      router.push(qs ? `/home?${qs}` : "/home");
    }
  };

  const hubItems = [
    { icon: <HomeIcon size={16} />, label: "Ecosystem Hub", desc: "Hub overview", onClick: openHubHome },
    { icon: <Megaphone size={16} />, label: "Announcements", desc: "Latest updates and releases", onClick: () => openHubView("announcements" as any) },
    { icon: <MessageSquare size={16} />, label: "Feedback", desc: "Tell us what to build next", onClick: () => openHubView("feedback") },
    { icon: <Bug size={16} />, label: "Report a bug", desc: "Help us squash issues fast", onClick: () => openHubView("bugs") },
    { icon: <Lightbulb size={16} />, label: "Request a feature", desc: "Share your wishlist and ideas", onClick: () => openHubView("features") },
    { icon: <FlaskConical size={16} />, label: "Join betas", desc: "Opt-in to experimental features", onClick: () => openHubView("betas" as any) },
  ];

  const itemBase = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.5,
    py: 1.25,
    borderRadius: 1,
    position: "relative" as const,
    overflow: "hidden",
    cursor: "pointer",
    color: "var(--textSecondary)",
    borderLeft: "3px solid transparent",
    transition: "transform .2s ease, box-shadow .2s ease, background-color .2s ease",
    backgroundColor: "color-mix(in oklab, var(--card), transparent 92%)",
    "&:hover": {
      transform: "translateX(-4px) scale(1.01)",
      backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
      boxShadow: "0 4px 8px var(--shadow)",
      color: "var(--text)",
      borderLeftColor: "var(--primary)",
    },
    "&::before": {
      content: "''",
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 100%)",
      transform: "translateX(-100%)",
      transition: "transform .3s ease-out",
    },
    "&:hover::before": {
      transform: "translateX(0)",
    },
  } as const;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "var(--textLight)", lineHeight: 1.1 }}
          >
            Ecosystem Hub
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--textSecondary)" }}>
            Central place for updates, feedback, and experiments
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
          <X size={12} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {hubItems.map((item, i) => (
          <Box key={i} sx={itemBase as any} onClick={item.onClick as any} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") (item.onClick as any)?.(); }}
          >
            <Box sx={{ fontSize: 0, display: "grid", placeItems: "center", minWidth: 24 }}>{item.icon}</Box>
            <Typography variant="body2">{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

