import { defineTable } from "convex/server";
import { v } from "convex/values";
import { activityTypeV } from "./validators";

export const userActivityTables = {
  activities: defineTable({
    userId: v.id("users"),
    type: activityTypeV,
    title: v.string(),
    description: v.optional(v.string()),
    timestamp: v.number(),
    imageUrl: v.optional(v.string()),
    content: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetName: v.optional(v.string())
  }).index("by_user", ["userId"]),
} as const;
