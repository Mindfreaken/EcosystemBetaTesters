import { defineTable } from "convex/server";
import { v } from "convex/values";

// Link table: associates files to chat entities (chat/message) without bloating the core files table
export const attachmentTables = {
  chatAttachments: defineTable({
    fileId: v.id("files"),
    chatId: v.id("chats"),
    messageId: v.optional(v.id("messages")),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_chat", ["chatId"]) 
    .index("by_message", ["messageId"]) 
    .index("by_file", ["fileId"]) 
    .index("by_uploadedBy", ["uploadedBy"]),
} as const;
