import { defineTable } from "convex/server";
import { v } from "convex/values";

// Dungeon Deal game tables (placeholder; to be redesigned)
export const dungeonDealTables = {
  dungeonDealProfiles: defineTable({
    playerId: v.string(),
    updatedAt: v.number(),
  }).index("by_playerId", ["playerId"]),
} as const;
