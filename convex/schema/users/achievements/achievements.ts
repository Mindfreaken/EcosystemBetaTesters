import { defineTable } from "convex/server";
import { v } from "convex/values";
import { rarityV } from "./validators";

export const userAchievementTables = {
  achievements: defineTable({
    name: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    category: v.string(),
    rarity: rarityV,
    limitedEdition: v.optional(v.boolean()),
    maxUsers: v.optional(v.number()),
  })
    .index("by_name", ["name"]) 
    .index("by_category", ["category"]),

  achievementsDefs: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    requirements: v.string(),
    rewardType: v.optional(v.string()),
    rewardValue: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_key", ["key"]) 
    .index("by_category", ["category"]),

  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    earnedDate: v.number()
  })
    .index("by_user", ["userId"]) 
    .index("by_user_and_achievement", ["userId", "achievementId"]),
} as const;
