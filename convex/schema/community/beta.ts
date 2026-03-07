import { defineTable } from "convex/server";
import { v } from "convex/values";

export const communityBetaTables = {
  // Beta announcements shown on Home
  betaAnnouncements: defineTable({
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    betaNumber: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  })
    .index("by_active", ["active"]) 
    .index("by_betaNumber", ["betaNumber"]) 
    .index("by_createdAt", ["createdAt"]),

  betaDismissals: defineTable({
    betaId: v.id("betaAnnouncements"),
    userId: v.id("users"),
    dismissedAt: v.number(),
  })
    .index("by_user_beta", ["userId", "betaId"]) 
    .index("by_beta", ["betaId"]),

  // Developer posts for betas (twitter-like updates)
  betaPosts: defineTable({
    userId: v.id("users"),
    topic: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]) 
    .index("by_user", ["userId"]),
} as const;
