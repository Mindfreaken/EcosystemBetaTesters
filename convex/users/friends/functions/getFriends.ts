import { v } from "convex/values";
import { query } from "../../../_generated/server";

// Get friend list with filters
export const getFriends = query({
  args: {
    clerkUserId: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("blocked"),
      v.literal("removed")
    )),
    isFavorite: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("friends"),
      _creationTime: v.number(),
      userId: v.id("users"),
      friendId: v.id("users"),
      isFavorite: v.optional(v.boolean()),
      isMuted: v.optional(v.boolean()),
      isBanned: v.optional(v.boolean()),
      status: v.union(
        v.literal("active"),
        v.literal("blocked"),
        v.literal("removed")
      ),
      createdAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    // Treat provided string as Clerk ID during migration
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      console.warn("getFriends: User not found for Clerk ID:", args.clerkUserId);
      return [];
    }
    const convexUserId = user._id;

    let queryBuilder = ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", convexUserId!));

    let friends = await queryBuilder.collect();

    if (args.status) {
      friends = friends.filter((friend) => friend.status === args.status);
    }

    if (args.isFavorite !== undefined) {
      friends = friends.filter((friend) => friend.isFavorite === args.isFavorite);
    }
    
    return friends;
  },
});
