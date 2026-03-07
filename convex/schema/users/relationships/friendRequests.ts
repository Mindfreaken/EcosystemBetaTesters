import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userFriendRequestTables = {
  friendRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    friendCodeUsed: v.optional(v.id("friendCodes")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    message: v.optional(v.string()),
  })
    .index("by_senderId", ["senderId"]) 
    .index("by_receiverId", ["receiverId"]) 
    .index("by_sender_receiver", ["senderId", "receiverId"]),
} as const;
