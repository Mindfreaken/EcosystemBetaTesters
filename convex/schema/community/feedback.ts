import { defineTable } from "convex/server";
import { v } from "convex/values";

export const communityFeedbackTables = {
  feedback: defineTable({
    topic: v.string(),
    overall: v.number(),
    comments: v.optional(v.string()),
    answers: v.optional(v.any()),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("acknowledged"),
      v.literal("needs_info"),
      v.literal("resolved"),
      v.literal("closed"),
    )),
    maintainerNote: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    clerkUserId: v.optional(v.string()),
    votes: v.number(),
    voters: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_topic", ["topic"]) // filter
    .index("by_user", ["userId"]) // moderation/user page
    .index("by_createdAt", ["createdAt"]), // recent
  feedbackComments: defineTable({
    parentId: v.id("feedback"),
    authorId: v.optional(v.id("users")),
    clerkUserId: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_parent", ["parentId"]),
} as const;
