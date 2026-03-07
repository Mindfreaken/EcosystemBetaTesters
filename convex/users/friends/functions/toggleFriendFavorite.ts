import { v } from "convex/values";
import { mutation } from "../../../_generated/server";

// Toggle friend favorite status
export const toggleFriendFavorite = mutation({
  args: {
    friendshipId: v.id("friends"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    await ctx.db.patch(args.friendshipId, {
      isFavorite: !friendship.isFavorite,
    });
    return null;
  },
});
