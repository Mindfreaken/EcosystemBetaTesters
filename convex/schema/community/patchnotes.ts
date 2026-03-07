import { defineTable } from "convex/server";
import { v } from "convex/values";

// Community: patch notes feedback tables
export const communityPatchNotesTables = {
  patchFeedback: defineTable({
    file: v.string(), // e.g., "2025-08-initial.md"
    userId: v.optional(v.id("users")),
    overall: v.optional(v.number()), // 1-10
    sectionRatings: v.optional(
      v.array(
        v.object({ section: v.string(), rating: v.number() })
      )
    ),
    valuableSections: v.optional(v.array(v.string())),
    comments: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_file", ["file"]) 
    .index("by_user", ["userId"]),
} as const;
