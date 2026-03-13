import { defineTable } from "convex/server";
import { v } from "convex/values";

export const messageTables = {
  messages: defineTable({
    content: v.string(),
    contentRich: v.optional(v.any()),
    chatId: v.id("chats"),
    senderId: v.optional(v.id("users")),
    sentAt: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    deletedByName: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
    threadId: v.optional(v.id("messages")),
    rootThreadId: v.optional(v.id("messages")),
    attachments: v.optional(v.array(v.object({
      type: v.string(),
      fileName: v.string(),
      fileUrl: v.string(),
      mimeType: v.string(),
      size: v.number(),
      fileId: v.optional(v.id("files")),
    }))),
    encryptionMetadata: v.optional(v.object({
      ciphertexts: v.array(v.object({
        deviceId: v.string(),
        ciphertext: v.string(),
        type: v.number(),
      })),
      senderDeviceId: v.string(),
    })),
    isPinned: v.optional(v.boolean()),
    pinnedBy: v.optional(v.id("users")),
    pinnedAt: v.optional(v.number()),
    hasTask: v.optional(v.boolean()),
    hasThread: v.optional(v.boolean()),
  })
    .index("by_chat_and_time", ["chatId", "sentAt"]) 
    .index("by_reply", ["replyToId"]) 
    .index("by_root_thread", ["rootThreadId"]),
} as const;
