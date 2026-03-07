import React from "react";
import { Gamepad2, BarChart3, Globe2, Users, Trophy, FolderKanban, Sword, Crosshair } from "lucide-react";

export type GamingTabKey =
  | "home"
  | "myInsights"
  | "globalInsights"
  | "myTeam"
  | "collections"
  | "achievements";

export const gamingTabs: { key: GamingTabKey; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "Gaming Home", icon: React.createElement(Gamepad2, { size: 12 }) },
  { key: "myInsights", label: "My Insights", icon: React.createElement(BarChart3, { size: 12 }) },
  { key: "globalInsights", label: "Global Insights", icon: React.createElement(Globe2, { size: 12 }) },
  { key: "myTeam", label: "My Team", icon: React.createElement(Users, { size: 12 }) },
  { key: "collections", label: "Collections", icon: React.createElement(FolderKanban, { size: 12 }) },
  { key: "achievements", label: "Achievements", icon: React.createElement(Trophy, { size: 12 }) },
];

export type GameHubKey = "lol" | "valorant";

export const gameHubs: { key: GameHubKey; label: string; icon: React.ReactNode }[] = [
  { key: "lol", label: "League", icon: React.createElement(Sword, { size: 10 }) },
  { key: "valorant", label: "Valorant", icon: React.createElement(Crosshair, { size: 10 }) },
];

export const profileModes = [
  "Ranked Solo",
  "Ranked Flex",
  "ARAM",
  "Swiftplay",
  "Normal Draft",
  "Arena",
] as const;

export type ProfileMode = typeof profileModes[number];
