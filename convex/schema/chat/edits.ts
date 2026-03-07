import { defineTable } from "convex/server";
import { v } from "convex/values";

export const editTables = {
  messageEditHistory: defineTable({
    messageId: v.id("messages"),
    oldContent: v.string(),
    oldContentRich: v.optional(v.any()),
    editedAt: v.number(),
    editorId: v.id("users"),
  })
    .index("by_message", ["messageId"]) 
    .index("by_editor", ["editorId"]),
} as const;
