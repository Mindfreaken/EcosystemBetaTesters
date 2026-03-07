import { v } from "convex/values";
import { mutation } from "../../../_generated/server";

// Add friend by friend code
export const addFriendByCode = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const friendCodeDoc = await ctx.db
      .query("friendCodes")
      .withIndex("by_active_code", (q) => q.eq("code", args.code).eq("isActive", true))
      .unique();

    if (!friendCodeDoc) {
      throw new Error("Invalid or expired friend code");
    }

    if (friendCodeDoc.userId === args.userId) {
      throw new Error("Hey silly goose, you can't add yourself as a friend.");
    }

    const existingRequest = await ctx.db
      .query("friendRequests")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), args.userId),
            q.eq(q.field("receiverId"), friendCodeDoc.userId),
            q.eq(q.field("status"), "pending")
          ),
          q.and(
            q.eq(q.field("senderId"), friendCodeDoc.userId),
            q.eq(q.field("receiverId"), args.userId),
            q.eq(q.field("status"), "pending")
          )
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("Friend request already exists or you are already friends.");
    }
    
    const areAlreadyFriends = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => q.eq("userId", args.userId).eq("friendId", friendCodeDoc.userId))
        .filter(q => q.eq(q.field("status"), "active"))
        .first();

    if (areAlreadyFriends) {
        throw new Error("You are already friends with this user.");
    }

    // If a removed friendship exists, we'll update it instead of creating a new one
    const existingRemovedFriendship = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => q.eq("userId", args.userId).eq("friendId", friendCodeDoc.userId))
        .filter(q => q.eq(q.field("status"), "removed"))
        .first();

    const reciprocalRemovedFriendship = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => q.eq("userId", friendCodeDoc.userId).eq("friendId", args.userId))
        .filter(q => q.eq(q.field("status"), "removed"))
        .first();

    await ctx.db.insert("friendRequests", {
      senderId: args.userId,
      receiverId: friendCodeDoc.userId,
      status: "pending",
      friendCodeUsed: friendCodeDoc._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

