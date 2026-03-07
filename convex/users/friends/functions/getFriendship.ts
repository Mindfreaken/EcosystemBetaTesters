import { v } from "convex/values";
import { query } from "../../../_generated/server";

// Get friendship record between two users
export const getFriendship = query({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("friends"),
      _creationTime: v.number(),
      userId: v.id("users"),
      friendId: v.id("users"),
      isFavorite: v.optional(v.boolean()),
      isMuted: v.optional(v.boolean()),
      status: v.union(
        v.literal("active"),
        v.literal("blocked"),
        v.literal("removed")
      ),
      createdAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", args.userId).eq("friendId", args.friendId)
      )
      .first();

    return friendship;
  },
});
