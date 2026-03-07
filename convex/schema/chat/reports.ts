import { defineTable } from "convex/server";
import { v } from "convex/values";

export const reportTables = {
  reports: defineTable({
    messageId: v.optional(v.id("messages")),
    reporterId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    fileId: v.optional(v.id("files")),
    reason: v.string(),
    status: v.string(),
    content: v.string(),
    decryptedContent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_status", ["status"]) 
    .index("by_message", ["messageId"]) 
    .index("by_reporter", ["reporterId"]) 
    .index("by_target_user", ["targetUserId"]) 
    .index("by_file", ["fileId"]),
} as const;
