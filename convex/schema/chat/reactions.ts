import { defineTable } from "convex/server";
import { v } from "convex/values";

export const reactionTables = {
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    reaction: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_message", ["userId", "messageId"]) 
    .index("by_message", ["messageId"]),
} as const;
