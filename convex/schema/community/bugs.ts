import { defineTable } from "convex/server";
import { v } from "convex/values";

// Community: bug tracker tables
export const communityBugTables = {
  bugs: defineTable({
    title: v.string(),
    description: v.string(),
    topic: v.string(),
    reporterId: v.optional(v.id("users")),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    tags: v.optional(v.array(v.string())),
    maintainerNote: v.optional(v.string()),
    upvoters: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_topic", ["topic"]) 
    .index("by_status", ["status"]) 
    .index("by_severity", ["severity"]) 
    .index("by_reporter", ["reporterId"]) 
    .index("by_createdAt", ["createdAt"]),

  bugComments: defineTable({
    bugId: v.id("bugs"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_bug", ["bugId"]) 
    .index("by_author", ["authorId"]),
} as const;
