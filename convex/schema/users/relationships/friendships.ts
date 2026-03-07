import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userFriendshipTables = {
  friendships: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    since: v.number(),
  })
    .index("by_userA", ["userAId"]) 
    .index("by_userB", ["userBId"]) 
    .index("by_pair", ["userAId", "userBId"]),
} as const;
