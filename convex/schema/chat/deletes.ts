import { defineTable } from "convex/server";
import { v } from "convex/values";

export const deleteTables = {
  messageDeleteHistory: defineTable({
    messageId: v.id("messages"),
    originalContent: v.string(),
    originalContentRich: v.optional(v.any()),
    deletedAt: v.number(),
    deletedBy: v.id("users"),
  })
    .index("by_message", ["messageId"]) 
    .index("by_deleter", ["deletedBy"]),
} as const;
