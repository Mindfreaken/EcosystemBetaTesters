import { mutation, query } from "../../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../../_generated/dataModel";
import { User } from "../../../../users/profiles/types";



// Unfollow a user
export const unfollowUser = mutation({
  args: { targetUserId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get the current user's ID from users table (via Clerk ID)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkUserId", identity.subject))
      .first() as User | null;
    if (!currentUser) throw new Error("User not found");

    // Get target user if Clerk ID string was provided
    let targetUser: User | null = null;
    if (typeof args.targetUserId === 'string') {
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkUserId", args.targetUserId))
        .first() as User | null;
    } else {
      targetUser = await ctx.db.get(args.targetUserId) as User | null;
    }

    if (!targetUser) throw new Error("Target user not found");

    // Find and delete follow record
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", q => 
        q.eq("followerId", currentUser._id)
         .eq("followingId", targetUser._id)
      )
      .first();

    if (follow) {
      await ctx.db.delete(follow._id);

      // Update social score
      const socialScore = await ctx.db
        .query("socialScores")
        .withIndex("by_user", q => q.eq("userId", targetUser._id))
        .first();

      if (socialScore && socialScore.score > 0) {
        await ctx.db.patch(socialScore._id, {
          score: socialScore.score - 1,
          lastUpdated: Date.now()
        });
      }
    }
  },
});