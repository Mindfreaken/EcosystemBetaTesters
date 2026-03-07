import { defineTable } from "convex/server";
import { v } from "convex/values";

export const suspensionTables = {
    suspensionLogs: defineTable({
        userId: v.id("users"),
        previousStatus: v.optional(v.string()),
        newStatus: v.string(),
        reason: v.string(),
        updatedBy: v.optional(v.id("users")), // System or Admin ID
        metadata: v.optional(v.any()), // links to proof, appeals, etc.
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_created_at", ["createdAt"]),
} as const;
