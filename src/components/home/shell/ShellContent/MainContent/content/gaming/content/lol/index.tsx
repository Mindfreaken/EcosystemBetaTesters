"use client";

import React from "react";
import LolLeaderboard from "./globalInsights/LolLeaderboard";
import RolesOverview from "./globalInsights/ranked_Solo/roles_overview";
import LolGlobalProfileContent from "./globalInsights/ranked_Solo";
import { useRouter, useSearchParams } from "next/navigation";

export type RoleTabKey = import("../tabs/lol_ranked_solo_tab/RoleTabs").RoleTabKey;

export function LolGlobalInsightsScreen({
  profileSelected,
  onSelectProfile,
  onBack,
  roleTab,
}: {
  profileSelected: boolean;
  onSelectProfile: () => void;
  onBack: () => void;
  roleTab: RoleTabKey;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const region = (search.get("region") || "NA1").toUpperCase();
  const queue = search.get("queue") || "RANKED_SOLO_5x5";
  if (profileSelected) {
    return roleTab === "roles" ? (
      <RolesOverview />
    ) : (
      <LolGlobalProfileContent onBack={onBack} />
    );
  }

  return (
    <LolLeaderboard
      region={region}
      queue={queue}
      limit={100}
      offset={0}
      order="lp_desc"
      title="NA Challenger Top 100"
      onRowClick={(row) => {
        // Push player selection to URL so downstream views pick it up
        if (row.puuid) {
          const params = new URLSearchParams(search.toString());
          params.set("region", region);
          params.set("queue", queue);
          params.set("puuid", row.puuid);
          router.push(`?${params.toString()}`);
        }
        onSelectProfile();
      }}
    />
  );
}
