import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notesTables = {
  notes: defineTable({
    userId: v.string(), // Clerk DB user ID
    title: v.string(),
    content: v.string(), // HTML/Markdown string
    createdAt: v.number(),
    updatedAt: v.number(),
    isPinned: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  }).index("by_userId", ["userId"]),
};
