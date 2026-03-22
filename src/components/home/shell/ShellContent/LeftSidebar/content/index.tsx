"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { X, Home, Settings, User, FileText, Users, Briefcase, PlayCircle, Radio, Megaphone, Music, Gamepad2, Joystick, Leaf } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useShellView } from "../../viewContext";

// Keep this file focused on the LEFT SIDEBAR CONTENT ONLY (no shell styling)
// The Shell left sidebar wrapper (background/border/padding/width) lives in shell-layout.tsx
export type LeftSidebarState = "open" | "collapsed" | "closed";

export interface LeftSidebarContentProps {
  state: LeftSidebarState;
}

export default function LeftSidebarContent({ state }: LeftSidebarContentProps) {
  if (state === "closed") return null;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setView, setSelectedSpaceId } = useShellView();
  const [showGamingMockNotice, setShowGamingMockNotice] = React.useState(false);

  const navigateHome = () => {
    if (pathname?.startsWith("/home")) {
      setView("home");
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.delete("view");
      const qs = sp.toString();
      router.replace(qs ? `/home?${qs}` : "/home");
    } else {
      router.push("/home");
    }
  };

  const navigateMusic = () => {
    if (pathname?.startsWith("/home")) {
      setView("music");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "music");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=music");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateDocs = () => {
    if (pathname?.startsWith("/home")) {
      setView("docs");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "docs");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=docs");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateCampaigns = () => {
    if (pathname?.startsWith("/home")) {
      setView("campaigns");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "campaigns");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=campaigns");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateHire = () => {
    if (pathname?.startsWith("/home")) {
      setView("hire");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "hire");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=hire");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateDailies = () => {
    if (pathname?.startsWith("/home")) {
      setView("dailies");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "dailies");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=dailies");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateGaming = () => {
    if (pathname?.startsWith("/home")) {
      setView("gaming");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "gaming");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=gaming");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('gamingMockNoticeShown')) {
        sessionStorage.setItem('gamingMockNoticeShown', '1');
        setShowGamingMockNotice(true);
      }
    } catch { }
  };

  const navigateSpaces = () => {
    if (pathname?.startsWith("/home")) {
      setView("spaces");
      setSelectedSpaceId(null);
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "spaces");
      sp.delete("spaceId");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=spaces");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateView = () => {
    if (pathname?.startsWith("/home")) {
      setView("view");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "view");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=view");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateLive = () => {
    if (pathname?.startsWith("/home")) {
      setView("live");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "live");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=live");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateEsports = () => {
    if (pathname?.startsWith("/home")) {
      setView("esports");
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "esports");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=esports");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navItems = [
    { icon: <Home size={16} />, label: "Home" },
    { icon: <Gamepad2 size={16} />, label: "Dailies" },
    { icon: <Users size={16} />, label: "Spaces" },
    { icon: <Briefcase size={16} />, label: "Hire" },
    { icon: <PlayCircle size={16} />, label: "View" },
    { icon: <Radio size={16} />, label: "Live" },
    { icon: <Megaphone size={16} />, label: "Campaigns" },
    { icon: <FileText size={16} />, label: "Docs" },
    { icon: <Music size={16} />, label: "Music" },
    { icon: <Joystick size={16} />, label: "Gaming" },
    { icon: <Joystick size={16} />, label: "Esports" },
  ];

  const featured = { icon: <Leaf size={16} />, label: "Ecosystem Hub" };

  return (
    <>
      {state === "open" && (
        <>

          {/* Nav list with blended styling from old sidebar */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {navItems.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  color: "var(--muted-foreground)",
                  borderLeft: "3px solid transparent",
                  transition: "transform .2s ease, box-shadow .2s ease, background-color .2s ease",
                  backgroundColor: "color-mix(in oklab, var(--card), transparent 92%)",
                  "&:hover": {
                    transform: "translateX(4px) scale(1.01)",
                    backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
                    boxShadow: "0 4px 8px var(--shadow)",
                    color: "var(--foreground)",
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
                }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (item.label === "Home") navigateHome();
                  if (item.label === "Spaces") navigateSpaces();
                  if (item.label === "Hire") navigateHire();
                  if (item.label === "View") navigateView();
                  if (item.label === "Live") navigateLive();
                  if (item.label === "Campaigns") navigateCampaigns();
                  if (item.label === "Music") navigateMusic();
                  if (item.label === "Docs") navigateDocs();
                  if (item.label === "Gaming") navigateGaming();
                  if (item.label === "Dailies") navigateDailies();
                  if (item.label === "Esports") navigateEsports();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (item.label === "Home") navigateHome();
                    if (item.label === "Spaces") navigateSpaces();
                    if (item.label === "Hire") navigateHire();
                    if (item.label === "View") navigateView();
                    if (item.label === "Live") navigateLive();
                    if (item.label === "Campaigns") navigateCampaigns();
                    if (item.label === "Music") navigateMusic();
                    if (item.label === "Docs") navigateDocs();
                    if (item.label === "Gaming") navigateGaming();
                    if (item.label === "Dailies") navigateDailies();
                    if (item.label === "Esports") navigateEsports();
                  }
                }}
              >
                <Box sx={{ fontSize: 0, display: "grid", placeItems: "center", minWidth: 24 }}>{item.icon}</Box>
                <Typography variant="body2">{item.label}</Typography>
                {/* WIP badge for non-core items */}
                {item.label !== "Home" && item.label !== "Dailies" && item.label !== "Spaces" && (
                  <Box
                    sx={{
                      ml: "auto",
                      fontSize: 10,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 10,
                      background: "linear-gradient(45deg, #ff9800, #ff5722)",
                      color: "#fff",
                      letterSpacing: 0.4,
                    }}
                  >
                    {item.label === "Gaming" ? "MOCK" : "SOON"}
                  </Box>
                )}
              </Box>
            ))}
          </Box>


        </>
      )}

      {state === "collapsed" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", "& .MuiIconButton-root": { color: "var(--muted-foreground)", transition: "color 0.2s", "&:hover": { color: "var(--primary)" } } }}>
          <Box sx={{ display: "grid", gap: 1.5, mt: 1 }}>
            <IconButton
              size="small"
              sx={{ backgroundColor: "color-mix(in oklab, var(--primary), transparent 85%)", color: "var(--primary) !important" }}
              onClick={navigateHome}
              aria-label="Home"
            >
              <Home size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateSpaces} aria-label="Spaces">
              <Users size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateGaming} aria-label="Gaming">
              <Joystick size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateDailies} aria-label="Dailies">
              <Gamepad2 size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateLive} aria-label="Live">
              <Radio size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateView} aria-label="View">
              <PlayCircle size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateCampaigns} aria-label="Campaigns">
              <Megaphone size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateMusic} aria-label="Music">
              <Music size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateHire} aria-label="Hire">
              <Briefcase size={16} />
            </IconButton>
            <IconButton size="small" onClick={navigateDocs} aria-label="Docs">
              <FileText size={16} />
            </IconButton>
            <IconButton size="small" aria-label="User Profile">
              <User size={16} />
            </IconButton>
            <IconButton size="small" aria-label="Settings">
              <Settings size={16} />
            </IconButton>
          </Box>
        </Box>
      )}

      <Snackbar
        open={showGamingMockNotice}
        autoHideDuration={6000}
        onClose={() => setShowGamingMockNotice(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setShowGamingMockNotice(false)} severity="info" sx={{ width: '100%' }} variant="filled">
          This Gaming page uses mock data. Please provide feedback and feature requests via the Ecosystem Hub.
        </Alert>
      </Snackbar>
    </>
  );
}




