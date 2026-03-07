import { v } from "convex/values";
import { mutation } from "../../../_generated/server";

const friendRequestReturnType = v.object({
  _id: v.id("friendRequests"),
  _creationTime: v.number(),
  senderId: v.id("users"),
  receiverId: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  friendCodeUsed: v.optional(v.id("friendCodes")),
  createdAt: v.number(),
});

// Use a friend code to send a friend request
export const useFriendCode = mutation({
  args: { code: v.string() },
  returns: v.union(v.null(), friendRequestReturnType),
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated. Please log in.");

    const clerkUserId = identity.subject;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!currentUser) throw new Error("Current user not found in database.");

    const friendCodeDoc = await ctx.db
      .query("friendCodes")
      .withIndex("by_active_code", (q) => q.eq("code", code).eq("isActive", true))
      .unique();
    if (!friendCodeDoc) throw new Error("Invalid or expired friend code.");

    if (friendCodeDoc.userId === currentUser._id) {
      throw new Error("You cannot use your own friend code.");
    }

    // Check if already friends or have pending request (sender/receiver can be either way)
    const existingRequestOrFriendship = await ctx.db
      .query("friendRequests")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), currentUser._id),
            q.eq(q.field("receiverId"), friendCodeDoc.userId)
          ),
          q.and(
            q.eq(q.field("senderId"), friendCodeDoc.userId),
            q.eq(q.field("receiverId"), currentUser._id)
          )
        )
      )
      .first();

    if (existingRequestOrFriendship) {
        if (existingRequestOrFriendship.status === "pending") {
            throw new Error("A friend request already exists.");
        } else if (existingRequestOrFriendship.status === "accepted") {
            throw new Error("You are already friends or a request was previously accepted.");
        }
    }
    
    // Explicitly check friends table too
    const areAlreadyFriends = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => q.eq("userId", currentUser._id).eq("friendId", friendCodeDoc.userId))
        .first();

    if (areAlreadyFriends) {
        throw new Error("You are already friends with this user.");
    }

    const friendRequestId = await ctx.db.insert("friendRequests", {
      senderId: currentUser._id,
      receiverId: friendCodeDoc.userId,
      status: "pending",
      friendCodeUsed: friendCodeDoc._id,
      createdAt: Date.now(),
    });

    return await ctx.db.get(friendRequestId);
  },
});
