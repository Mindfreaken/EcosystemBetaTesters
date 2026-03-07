import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";
import { isUserAdminOrCreator } from "../lib/permissions";

const chatDetailsReturnType = v.object({
  _id: v.id("chats"),
  _creationTime: v.number(),
  name: v.optional(v.string()),
  groupName: v.optional(v.string()),
  groupAvatarUrl: v.optional(v.string()),
  description: v.optional(v.string()),
  isGroup: v.boolean(),
  participants: v.array(v.id("users")),
  createdBy: v.id("users"),
  admins: v.optional(v.array(v.id("users"))),
  blockedFromRejoin: v.optional(v.array(v.id("users"))),
  createdAt: v.optional(v.number()),
  lastActivityAt: v.optional(v.number()),
  status: v.optional(v.union(v.literal("pending_first_message"), v.literal("active"))),
  lastThreadActivity: v.optional(v.object({ threadId: v.id("messages"), timestamp: v.number() })),
});

const userChatListItem = v.object({
  _id: v.id("chats"),
  name: v.string(),
  isGroup: v.boolean(),
  avatarUrl: v.optional(v.string()),
  participants: v.array(v.id("users")),
  createdBy: v.id("users"),
  lastActivityAt: v.optional(v.number()),
  status: v.optional(v.union(v.literal("pending_first_message"), v.literal("active"))),
  _creationTime: v.number(),
  admins: v.optional(v.array(v.id("users"))),
  description: v.optional(v.string()),
});

export const getUserChats = query({
  args: { userId: v.id("users") },
  returns: v.array(userChatListItem),
  handler: async (ctx, args) => {
    const allChats = await ctx.db.query("chats").collect();
    const userParticipatedChats = allChats.filter((chat: Doc<"chats">) => chat.participants.includes(args.userId));

    const processedChats: any[] = [];
    for (const chat of userParticipatedChats) {
      if (chat.status === "pending_first_message" && chat.createdBy !== args.userId) continue;

      if (!chat.isGroup && chat.participants.length === 2) {
        const otherParticipantId = chat.participants.find((id) => id !== args.userId);
        if (otherParticipantId) {
          const userIsBlockedByOther = await ctx.db
            .query("friends")
            .withIndex("by_user_and_friend", (q: any) => q.eq("userId", otherParticipantId).eq("friendId", args.userId))
            .filter((q: any) => q.eq(q.field("status"), "blocked"))
            .first();

          const currentUserHasBlockedOther = await ctx.db
            .query("friends")
            .withIndex("by_user_and_friend", (q: any) => q.eq("userId", args.userId).eq("friendId", otherParticipantId))
            .filter((q: any) => q.eq(q.field("status"), "blocked"))
            .first();

          if (userIsBlockedByOther || currentUserHasBlockedOther) continue;
        }
      }

      let resolvedName: string;
      let resolvedAvatarUrl: string | undefined = undefined;

      if (chat.isGroup) {
        resolvedName = chat.name || chat.groupName || "Group Chat";
        resolvedAvatarUrl = chat.groupAvatarUrl;
      } else {
        const otherParticipantId = chat.participants.find((id) => id !== args.userId);
        if (otherParticipantId) {
          const otherUser = await ctx.db.get(otherParticipantId);
          resolvedName = (otherUser?.displayName as string) || (otherUser?.username as string) || "Unknown User";
          resolvedAvatarUrl = otherUser?.avatarUrl as string | undefined;
        } else {
          resolvedName = "Direct Message";
        }
      }

      processedChats.push({
        _id: chat._id,
        name: resolvedName,
        isGroup: chat.isGroup,
        avatarUrl: resolvedAvatarUrl,
        participants: chat.participants,
        createdBy: chat.createdBy,
        lastActivityAt: chat.lastActivityAt,
        status: chat.status,
        _creationTime: chat._creationTime,
        admins: chat.admins,
        description: chat.description,
      });
    }

    return processedChats;
  },
});

export const createChat = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isGroup: v.boolean(),
    participants: v.array(v.id("users")),
    createdBy: v.id("users"),
    groupName: v.optional(v.string()),
    groupAvatarUrl: v.optional(v.string()),
  },
  returns: v.id("chats"),
  handler: async (ctx, args) => {
    const participants = [...new Set([...args.participants, args.createdBy])];
    const initialStatus = args.isGroup ? "active" : "pending_first_message";

    const newChatId = await ctx.db.insert("chats", {
      name: args.name,
      description: args.description,
      isGroup: args.isGroup,
      participants,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      groupName: args.isGroup ? args.groupName : undefined,
      groupAvatarUrl: args.isGroup ? args.groupAvatarUrl : undefined,
      status: initialStatus,
    });

    const creator = await ctx.db.get(args.createdBy);
    if (creator) {
      const messageContent = args.isGroup
        ? `${creator.displayName || creator.username || "Someone"} created a group chat. Say hi!`
        : `${creator.displayName || creator.username || "Someone"} created a chat. Say hi!`;

      if (args.isGroup) {
        await ctx.db.insert("messages", {
          chatId: newChatId,
          content: messageContent,
          senderId: undefined,
          sentAt: Date.now(),
          isEdited: false,
          isDeleted: false,
        });
      } else {
        const recipientParticipants = participants.filter((pId) => pId !== args.createdBy);
        for (const recipientId of recipientParticipants) {
          if (initialStatus === "pending_first_message" && participants.includes(recipientId)) {
            await ctx.db.insert("messages", {
              chatId: newChatId,
              content: messageContent,
              senderId: undefined,
              sentAt: Date.now(),
              isEdited: false,
              isDeleted: false,
            });
          }
        }
      }
    }

    if (!args.isGroup && initialStatus === "pending_first_message") {
      await ctx.db.patch(newChatId, { status: "active" });
    }

    return newChatId;
  },
});

export const updateChat = mutation({
  args: {
    chatId: v.id("chats"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    groupName: v.optional(v.string()),
    groupAvatarUrl: v.optional(v.string()),
    updatedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.participants.includes(args.updatedBy)) throw new Error("Unauthorized to update chat");

    const updates: Partial<Doc<"chats">> = { lastActivityAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.groupName !== undefined && chat.isGroup) updates.groupName = args.groupName;
    if (args.groupAvatarUrl !== undefined && chat.isGroup) updates.groupAvatarUrl = args.groupAvatarUrl;
    await ctx.db.patch(args.chatId, updates);
    return null;
  },
});

export const addChatParticipant = mutation({
  args: {
    chatId: v.id("chats"),
    participantId: v.id("users"),
    addedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.participants.includes(args.addedBy)) throw new Error("Unauthorized to add participants");
    if (chat.participants.includes(args.participantId)) return null;

    const updatedParticipants = [...chat.participants, args.participantId];
    await ctx.db.patch(args.chatId, { participants: updatedParticipants, lastActivityAt: Date.now() });
    return null;
  },
});

export const removeChatParticipant = mutation({
  args: {
    chatId: v.id("chats"),
    participantId: v.id("users"),
    removedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const isSelf = args.participantId === args.removedBy;
    const isCreator = chat.createdBy === args.removedBy;

    if (!isSelf && !isCreator && chat.isGroup) throw new Error("Unauthorized to remove participant from group chat");
    if (!isSelf && !chat.isGroup) throw new Error("Unauthorized to remove participant from direct chat");

    const updatedParticipants = chat.participants.filter((id) => id !== args.participantId);
    await ctx.db.patch(args.chatId, { participants: updatedParticipants, lastActivityAt: Date.now() });
    return null;
  },
});

export const createOrGetChat = mutation({
  args: { participantIds: v.array(v.id("users")), creatorId: v.id("users") },
  returns: v.id("chats"),
  handler: async (ctx, args) => {
    const uniqueParticipantIds = [...new Set([...args.participantIds, args.creatorId])];
    if (uniqueParticipantIds.length < 2) throw new Error("At least two unique participants are required to create a chat");

    if (uniqueParticipantIds.length === 2) {
      const userOneToUserTwoBlock = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", uniqueParticipantIds[0]).eq("friendId", uniqueParticipantIds[1]))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      const userTwoToUserOneBlock = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", uniqueParticipantIds[1]).eq("friendId", uniqueParticipantIds[0]))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      if (userOneToUserTwoBlock || userTwoToUserOneBlock) throw new Error("Cannot create or access a chat when one user has blocked the other");

      const existingChats = await ctx.db.query("chats").filter((q: any) => q.eq(q.field("isGroup"), false)).collect();
      const existingDM = existingChats.find((chat: Doc<"chats">) => {
        const chatParticipants = new Set(chat.participants);
        return chatParticipants.size === 2 && uniqueParticipantIds.every((id) => chatParticipants.has(id));
      });
      if (existingDM) return existingDM._id;
    }

    const isGroup = uniqueParticipantIds.length > 2;
    const initialStatus = isGroup ? "active" : "pending_first_message";

    const newChatId = await ctx.db.insert("chats", {
      participants: uniqueParticipantIds,
      isGroup,
      createdBy: args.creatorId,
      status: initialStatus,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      name: isGroup ? `Group Chat (${uniqueParticipantIds.length})` : undefined,
      groupName: isGroup ? `Group Chat (${uniqueParticipantIds.length})` : undefined,
    });

    const creator = await ctx.db.get(args.creatorId);
    if (creator) {
      const messageContent = isGroup
        ? `${creator.displayName || creator.username || "Someone"} created a group chat. Say hi!`
        : `${creator.displayName || creator.username || "Someone"} created a chat. Say hi!`;
      const recipientParticipants = uniqueParticipantIds.filter((pId) => pId !== args.creatorId);
      if (isGroup) {
        // For group chats, insert a single system welcome message (not per recipient)
        await ctx.db.insert("messages", {
          chatId: newChatId,
          content: messageContent,
          senderId: undefined,
          sentAt: Date.now(),
          isEdited: false,
          isDeleted: false,
        });
      } else {
        // For DMs, insert the initial system message once for the single recipient
        for (const recipientId of recipientParticipants) {
          if (initialStatus === "pending_first_message" && uniqueParticipantIds.includes(recipientId)) {
            await ctx.db.insert("messages", {
              chatId: newChatId,
              content: messageContent,
              senderId: undefined,
              sentAt: Date.now(),
              isEdited: false,
              isDeleted: false,
            });
          }
        }
      }
    }

    if (!isGroup && initialStatus === "pending_first_message") {
      await ctx.db.patch(newChatId, { status: "active" });
    }

    return newChatId;
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    contentRich: v.optional(v.any()),
    senderId: v.id("users"),
    replyToId: v.optional(v.id("messages")),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.string(),
          fileName: v.string(),
          fileUrl: v.string(),
          mimeType: v.string(),
          size: v.number(),
          fileId: v.optional(v.id("files")),
        })
      )
    ),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.participants.includes(args.senderId)) throw new Error("Sender is not a participant in this chat");

    if (!chat.isGroup && chat.participants.length === 2) {
      const otherParticipantId = chat.participants.find((id: Id<"users">) => id !== args.senderId);
      if (!otherParticipantId) throw new Error("Invalid chat participants");

      const senderIsBlocked = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", otherParticipantId).eq("friendId", args.senderId))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      const senderHasBlocked = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", args.senderId).eq("friendId", otherParticipantId))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      if (senderIsBlocked || senderHasBlocked) throw new Error("Cannot send messages when blocking is active");
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      contentRich: args.contentRich,
      senderId: args.senderId,
      sentAt: Date.now(),
      replyToId: args.replyToId,
      attachments: args.attachments,
      isEdited: false,
      isDeleted: false,
    });

    await ctx.db.patch(args.chatId, { lastActivityAt: Date.now() });
    return messageId;
  },
});

export const getChat = query({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  returns: v.union(chatDetailsReturnType, v.null()),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    if (!chat.participants.includes(args.userId)) return null;

    if (!chat.isGroup && chat.participants.length === 2) {
      const otherParticipantId = chat.participants.find((id) => id !== args.userId);
      if (!otherParticipantId) return null;

      const userIsBlocked = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", otherParticipantId).eq("friendId", args.userId))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      const userHasBlocked = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", (q: any) => q.eq("userId", args.userId).eq("friendId", otherParticipantId))
        .filter((q: any) => q.eq(q.field("status"), "blocked"))
        .first();
      if (userIsBlocked || userHasBlocked) return null;
    }

    return chat as any;
  },
});

export const getChatDetails = query({
  args: { chatId: v.id("chats") },
  returns: v.union(chatDetailsReturnType, v.null()),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    return {
      _id: chat._id,
      _creationTime: chat._creationTime,
      name: chat.name,
      groupName: chat.groupName,
      groupAvatarUrl: chat.groupAvatarUrl,
      description: chat.description,
      isGroup: chat.isGroup,
      participants: chat.participants,
      createdBy: chat.createdBy,
      admins: chat.admins,
      blockedFromRejoin: chat.blockedFromRejoin,
      createdAt: chat.createdAt,
      lastActivityAt: chat.lastActivityAt,
      status: chat.status,
      lastThreadActivity: chat.lastThreadActivity,
    } as any;
  },
});

export const updateChatName = mutation({
  args: { chatId: v.id("chats"), newName: v.string(), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Cannot set name for non-group chats via this function.");

    const ok = await isUserAdminOrCreator(ctx, args.chatId, args.currentUserId);
    if (!ok) throw new Error("Unauthorized: Only admins or creator can change group name.");

    await ctx.db.patch(args.chatId, { name: args.newName, lastActivityAt: Date.now() });
    return null;
  },
});

export const updateChatAvatar = mutation({
  args: { chatId: v.id("chats"), newAvatarUrl: v.string(), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Cannot set avatar for non-group chats via this function.");

    const ok = await isUserAdminOrCreator(ctx, args.chatId, args.currentUserId);
    if (!ok) throw new Error("Unauthorized: Only admins or creator can change group avatar.");

    await ctx.db.patch(args.chatId, { groupAvatarUrl: args.newAvatarUrl, lastActivityAt: Date.now() });
    return null;
  },
});

export const addAdmin = mutation({
  args: { chatId: v.id("chats"), userIdToAddAsAdmin: v.id("users"), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Admins can only be added to group chats.");
    if (chat.createdBy !== args.currentUserId) throw new Error("Unauthorized: Only the group creator can add admins.");
    if (!chat.participants.includes(args.userIdToAddAsAdmin)) throw new Error("User to be made admin must be a participant of the chat.");
    if (chat.admins?.includes(args.userIdToAddAsAdmin) || chat.createdBy === args.userIdToAddAsAdmin) return null;

    const updatedAdmins = [...(chat.admins || []), args.userIdToAddAsAdmin];
    await ctx.db.patch(args.chatId, { admins: updatedAdmins, lastActivityAt: Date.now() });
    return null;
  },
});

export const removeAdmin = mutation({
  args: { chatId: v.id("chats"), userIdToRemoveAsAdmin: v.id("users"), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Admins can only be removed from group chats.");
    if (chat.createdBy !== args.currentUserId) throw new Error("Unauthorized: Only the group creator can remove admins.");
    if (args.userIdToRemoveAsAdmin === chat.createdBy) throw new Error("Cannot remove the group creator from admins.");

    const updatedAdmins = chat.admins?.filter((adminId: Id<"users">) => adminId !== args.userIdToRemoveAsAdmin) || [];
    await ctx.db.patch(args.chatId, { admins: updatedAdmins, lastActivityAt: Date.now() });
    return null;
  },
});

export const kickUserFromChat = mutation({
  args: { chatId: v.id("chats"), userIdToKick: v.id("users"), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Kicking users is only applicable to group chats.");

    const ok = await isUserAdminOrCreator(ctx, args.chatId, args.currentUserId);
    if (!ok) throw new Error("Unauthorized: Only admins or the creator can kick users.");
    if (args.userIdToKick === chat.createdBy) throw new Error("Cannot kick the group creator.");
    if (!chat.participants.includes(args.userIdToKick)) return null;

    const updatedParticipants = chat.participants.filter((pId: Id<"users">) => pId !== args.userIdToKick);
    const updatedAdmins = chat.admins?.filter((adminId: Id<"users">) => adminId !== args.userIdToKick) || [];

    await ctx.db.patch(args.chatId, { participants: updatedParticipants, admins: updatedAdmins, lastActivityAt: Date.now() });
    return null;
  },
});

export const addUserToChat = mutation({
  args: { chatId: v.id("chats"), userIdToAdd: v.id("users"), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Adding users this way is only for group chats.");
    if (!chat.participants.includes(args.currentUserId)) throw new Error("Unauthorized: Only existing members can add new users to this group.");
    if (chat.blockedFromRejoin?.includes(args.userIdToAdd)) throw new Error("This user cannot be added back to the group.");
    if (chat.participants.includes(args.userIdToAdd)) return null;

    const updatedParticipants = [...chat.participants, args.userIdToAdd];
    await ctx.db.patch(args.chatId, { participants: updatedParticipants, lastActivityAt: Date.now() });
    return null;
  },
});

export const leaveChat = mutation({
  args: { chatId: v.id("chats"), currentUserId: v.id("users"), preventReAdd: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Leaving chat this way is only for group chats.");
    if (!chat.participants.includes(args.currentUserId)) throw new Error("User is not a participant of this chat.");
    if (chat.createdBy === args.currentUserId) throw new Error("Creator cannot leave the group. Consider deleting the group or transferring ownership.");

    const updatedParticipants = chat.participants.filter((pId: Id<"users">) => pId !== args.currentUserId);
    const updatedAdmins = chat.admins?.filter((adminId: Id<"users">) => adminId !== args.currentUserId) || [];
    let updatedBlockedFromRejoin = chat.blockedFromRejoin || [];
    if (args.preventReAdd) {
      if (!updatedBlockedFromRejoin.includes(args.currentUserId)) {
        updatedBlockedFromRejoin = [...updatedBlockedFromRejoin, args.currentUserId];
      }
    }

    await ctx.db.patch(args.chatId, {
      participants: updatedParticipants,
      admins: updatedAdmins,
      blockedFromRejoin: updatedBlockedFromRejoin,
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

export const getChatMembers = query({
  args: { chatId: v.id("chats") },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      username: v.optional(v.string()),
      displayName: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      isCreator: v.boolean(),
      isAdmin: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return [];

    const members: any[] = [];
    for (const userId of chat.participants) {
      const userDoc = await ctx.db.get(userId);
      if (userDoc) {
        members.push({
          _id: userDoc._id,
          username: userDoc.username,
          displayName: userDoc.displayName,
          avatarUrl: userDoc.avatarUrl,
          isCreator: chat.createdBy === userId,
          isAdmin: chat.admins?.includes(userId) || false,
        });
      }
    }
    return members;
  },
});

export const getPinnedMessages = query({
  args: { chatId: v.id("chats") },
  returns: v.array(
    v.object({ _id: v.id("messages"), content: v.string(), senderName: v.string(), timestamp: v.number() })
  ),
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q: any) => q.eq("chatId", args.chatId))
      .collect();
    const pinnedMsgs = msgs.filter((m: any) => m.isPinned === true);
    const result: Array<{ _id: any; content: string; senderName: string; timestamp: number }> = [];
    for (const m of pinnedMsgs) {
      let senderName = "System";
      if (m.senderId) {
        const user = await ctx.db.get(m.senderId);
        senderName = (user?.displayName as string) || (user?.username as string) || "Unknown";
      }
      const timestamp = m.pinnedAt ?? m.sentAt ?? m._creationTime;
      result.push({ _id: m._id, content: m.content, senderName, timestamp });
    }
    return result;
  },
});

export const getThreadsForChat = query({
  args: { chatId: v.id("chats") },
  returns: v.array(v.any()),
  handler: async (_ctx, _args) => {
    return [];
  },
});

export const getUnreadThreadCount = query({
  args: { chatId: v.id("chats") },
  returns: v.number(),
  handler: async (_ctx, _args) => {
    return 0;
  },
});

export const pinMessage = mutation({
  args: { chatId: v.id("chats"), messageId: v.id("messages") },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    return null;
  },
});

export const unpinMessage = mutation({
  args: { chatId: v.id("chats"), messageId: v.id("messages") },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    return null;
  },
});

export const markThreadRead = mutation({
  args: { chatId: v.id("chats"), threadId: v.id("messages") },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    return null;
  },
});

// Permanently delete a group chat (creator-only). This removes the chat and its messages.
export const deleteChat = mutation({
  args: { chatId: v.id("chats"), currentUserId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.isGroup) throw new Error("Only group chats can be deleted.");
    if (chat.createdBy !== args.currentUserId) throw new Error("Unauthorized: Only the group creator can delete the chat.");

    // Delete all messages in this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q: any) => q.eq("chatId", args.chatId))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
    }

    // Finally, delete the chat
    await ctx.db.delete(args.chatId);
    return null;
  },
});
