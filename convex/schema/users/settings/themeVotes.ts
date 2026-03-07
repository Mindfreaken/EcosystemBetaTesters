import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userThemeVoteTables = {
  themeVotes: defineTable({
    userId: v.id("users"),
    themeId: v.string(),
    vote: v.union(v.literal("up"), v.literal("down")),
    createdAt: v.number(),
  })
    .index("by_user_and_theme", ["userId", "themeId"]) 
    .index("by_theme", ["themeId"]),
} as const;
