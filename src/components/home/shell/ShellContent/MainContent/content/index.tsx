"use client";

import React from "react";
import Box from "@mui/material/Box";
import { useShellView } from "../../viewContext";
import FriendsContent from "./friends/FriendsContent";
import ChatContent from "./chat/ChatContent";
import DailiesContent from "./dailies/dailiesContent";
import HomeContent from "./home/HomeContent";
import SettingsContent from "./settings/SettingsContent";
import SpacesContent from "./spaces/SpacesContent";
import HireContent from "./hire/HireContent";
import ViewContent from "./view/ViewContent";
import LiveContent from "./live/LiveContent";
import CampaignsContent from "./campaigns/CampaignsContent";
import DocsContent from "./docs/DocsContent";
import MusicContent from "./music/MusicContent";
import ProfileContent from "./profile/ProfileContent";
import GamingContent from "./gaming/GamingContent";
import ThemeView from "./theme/ThemeView";
import OverseerHomeContent from "./admin/OverseerHomeContent";
import CommunityActionsContent from "./admin/CommunityActionsContent";
import EsportsContent from "./esports/EsportsContent";
import NotesContent from "./notes/NotesContent";
import SpaceView from "./spaces/SpaceView";

// Keep this file focused on the MAIN CONTENT ONLY (no shell styling)
// The Shell main wrapper (background/padding/scroll) lives in shell-layout.tsx
export interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { view, selectedSpaceId, adminView } = useShellView();
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        // Full-bleed area; no card chrome here.
        // NOTE: This container must remain transparent and edge-to-edge so
        // the active view (e.g., Friends) can own its own scrolling).
        // Do not reintroduce maxWidth/borders here.
        bgcolor: "transparent",
        border: "none",
        borderRadius: 0,
        // Let children control scroll
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box sx={{ width: "100%", height: "100%", flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {view === "home" && <HomeContent />}
        {view === "friends" && <FriendsContent />}
        {view === "chat" && <ChatContent />}
        {view === "dailies" && <DailiesContent />}
        {view === "gaming" && <GamingContent />}
        {view === "settings" && <SettingsContent />}
        {view === "theme" && <ThemeView />}
        {view === "spaces" && !selectedSpaceId && <SpacesContent />}
        {view === "spaces" && selectedSpaceId && <SpaceView spaceId={selectedSpaceId} />}
        {view === "hire" && <HireContent />}
        {view === "view" && <ViewContent />}
        {view === "live" && <LiveContent />}
        {view === "campaigns" && <CampaignsContent />}
        {view === "docs" && <DocsContent />}
        {view === "music" && <MusicContent />}
        {view === "profile" && <ProfileContent />}
        {view === "admin" && adminView === "communityActions" && <CommunityActionsContent />}
        {view === "admin" && (adminView === null || adminView === "overseerHome") && <OverseerHomeContent />}
        {view === "esports" && <EsportsContent />}
        {view === "notes" && <NotesContent />}
      </Box>
    </Box>
  );
}





