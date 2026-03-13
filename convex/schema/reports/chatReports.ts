import { defineTable } from "convex/server";
import { v } from "convex/values";

// Reports related to chat/messages specifically
export const chatReportTables = {
  chatReports: defineTable({
    messageId: v.optional(v.id("messages")),
    reporterId: v.id("users"),
    reporterIds: v.optional(v.array(v.id("users"))),
    targetUserId: v.optional(v.id("users")),
    fileId: v.optional(v.id("files")),
    reason: v.string(),
    status: v.string(),
    content: v.string(),
    decryptedContent: v.optional(v.string()),
    timestamp: v.number(),
    resolutionReason: v.optional(v.string()),
    resolutionAction: v.optional(v.string()),
    resolutionTimestamp: v.optional(v.number()),
    resolutionModActions: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_message", ["messageId"])
    .index("by_reporter", ["reporterId"])
    .index("by_target_user", ["targetUserId"])
    .index("by_file", ["fileId"])
    .index("by_timestamp", ["timestamp"]),
} as const;
