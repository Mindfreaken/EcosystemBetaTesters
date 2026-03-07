import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chatTables = {
  chats: defineTable({
    name: v.optional(v.string()),
    groupName: v.optional(v.string()),
    groupAvatarUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    isGroup: v.boolean(),
    participants: v.array(v.id("users")),
    createdBy: v.id("users"),
    admins: v.optional(v.array(v.id("users"))),
    blockedFromRejoin: v.optional(v.array(v.id("users"))),
    createdAt: v.optional(v.number()),
    lastActivityAt: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending_first_message"), v.literal("active"))),
    lastThreadActivity: v.optional(v.object({ threadId: v.id("messages"), timestamp: v.number() })),
  })
    .index("by_creator", ["createdBy"]) 
    .index("by_participants", ["participants"]) 
    .index("by_isGroup", ["isGroup"]),
} as const;
