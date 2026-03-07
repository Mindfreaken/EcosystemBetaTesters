import { defineTable } from "convex/server";
import { v } from "convex/values";

export const readReceiptTables = {
  messageReadReceipts: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.number(),
    deviceInfo: v.optional(v.string()),
  })
    .index("by_message", ["messageId"]) 
    .index("by_user_and_message", ["userId", "messageId"]) 
    .index("by_user_recent", ["userId", "readAt"]),
} as const;
