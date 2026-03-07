import { defineTable } from "convex/server";
import { v } from "convex/values";

export const communityAnnouncementTables = {
  announcementPosts: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]) 
    .index("by_user", ["userId"]),
} as const;
