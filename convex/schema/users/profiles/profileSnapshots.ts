import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userProfileSnapshotTables = {
  profileSnapshots: defineTable({
    userId: v.id("users"),
    snapshottingUserId: v.id("users"),
    timestamp: v.number(),
    joinNumber: v.optional(v.number()),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    followers: v.number(),
    achievementsCount: v.number(),
    role: v.optional(v.string()),
    joinDate: v.number(),
    socialScore: v.number(),
  })
    .index("by_user_and_snapshotting_user", ["userId", "snapshottingUserId"]) 
    .index("by_snapshotting_user_and_timestamp", ["snapshottingUserId", "timestamp"]),
} as const;
