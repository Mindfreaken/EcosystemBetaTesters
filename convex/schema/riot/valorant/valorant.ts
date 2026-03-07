import { defineTable } from "convex/server";
import { v } from "convex/values";

// Basic, placeholder Valorant schema to be rewritten later
export const riotValorantTables = {
  valorantProfiles: defineTable({
    playerId: v.string(),
    updatedAt: v.number(),
  }).index("by_playerId", ["playerId"]),
} as const;
