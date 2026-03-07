import { defineTable } from "convex/server";
import { v } from "convex/values";

// Bi-directional friend relationship records
// One document per direction (A->B and B->A)
export const userFriendTables = {
  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    // friend state
    status: v.union(
      v.literal("active"),
      v.literal("blocked"),
      v.literal("removed")
    ),
    isFavorite: v.optional(v.boolean()),
    isMuted: v.optional(v.boolean()),
    // bookkeeping
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]) // list all friends for a user
    .index("by_user_and_friend", ["userId", "friendId"]), // lookup specific pair
} as const;
