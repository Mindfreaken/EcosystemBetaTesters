import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { api, internal } from "../../../_generated/api";

// Accept/Reject friend request
export const respondToFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Friend request not found");
    }

    if (!request.senderId || !request.receiverId) {
        throw new Error("Invalid friend request data: missing sender or receiver ID.");
    }

    await ctx.db.patch(args.requestId, {
      status: args.response,
    });

    if (args.response === "accepted") {
      const now = Date.now();
      
      // Check for existing removed friendships to reactivate
      const senderToReceiverFriendship = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => 
          q.eq("userId", request.senderId).eq("friendId", request.receiverId)
        )
        .filter(q => q.eq(q.field("status"), "removed"))
        .first();
      
      const receiverToSenderFriendship = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => 
          q.eq("userId", request.receiverId).eq("friendId", request.senderId)
        )
        .filter(q => q.eq(q.field("status"), "removed"))
        .first();
      
      // Reactivate or create sender to receiver friendship
      if (senderToReceiverFriendship) {
        await ctx.db.patch(senderToReceiverFriendship._id, {
          status: "active",
          isMuted: false,
          createdAt: now,
        });
      } else {
        // Create friendship for sender
        await ctx.db.insert("friends", {
          userId: request.senderId,
          friendId: request.receiverId,
          status: "active",
          isMuted: false,
          isFavorite: false,
          createdAt: now,
        });
      }
      
      // Reactivate or create receiver to sender friendship
      if (receiverToSenderFriendship) {
        await ctx.db.patch(receiverToSenderFriendship._id, {
          status: "active",
          isMuted: false,
          createdAt: now,
        });
      } else {
        // Create friendship for receiver
        await ctx.db.insert("friends", {
          userId: request.receiverId,
          friendId: request.senderId,
          status: "active",
          isMuted: false,
          isFavorite: false,
          createdAt: now,
        });
      }

      // Check for existing follows to recreate if needed
      const senderFollowsReceiver = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", q => 
          q.eq("followerId", request.senderId).eq("followingId", request.receiverId)
        )
        .first();
      
      const receiverFollowsSender = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", q => 
          q.eq("followerId", request.receiverId).eq("followingId", request.senderId)
        )
        .first();
      
      // Create follow records if they don't exist
      if (!senderFollowsReceiver) {
        await ctx.db.insert("follows", {
          followerId: request.senderId,
          followingId: request.receiverId,
          createdAt: now,
        });
      }
      
      if (!receiverFollowsSender) {
        await ctx.db.insert("follows", {
          followerId: request.receiverId,
          followingId: request.senderId,
          createdAt: now,
        });
      }

      // Add snapshot for both users
      await ctx.runMutation(api.users.profiles.snapshots.addSnapshot, {
        userId: request.receiverId,
        snapshottingUserId: request.senderId,
      });
      await ctx.runMutation(api.users.profiles.snapshots.addSnapshot, {
        userId: request.senderId,
        snapshottingUserId: request.receiverId,
      });

      // Create activities for both users
      const [senderUser, receiverUser] = await Promise.all([
        ctx.db.get(request.senderId),
        ctx.db.get(request.receiverId),
      ]);
      const senderName = senderUser?.displayName || senderUser?.username || "Someone";
      const receiverName = receiverUser?.displayName || receiverUser?.username || "Someone";

      await ctx.db.insert("activities", {
        userId: request.senderId,
        type: "friend",
        title: `Became friends with ${receiverName}`,
        description: undefined,
        timestamp: now,
        imageUrl: undefined,
        content: undefined,
        targetType: "user",
        targetName: receiverName,
      });

      await ctx.db.insert("activities", {
        userId: request.receiverId,
        type: "friend",
        title: `Became friends with ${senderName}`,
        description: undefined,
        timestamp: now,
        imageUrl: undefined,
        content: undefined,
        targetType: "user",
        targetName: senderName,
      });
    } else if (args.response === "rejected") {
      // If request is rejected, delete any existing DM chats and messages
      await ctx.runMutation(internal.chat.functions.dm.deleteDmChatAndMessages, {
        userId: request.receiverId,
        blockedUserId: request.senderId
      });
    }
    return null;
  },
});
