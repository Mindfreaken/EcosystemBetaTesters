import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

// Delete DM chat and messages between two users
export const deleteDmChatAndMessages = internalMutation({
  args: {
    userId: v.id("users"),
    blockedUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find direct message chat between these two users
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    // Filter chats that have exactly these two participants
    const dmChats = chats.filter((chat) => {
      const participants = chat.participants;
      return (
        participants.length === 2 &&
        participants.some((id) => id.toString() === args.userId.toString()) &&
        participants.some((id) => id.toString() === args.blockedUserId.toString())
      );
    });

    // Delete messages and chat for each found DM
    for (const chat of dmChats) {
      // Get all messages in this chat
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_and_time", (q) => q.eq("chatId", chat._id))
        .collect();

      // Delete all messages
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      // Delete the chat
      await ctx.db.delete(chat._id);
    }

    return null;
  },
});

// Clean up old DM chats between non-friends
export const cleanupOldDmChats = internalMutation({
  args: {
    olderThanDays: v.optional(v.number()),
  },
  returns: v.object({
    chatsDeleted: v.number(),
    messagesDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const olderThanDays = args.olderThanDays || 30; // Default to 30 days
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    let chatsDeleted = 0;
    let messagesDeleted = 0;

    // Get all DM chats
    const dmChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    for (const chat of dmChats) {
      // Skip recent chats
      if (chat.lastActivityAt && chat.lastActivityAt > cutoffTime) {
        continue;
      }

      // For DMs, check if the participants are still friends
      if (chat.participants.length === 2) {
        const [userOneId, userTwoId] = chat.participants;

        // Check if either user has the other as a friend with "active" status
        const userOneToUserTwoFriendship = await ctx.db
          .query("friends")
          .withIndex("by_user_and_friend", (q) =>
            q.eq("userId", userOneId).eq("friendId", userTwoId)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        const userTwoToUserOneFriendship = await ctx.db
          .query("friends")
          .withIndex("by_user_and_friend", (q) =>
            q.eq("userId", userTwoId).eq("friendId", userOneId)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        // If neither user has the other as an active friend, delete the chat and messages
        if (!userOneToUserTwoFriendship && !userTwoToUserOneFriendship) {
          // Get all messages in this chat
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_and_time", (q) => q.eq("chatId", chat._id))
            .collect();

          // Delete all messages
          for (const message of messages) {
            await ctx.db.delete(message._id);
            messagesDeleted++;
          }

          // Delete the chat
          await ctx.db.delete(chat._id);
          chatsDeleted++;
        }
      }
    }

    return {
      chatsDeleted,
      messagesDeleted,
    };
  },
});
