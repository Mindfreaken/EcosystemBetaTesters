import { v } from "convex/values";
import { query } from "../../../_generated/server";

// Get friend requests
export const getFriendRequests = query({
  args: {
    userId: v.string(),
    type: v.union(v.literal("sent"), v.literal("received")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    )),
  },
  returns: v.array(
    v.object({
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
      sender: v.object({
        _id: v.id("users"),
        username: v.string(),
        displayName: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    // Prefer Clerk identity if available; fall back to provided string (treated as Clerk ID)
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject ?? args.userId;

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkId))
      .first();

    if (!currentUser) {
      console.warn("getFriendRequests: Current user not found for Clerk ID:", clerkId);
      return [];
    }
    const convexUserIdOfCurrentUser = currentUser._id;

    const fieldToFilterBy = args.type === "sent" ? "senderId" : "receiverId";
    const indexName = args.type === "sent" ? "by_senderId" : "by_receiverId";
    
    const rawRequests = await ctx.db
      .query("friendRequests")
      .withIndex(indexName as "by_senderId" | "by_receiverId", (q) => q.eq(fieldToFilterBy, convexUserIdOfCurrentUser))
      .filter((q) => args.status ? q.eq(q.field("status"), args.status) : true)
      .collect();

    const requestsWithSenderDetails = await Promise.all(
      rawRequests.map(async (request) => {
        const senderUser = await ctx.db.get(request.senderId);
        if (!senderUser) {
          console.error(`Sender user not found for friend request: ${request._id}, senderId: ${request.senderId}`);
          return {
            ...request,
            sender: {
              _id: request.senderId,
              username: "Unknown User",
              displayName: "Unknown User",
              avatarUrl: undefined,
            },
          } as any;
        }
        return {
          ...request,
          sender: {
            _id: senderUser._id,
            username: senderUser.username || "DefaultUsername",
            displayName: senderUser.displayName || "Default Display Name",
            avatarUrl: senderUser.avatarUrl,
          },
        } as any;
      })
    );
    
    return requestsWithSenderDetails as any;
  },
});
