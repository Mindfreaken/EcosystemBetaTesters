// Domain: Files / storage metadata
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const fileTables = {
  files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    chatId: v.optional(v.id("chats")),
    path: v.string(),
    uploadedAt: v.number(),
    urlPattern: v.optional(v.string()),
  })
    .index("by_user", ["uploadedBy"]) 
    .index("by_chat", ["chatId"]) 
    .index("by_path", ["path"]),
} as const;
