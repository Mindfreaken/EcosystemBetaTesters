"use client";

import React from "react";
import Box from "@mui/material/Box";
import HubTabs from "./tabs/HubTabs";
import ProfileFilters from "./tabs/ProfileFilters";
import SectionTabs from "./tabs/SectionTabs";
import RoleTabs from "./tabs/lol_ranked_solo_tab/RoleTabs";
export type { GamingTabKey, GameHubKey } from "./tabsConfig";
export type { RoleTabKey } from "./tabs/lol_ranked_solo_tab/RoleTabs";

type ProfileBarProps = {
  visible?: boolean;
  mode?: string;
  onModeChange?: (mode: string) => void;
  season?: string;
  onSeasonChange?: (season: string) => void;
  onBack?: () => void;
  // Optional controlled role tab state for Ranked Solo
  roleTab?: import("./tabs/lol_ranked_solo_tab/RoleTabs").RoleTabKey;
  onRoleTabChange?: (val: import("./tabs/lol_ranked_solo_tab/RoleTabs").RoleTabKey) => void;
  // Which game hub is active (to limit RoleTabs to League only)
  hubValue?: import("./tabsConfig").GameHubKey;
};

export default function GamingTabs({
  hubValue,
  onHubChange,
  tabValue,
  onTabChange,
  profileBar,
}: {
  hubValue: import("./tabsConfig").GameHubKey;
  onHubChange: (newValue: import("./tabsConfig").GameHubKey) => void;
  tabValue: import("./tabsConfig").GamingTabKey;
  onTabChange: (newValue: import("./tabsConfig").GamingTabKey) => void;
  profileBar?: ProfileBarProps;
}) {

  return (
    <Box
      sx={{
        width: "100%",
        // Edge-to-edge top bar
        px: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        // Frosted glass look
        background:
          "linear-gradient(180deg, color-mix(in oklab, var(--background), transparent 35%) 0%, color-mix(in oklab, var(--card), transparent 60%) 100%)",
        backdropFilter: "blur(14px) saturate(1.3)",
        WebkitBackdropFilter: "blur(14px) saturate(1.3)",
        borderBottom: "1px solid color-mix(in oklab, var(--border), transparent 35%)",
        boxShadow: "0 8px 30px color-mix(in oklab, var(--shadow), transparent 85%)",
        // subtle glass sheen
        "&::before": {
          content: "''",
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground), transparent 85%), transparent)",
          pointerEvents: "none",
        },
        // subtle noise / texture overlay
        "&::after": {
          content: "''",
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1200px 200px at 50% -50%, color-mix(in oklab, var(--primaryLight), transparent 95%), transparent 60%)",
          opacity: 0.4,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          // Use some inner padding to align with page content while still edge-to-edge background
          maxWidth: "100%",
          px: { xs: 1, sm: 2, md: 3 },
          mx: "auto",
        }}
      >
        {/* Row 1: Game hubs */}
        <HubTabs value={hubValue} onChange={onHubChange} />

        {/* Row 2: Section tabs */}
        <SectionTabs value={tabValue} onChange={onTabChange} />

        {/* Row 3: Mode tabs (show on Global Insights; back button only when a profile is selected) */}
        <ProfileFilters
          visible={(tabValue === "globalInsights") || Boolean(profileBar?.visible)}
          mode={profileBar?.mode}
          onModeChange={profileBar?.onModeChange}
          season={profileBar?.season}
          onSeasonChange={profileBar?.onSeasonChange}
          onBack={Boolean(profileBar?.visible) ? profileBar?.onBack : undefined}
        />

        {/* Row 4: Role tabs (League + Ranked Solo only) */}
        {(profileBar?.hubValue === "lol") && (profileBar?.mode === "Ranked Solo") && Boolean(profileBar?.visible) ? (
          <Box sx={{ mt: 0.25 }}>
            <RoleTabs value={profileBar.roleTab} onChange={profileBar.onRoleTabChange} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
