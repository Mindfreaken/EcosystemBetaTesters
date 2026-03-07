import { mutation, query } from "../../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../../_generated/dataModel";
import { User } from "../../../../users/profiles/types";


export const getFollowStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get the current user's ID from users table (via Clerk ID)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkUserId", identity.subject))
      .first();
    if (!currentUser) return null;

    // Check if current user is following the target user
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => 
        q.eq("followerId", currentUser._id)
         .eq("followingId", args.userId)
      )
      .first();

    return follow !== null;
  },
});