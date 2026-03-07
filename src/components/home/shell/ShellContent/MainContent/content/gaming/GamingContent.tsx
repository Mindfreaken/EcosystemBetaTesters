"use client";

import React from "react";
import ContentTemplate from "../_shared/ContentTemplate";
import GamingTabs, { GamingTabKey, GameHubKey, RoleTabKey } from "./content/GamingTabs";
import { LolGlobalInsightsScreen } from "./content/lol";
import { ValorantGlobalInsightsScreen } from "./content/valorant";
import ValorantMyInsights from "./content/valorant/myInsights";
import LolMyInsights from "./content/lol/myInsights";
import { useRouter, useSearchParams } from "next/navigation";

export default function GamingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = React.useState<GamingTabKey>("home");
  const [hub, setHub] = React.useState<GameHubKey>("lol");
  const [profileSelected, setProfileSelected] = React.useState(false);
  const [mode, setMode] = React.useState<string>("Ranked Solo");
  const [season, setSeason] = React.useState<string>("Season 2025 3");
  const [roleTab, setRoleTab] = React.useState<RoleTabKey>("overview");
  return (
    <>
      {/* Unified two-row top bar: game hubs + section tabs */}
      <GamingTabs
        hubValue={hub}
        onHubChange={(h) => {
          setHub(h);
          setProfileSelected(false);
          setRoleTab("overview");
        }}
        tabValue={tab}
        onTabChange={(t) => {
          setTab(t);
          if (t !== "globalInsights") setProfileSelected(false);
          if (t !== "globalInsights") setRoleTab("overview");
        }}
        profileBar={{
          visible: tab === "globalInsights" && profileSelected,
          onBack: () => { setProfileSelected(false); setRoleTab("overview"); },
          mode,
          onModeChange: setMode,
          season,
          onSeasonChange: setSeason,
          roleTab,
          onRoleTabChange: setRoleTab,
          // Pass hub so RoleTabs can be limited to League only
          hubValue: hub,
        }}
      />

      <ContentTemplate title="" subtitle="" maxWidth={'none'} gutterX={{ xs: 1, sm: 2, md: 3 }} gutterY={{ xs: 0, sm: 0, md: 0 }}>
        {tab === "globalInsights" ? (
          hub === "lol" ? (
            <LolGlobalInsightsScreen
              profileSelected={profileSelected}
              onSelectProfile={() => setProfileSelected(true)}
              onBack={() => setProfileSelected(false)}
              roleTab={roleTab}
            />
          ) : hub === "valorant" ? (
            <ValorantGlobalInsightsScreen
              profileSelected={profileSelected}
              onSelectProfile={() => setProfileSelected(true)}
              onBack={() => setProfileSelected(false)}
            />
          ) : null
        ) : tab === "myInsights" ? (
          hub === "lol" ? (
            <LolMyInsights
              onMockSignIn={() => {
                // Set mock puuid + region/queue in URL and navigate to global insights profile
                const params = new URLSearchParams(search?.toString());
                // Deterministic mock PUUID
                params.set("puuid", "mock-ec0d1e5e");
                if (!params.get("region")) params.set("region", "NA1");
                if (!params.get("queue")) params.set("queue", "RANKED_SOLO_5x5");
                router.push(`?${params.toString()}`);
                setTab("globalInsights");
                setProfileSelected(true);
                setRoleTab("overview");
              }}
            />
          ) : hub === "valorant" ? (
            <ValorantMyInsights
              onMockSignIn={() => {
                // Navigate to Global Insights (Valorant)
                const params = new URLSearchParams(search?.toString());
                router.push(`?${params.toString()}`);
                setTab("globalInsights");
                setProfileSelected(true);
              }}
            />
          ) : null
        ) : null}
      </ContentTemplate>
    </>
  );
}
