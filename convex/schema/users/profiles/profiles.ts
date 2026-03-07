import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userProfileTables = {
  profiles: defineTable({
    userId: v.id("users"),
    updatedAt: v.number(),
    profileTypeId: v.optional(v.id("profileTypes")),
  }).index("by_userId", ["userId"]),
} as const;
