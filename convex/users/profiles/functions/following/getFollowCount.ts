import { mutation, query } from "../../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../../_generated/dataModel";
import { User } from "../../../../users/profiles/types";

export const getFollowingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return following.length;
  },
});