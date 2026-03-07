import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userSocialScoreTables = {
  socialScores: defineTable({
    userId: v.id("users"),
    score: v.number(),
    lastUpdated: v.number()
  }).index("by_user", ["userId"]),
} as const;
