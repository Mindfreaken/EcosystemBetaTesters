"use client";

import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PanelLeft, X, Home, Settings, User, FileText } from "lucide-react";
import Header from "./ShellContent/header";
import Footer from "./ShellContent/Footer";
import LeftSidebar from "./ShellContent/LeftSidebar";
import MainContent from "./ShellContent/MainContent";
import GlobalVoicePanel from "./ShellContent/GlobalVoicePanel";
import { ShellViewProvider, ShellView } from "./ShellContent/viewContext";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";

interface ShellLayoutProps {
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
}

type LeftSidebarState = "open" | "collapsed" | "closed";

export function ShellLayout({ children, headerRight }: ShellLayoutProps) {
  const searchParams = useSearchParams();
  const viewParam = (searchParams?.get("view") || "home") as ShellView;
  const [leftSidebarState, setLeftSidebarState] = useState<LeftSidebarState>("open");

  // Global Message Sound Logic
  const me = useQuery(api.users.onboarding.queries.me, {});
  const latestMessage = useQuery(
    api.chat.functions.messages.getLatestMessageForUser as any,
    me?._id ? { userId: me._id } : "skip"
  ) as { _id: string; senderId?: string; _creationTime: number } | null | undefined;

  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!latestMessage || !me?._id) return;

    const latestId = (latestMessage._id as any).toString();

    // Only play if it's a NEW message (not just loading the state)
    // and if we aren't the sender
    if (lastMessageIdRef.current && lastMessageIdRef.current !== latestId) {
      const isMine =
        latestMessage.senderId &&
        latestMessage.senderId.toString() === (me._id as any).toString();

      if (!isMine) {
        const audio = new Audio("/sounds/Ecosystem_message.mp3");
        audio.volume = 0.5;
        audio.play().catch((err) => {
          console.debug("[ShellLayout] Global message sound play blocked:", err);
        });
      }
    }

    lastMessageIdRef.current = latestId;
  }, [latestMessage?._id, me?._id]);

  const toggleLeftSidebar = () => {
    setLeftSidebarState((prev) => {
      if (prev === "open") return "collapsed";
      if (prev === "collapsed") return "closed";
      return "open";
    });
  };

  // Widths for left sidebar states
  const leftWidth =
    leftSidebarState === "open" ? 256 : leftSidebarState === "collapsed" ? 64 : 0;

  return (
    <ShellViewProvider initialView={viewParam}>
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          component="header"
          sx={{
            bgcolor: "transparent",
            borderBottom: "1px solid",
            px: { xs: 1.5, sm: 2 },
            py: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <Header
            onToggleLeft={toggleLeftSidebar}
            headerRight={headerRight}
            title="EcoSystem Testers Beta"
          />
        </Box>

        {/* Shell Area */}
        <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Left Sidebar wrapper */}
          <Box
            component="aside"
            sx={{
              width: leftWidth,
              transition: "width 300ms ease-in-out",
              overflow: "hidden",
              backgroundColor: "var(--card)",
              borderRight: "1px solid var(--card-border)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Box sx={{ p: 2, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <LeftSidebar
                state={leftSidebarState}
              />
            </Box>
            <GlobalVoicePanel />
          </Box>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              // Let inner content handle scroll to avoid double scrollbars
              overflow: "hidden",
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{
                p: 0,
                boxSizing: "border-box",
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                // Ensure the immediate child (MainContent) spans full width/height
                "& > *": {
                  width: "100% !important",
                  maxWidth: "none !important",
                  height: "100% !important",
                  minHeight: "0 !important",
                  padding: "0 !important",
                  borderRadius: "0 !important",
                  backgroundColor: "transparent !important",
                  border: "none !important",
                  margin: "0 !important",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <MainContent>{children}</MainContent>
            </Box>
          </Box>

        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            backgroundColor: "var(--card)",
            borderTop: "1px solid var(--card-border)",
            px: { xs: 1.5, sm: 2 },
            py: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Footer />
        </Box>
      </Box>
    </ShellViewProvider>
  );
}