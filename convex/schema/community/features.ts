import { defineTable } from "convex/server";
import { v } from "convex/values";

export const communityFeatureTables = {
  features: defineTable({
    title: v.string(),
    topic: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("planned"), v.literal("in_progress"), v.literal("done"), v.literal("tabled"))),
    maintainerNote: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    clerkUserId: v.optional(v.string()),
    votes: v.number(),
    voters: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_topic", ["topic"]) 
    .index("by_user", ["userId"]) 
    .index("by_createdAt", ["createdAt"]),
  featureComments: defineTable({
    parentId: v.id("features"),
    authorId: v.optional(v.id("users")),
    clerkUserId: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_parent", ["parentId"]),
} as const;
