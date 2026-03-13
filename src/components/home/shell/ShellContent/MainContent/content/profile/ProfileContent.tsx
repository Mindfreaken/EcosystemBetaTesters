"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import ProfileHeader from "./ProfileHeader";
import OverviewTab from "./tabs/OverviewTab";
import AchievementsTab from "./tabs/AchievementsTab";
import ActivityTab from "./tabs/ActivityTab";

export default function ProfileContent() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Hero/Header area */}
      <ProfileHeader />

      {/* Tabs */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          TabIndicatorProps={{ style: { background: "var(--primary)" } }}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--muted-foreground)",
            },
            "& .Mui-selected": { color: "var(--foreground)" },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Achievements" />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      <Divider sx={{ borderColor: "var(--border)", opacity: 0.4 }} />

      {/* Tab Panels */}
      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        {tab === 0 && <OverviewTab />}
        {tab === 1 && <AchievementsTab />}
        {tab === 2 && <ActivityTab />}
      </Box>
    </Box>
  );
}


