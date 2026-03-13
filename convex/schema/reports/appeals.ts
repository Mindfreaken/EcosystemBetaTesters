import { defineTable } from "convex/server";
import { v } from "convex/values";

export const appealTables = {
  appeals: defineTable({
    userId: v.id("users"),
    logId: v.id("suspensionLogs"),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    adminId: v.optional(v.id("users")),
    adminNote: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
} as const;
