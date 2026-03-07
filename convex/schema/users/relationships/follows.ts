import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userFollowTables = {
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number()
  })
    .index("by_follower", ["followerId"]) 
    .index("by_following", ["followingId"]) 
    .index("by_follower_following", ["followerId", "followingId"]),
} as const;
