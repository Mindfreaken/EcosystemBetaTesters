"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ValLeaderboard from "./globalInsights/ValLeaderboard";
import LolGlobalProfileContent from "../lol/globalInsights/ranked_Solo";

export function ValorantGlobalInsightsScreen({
  profileSelected,
  onSelectProfile,
  onBack,
}: {
  profileSelected: boolean;
  onSelectProfile: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const region = (search.get("region") || "NA1").toUpperCase();
  const queue = search.get("queue") || "RANKED_SOLO_5x5";

  if (profileSelected) {
    // Reuse the League profile overview layout for exact-copy visuals
    return <LolGlobalProfileContent onBack={onBack} />;
  }

  return (
    <ValLeaderboard
      title="NA Challenger Top 100"
      onRowClick={(row) => {
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
