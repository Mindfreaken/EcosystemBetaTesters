import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "../../_generated/dataModel";

// Send a new message
export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    contentRich: v.optional(v.any()),
    senderId: v.id("users"),
    encryptionMetadata: v.optional(v.object({
      ciphertexts: v.array(v.object({
        deviceId: v.string(),
        ciphertext: v.string(),
        type: v.number(),
      })),
      senderDeviceId: v.string(),
    })),
    attachments: v.optional(v.array(v.object({
      type: v.string(),
      fileName: v.string(),
      fileUrl: v.string(),
      mimeType: v.string(),
      size: v.number(),
      fileId: v.optional(v.id("files")),
    }))),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found to send message to.");
    }

    if (chat.status === "pending_first_message") {
      await ctx.db.patch(args.chatId, { status: "active", lastActivityAt: Date.now() });
    } else {
      await ctx.db.patch(args.chatId, { lastActivityAt: Date.now() });
    }

    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      contentRich: args.contentRich,
      senderId: args.senderId,
      sentAt: Date.now(),
      encryptionMetadata: args.encryptionMetadata,
      attachments: args.attachments || [],
    });
  },
});

// Reply to a message (create thread)
export const replyToMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    senderId: v.id("users"),
    parentMessageId: v.id("messages"),
    encryptionMetadata: v.optional(v.object({
      ciphertexts: v.array(v.object({
        deviceId: v.string(),
        ciphertext: v.string(),
        type: v.number(),
      })),
      senderDeviceId: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const parentMessage = await ctx.db.get(args.parentMessageId);
    if (!parentMessage) {
      throw new Error("Parent message not found");
    }

    const rootThreadId = parentMessage.rootThreadId || args.parentMessageId;

    await ctx.db.patch(args.chatId, {
      lastThreadActivity: {
        threadId: rootThreadId,
        timestamp: Date.now(),
      },
    });

    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      senderId: args.senderId,
      threadId: args.parentMessageId,
      rootThreadId,
      encryptionMetadata: args.encryptionMetadata,
    });
  },
});

// Get thread messages
export const getThreadMessages = query({
  args: { rootThreadId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_root_thread", (q) => q.eq("rootThreadId", args.rootThreadId))
      .collect();
  },
});

// Get thread messages with pagination
export const getThreadMessagesPaginated = query({
  args: {
    rootThreadId: v.id("messages"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_root_thread", (q) => q.eq("rootThreadId", args.rootThreadId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
  returns: v.object({
    page: v.array(v.object({
      _creationTime: v.float64(),
      _id: v.id("messages"),
      attachments: v.optional(v.array(v.object({
        type: v.string(),
        fileName: v.string(),
        fileUrl: v.string(),
        mimeType: v.string(),
        size: v.number(),
        fileId: v.optional(v.id("files")),
      }))),
      chatId: v.id("chats"),
      content: v.string(),
      contentRich: v.optional(v.any()),
      isEdited: v.optional(v.boolean()),
      isDeleted: v.optional(v.boolean()),
      deletedAt: v.optional(v.float64()),
      deletedBy: v.optional(v.id("users")),
      deletedByName: v.optional(v.string()),
      encryptionMetadata: v.optional(v.object({
        ciphertexts: v.array(v.object({
          deviceId: v.string(),
          ciphertext: v.string(),
          type: v.number(),
        })),
        senderDeviceId: v.string(),
      })),
      isPinned: v.optional(v.boolean()),
      pinnedBy: v.optional(v.id("users")),
      pinnedAt: v.optional(v.number()),
      lastActivity: v.optional(v.float64()),
      replyCount: v.optional(v.float64()),
      senderId: v.optional(v.id("users")),
      sentAt: v.optional(v.float64()),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
});

// Pin/unpin message
export const toggleMessagePin = mutation({
  args: { messageId: v.id("messages"), userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const isPinned = !message.isPinned;
    await ctx.db.patch(args.messageId, {
      isPinned,
      pinnedBy: isPinned ? args.userId : undefined,
      pinnedAt: isPinned ? Date.now() : undefined,
    });

    return isPinned;
  },
});

// Add/remove reaction
export const toggleReaction = mutation({
  args: { messageId: v.id("messages"), userId: v.id("users"), reaction: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_user_message", (q) => q.eq("userId", args.userId).eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("reaction"), args.reaction))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    const now = Date.now();
    await ctx.db.insert("messageReactions", {
      messageId: args.messageId,
      userId: args.userId,
      reaction: args.reaction,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  },
});

// Create task from message
export const createMessageTask = mutation({
  args: {
    messageId: v.id("messages"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.array(v.id("users")),
    dueDate: v.optional(v.number()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    await ctx.db.patch(args.messageId, { hasTask: true });

    return await ctx.db.insert("messageTasks", {
      messageId: args.messageId,
      title: args.title,
      description: args.description,
      status: "pending",
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("messageTasks"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    interface TaskUpdate {
      status: typeof args.status;
      completedAt?: number;
      completedBy?: typeof args.userId;
    }

    const updates: TaskUpdate = { status: args.status };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
      updates.completedBy = args.userId;
    }

    return await ctx.db.patch(args.taskId, updates);
  },
});

// Mark message as read
export const markMessageRead = mutation({
  args: { messageId: v.id("messages"), userId: v.id("users"), deviceInfo: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const existing = await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_user_and_message", (q) => q.eq("userId", args.userId).eq("messageId", args.messageId))
      .unique();

    if (existing) {
      // Already marked as read; no need to update timestamp repeatedly
      return existing._id;
    }

    return await ctx.db.insert("messageReadReceipts", {
      messageId: args.messageId,
      userId: args.userId,
      readAt: Date.now(),
      deviceInfo: args.deviceInfo,
    });
  },
});

// Get message read status
export const getMessageReadReceipts = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
  },
});

// Get message read receipts with pagination
export const getMessageReadReceiptsPaginated = query({
  args: { messageId: v.id("messages"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get user's recent read messages with pagination
export const getUserRecentReadMessagesPaginated = query({
  args: { userId: v.id("users"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get reactions for a message
export const getMessageReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
  },
});

// Get message reactions with pagination
export const getMessageReactionsPaginated = query({
  args: { messageId: v.id("messages"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get tasks for a message
export const getMessageTasks = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageTasks")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
  },
});

// Get unread message count for a user (optimized version)
export const getUnreadMessageCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allChats = await ctx.db.query("chats").collect();
    const userChats = allChats.filter((chat) => chat.participants.includes(args.userId));
    const chatIds = userChats.map((chat) => chat._id);
    if (chatIds.length === 0) return 0;

    const readReceipts = await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_user_recent", (q) => q.eq("userId", args.userId))
      .collect();

    const readMessageIds = new Set(readReceipts.map((receipt) => receipt.messageId.toString()));

    let unreadCount = 0;
    for (const chatId of chatIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
        .collect();

      for (const message of messages) {
        if (message.senderId?.toString() === args.userId.toString()) continue;
        if (!readMessageIds.has(message._id.toString())) unreadCount++;
      }
    }

    return unreadCount;
  },
});

// Get pinned messages for a chat
export const getPinnedMessages = query({
  args: { chatId: v.id("chats") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      content: v.string(),
      senderId: v.id("users"),
      _creationTime: v.number(),
      isPinned: v.boolean(),
      pinnedBy: v.optional(v.id("users")),
      pinnedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { chatId }) => {
    const pinnedMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
      .filter((q) => q.eq(q.field("isPinned"), true))
      .collect();

    return pinnedMessages.map((message) => ({
      _id: message._id,
      content: message.content,
      senderId: message.senderId as Id<"users">,
      _creationTime: message._creationTime,
      isPinned: message.isPinned || false,
      pinnedBy: message.pinnedBy,
      pinnedAt: message.pinnedAt,
    }));
  },
});

// Get threads for a chat with pagination
export const getThreadsForChat = query({
  args: { chatId: v.id("chats"), paginationOpts: paginationOptsValidator, userId: v.id("users") },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("messages"),
        _creationTime: v.float64(),
        attachments: v.array(v.object({
          type: v.string(),
          fileName: v.string(),
          fileUrl: v.string(),
          mimeType: v.string(),
          size: v.number(),
          fileId: v.optional(v.id("files")),
        })),
        chatId: v.id("chats"),
        encryptionMetadata: v.optional(v.object({
          ciphertexts: v.array(v.object({
            deviceId: v.string(),
            ciphertext: v.string(),
            type: v.number(),
          })),
          senderDeviceId: v.string(),
        })),
        replyCount: v.float64(),
        senderId: v.id("users"),
        sentAt: v.float64(),
        isUnread: v.boolean(),
        contentRich: v.optional(v.any()),
        isEdited: v.optional(v.boolean()),
        isDeleted: v.optional(v.boolean()),
        replyToId: v.optional(v.id("messages")),
        threadId: v.optional(v.id("messages")),
        rootThreadId: v.optional(v.id("messages")),
        isPinned: v.optional(v.boolean()),
        pinnedBy: v.optional(v.id("users")),
        pinnedAt: v.optional(v.float64()),
        hasTask: v.optional(v.boolean()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { chatId, paginationOpts, userId }) => {
    const chatMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
      .collect();

    const readReceipts = await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .collect();

    const messageReadMap = new Map<string, number>();
    for (const receipt of readReceipts) {
      const message = chatMessages.find((msg) => msg._id.toString() === receipt.messageId.toString());
      if (message) messageReadMap.set(receipt.messageId.toString(), receipt.readAt);
    }

    const threadRootIds = new Set<string>();
    for (const message of chatMessages) {
      if (message.threadId) threadRootIds.add(message.threadId.toString());
    }

    if (threadRootIds.size === 0) {
      return { page: [], isDone: true, continueCursor: paginationOpts.cursor || null };
    }

    const threadsWithReplies = chatMessages
      .filter((msg) => threadRootIds.has(msg._id.toString()))
      .map((threadRoot) => {
        const threadMessages = chatMessages.filter(
          (msg) => msg.rootThreadId?.toString() === threadRoot._id.toString() || msg._id.toString() === threadRoot._id.toString()
        );
        const replies = threadMessages.filter((msg) => msg._id.toString() !== threadRoot._id.toString());

        let lastActivity = threadRoot._creationTime;
        for (const reply of replies) if (reply._creationTime > lastActivity) lastActivity = reply._creationTime;

        let isUnread = false;
        for (const message of threadMessages) {
          if (message.senderId?.toString() === userId.toString()) continue;
          const readAt = messageReadMap.get(message._id.toString());
          if (!readAt || readAt < message._creationTime) {
            isUnread = true;
            break;
          }
        }

        const returnedThread: any = {
          _id: threadRoot._id,
          _creationTime: threadRoot._creationTime,
          attachments: threadRoot.attachments || [],
          chatId: threadRoot.chatId,
          content: threadRoot.content,
          encryptionMetadata: threadRoot.encryptionMetadata,
          lastActivity: lastActivity,
          replyCount: replies.length,
          senderId: threadRoot.senderId as Id<"users">,
          sentAt: threadRoot.sentAt,
          isUnread: isUnread,
        };

        if (threadRoot.contentRich !== undefined) returnedThread.contentRich = threadRoot.contentRich;
        if (threadRoot.isEdited !== undefined) returnedThread.isEdited = threadRoot.isEdited;
        if (threadRoot.isDeleted !== undefined) returnedThread.isDeleted = threadRoot.isDeleted;
        if (threadRoot.replyToId !== undefined) returnedThread.replyToId = threadRoot.replyToId;
        if (threadRoot.threadId !== undefined) returnedThread.threadId = threadRoot.threadId;
        if (threadRoot.rootThreadId !== undefined) returnedThread.rootThreadId = threadRoot.rootThreadId;
        if (threadRoot.isPinned !== undefined) returnedThread.isPinned = threadRoot.isPinned;
        if (threadRoot.pinnedBy !== undefined) returnedThread.pinnedBy = threadRoot.pinnedBy;
        if (threadRoot.pinnedAt !== undefined) returnedThread.pinnedAt = threadRoot.pinnedAt;
        if (threadRoot.hasTask !== undefined) returnedThread.hasTask = threadRoot.hasTask;

        return returnedThread;
      });

    const validThreads = threadsWithReplies.filter(Boolean);
    validThreads.sort((a: any, b: any) => {
      if (a.isUnread && !b.isUnread) return -1;
      if (!a.isUnread && b.isUnread) return 1;
      return b.lastActivity - a.lastActivity;
    });

    const startIndex = paginationOpts.cursor ? parseInt(paginationOpts.cursor, 10) : 0;
    const endIndex = Math.min(validThreads.length, startIndex + paginationOpts.numItems);
    const page = validThreads.slice(startIndex, endIndex);

    let continueCursor: string | null = null;
    const isDone = endIndex >= validThreads.length;
    if (!isDone) continueCursor = `${endIndex}`;

    return { page, isDone, continueCursor: continueCursor || paginationOpts.cursor || null };
  },
});

// Get unread thread count for a user in a chat
export const getUnreadThreadCount = query({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, { chatId, userId }) => {
    const chatMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
      .collect();

    const threadRootIds = new Set<Id<"messages">>();
    const threadIdToRootMap = new Map<string, Id<"messages">>();
    for (const message of chatMessages) {
      if (message.threadId) {
        threadRootIds.add(message.threadId);
        if (message.rootThreadId) threadIdToRootMap.set(message.threadId.toString(), message.rootThreadId);
        else threadIdToRootMap.set(message.threadId.toString(), message.threadId);
      }
    }

    if (threadRootIds.size === 0) return 0;

    const readReceipts = await ctx.db
      .query("messageReadReceipts")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .collect();

    const messageReadMap = new Map<string, number>();
    for (const receipt of readReceipts) messageReadMap.set(receipt.messageId.toString(), receipt.readAt);

    let unreadCount = 0;
    for (const threadId of threadRootIds) {
      const threadMessages = await ctx.db
        .query("messages")
        .withIndex("by_root_thread", (q) => q.eq("rootThreadId", threadIdToRootMap.get(threadId.toString()) || threadId))
        .collect();

      if (!threadMessages.some((msg) => msg._id.toString() === threadId.toString())) {
        const rootMessage = await ctx.db.get(threadId);
        if (rootMessage) threadMessages.push(rootMessage);
      }

      const userIsSender = threadMessages.some((msg) => msg.senderId && msg.senderId.toString() === userId.toString());

      let hasUnreadMessages = false;
      if (userIsSender) {
        let latestReadTimestamp = 0;
        let hasUnreadReplies = false;
        for (const msg of threadMessages) {
          const readTime = messageReadMap.get(msg._id.toString());
          if (readTime && readTime > latestReadTimestamp) latestReadTimestamp = readTime;
        }
        for (const msg of threadMessages) {
          if (msg.senderId && msg.senderId.toString() === userId.toString()) continue;
          if (msg._creationTime > latestReadTimestamp) {
            hasUnreadReplies = true;
            break;
          }
        }
        if (hasUnreadReplies) hasUnreadMessages = true;
      } else {
        for (const msg of threadMessages) {
          if (!messageReadMap.has(msg._id.toString())) {
            hasUnreadMessages = true;
            break;
          }
        }
      }

      if (hasUnreadMessages) unreadCount++;
    }

    return unreadCount;
  },
});

// Mark a thread as read by a user
export const markThreadAsRead = mutation({
  args: { threadId: v.id("messages"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { threadId, userId }) => {
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");

    const threadMessages = await ctx.db
      .query("messages")
      .withIndex("by_root_thread", (q) => q.eq("rootThreadId", threadId))
      .collect();

    if (!threadMessages.some((msg) => msg._id === threadId)) {
      threadMessages.push(thread);
    }

    const readAt = Date.now();
    await Promise.all(
      threadMessages.map(async (message) => {
        const existingReceipt = await ctx.db
          .query("messageReadReceipts")
          .withIndex("by_user_and_message", (q) => q.eq("userId", userId).eq("messageId", message._id))
          .first();
        if (existingReceipt) {
          await ctx.db.patch(existingReceipt._id, { readAt });
        } else {
          await ctx.db.insert("messageReadReceipts", { messageId: message._id, userId, readAt, deviceInfo: "thread-view" });
        }
      })
    );

    return null;
  },
});

// Get messages for a chat with pagination
export const getMessagesForChat = query({
  args: { chatId: v.id("chats"), paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("messages"),
        _creationTime: v.number(),
        content: v.string(),
        contentRich: v.optional(v.any()),
        chatId: v.id("chats"),
        senderId: v.optional(v.id("users")),
        sentAt: v.optional(v.number()),
        isEdited: v.optional(v.boolean()),
        isDeleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.number()),
        deletedBy: v.optional(v.id("users")),
        deletedByName: v.optional(v.string()),
        replyToId: v.optional(v.id("messages")),
        threadId: v.optional(v.id("messages")),
        rootThreadId: v.optional(v.id("messages")),
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
        encryptionMetadata: v.optional(v.object({
          ciphertexts: v.array(v.object({
            deviceId: v.string(),
            ciphertext: v.string(),
            type: v.number(),
          })),
          senderDeviceId: v.string(),
        })),
        pinnedBy: v.optional(v.id("users")),
        pinnedAt: v.optional(v.number()),
        hasTask: v.optional(v.boolean()),
        hasThread: v.optional(v.boolean()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.any()),
  }),
  handler: async (ctx, { chatId, paginationOpts }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
      .filter((q) => q.eq(q.field("threadId"), undefined))
      .order("desc")
      .paginate(paginationOpts);
  },
});

// Edit message
export const editMessage = mutation({
  args: { messageId: v.id("messages"), editorId: v.id("users"), newContent: v.string(), newContentRich: v.optional(v.any()) },
  returns: v.object({ _id: v.id("messages"), content: v.string(), contentRich: v.optional(v.any()), isEdited: v.optional(v.boolean()), senderId: v.optional(v.id("users")), chatId: v.id("chats") }),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId?.toString() !== args.editorId.toString()) throw new Error("Unauthorized: Only the sender can edit this message");

    await ctx.db.insert("messageEditHistory", {
      messageId: args.messageId,
      oldContent: message.content,
      oldContentRich: message.contentRich,
      editedAt: Date.now(),
      editorId: args.editorId,
    });

    const updateData: any = { content: args.newContent, isEdited: true };
    if (args.newContentRich !== undefined) {
      updateData.contentRich = args.newContentRich;
    } else if (message.contentRich) {
      updateData.contentRich = [{ type: "paragraph", children: [{ text: args.newContent }] }];
    }

    await ctx.db.patch(args.messageId, updateData);

    const updatedMessage = await ctx.db.get(args.messageId);
    if (!updatedMessage) throw new Error("Failed to retrieve updated message");

    return {
      _id: updatedMessage._id,
      content: updatedMessage.content,
      contentRich: updatedMessage.contentRich,
      isEdited: updatedMessage.isEdited,
      senderId: updatedMessage.senderId,
      chatId: updatedMessage.chatId,
    };
  },
});

// Delete message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages"), userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId?.toString() !== args.userId.toString()) {
      throw new Error("Unauthorized: Only the sender can delete this message");
    }

    const deletedAt = Date.now();
    const deleter = await ctx.db.get(args.userId);

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedAt,
      deletedBy: args.userId,
      deletedByName: deleter?.displayName || deleter?.username || "Unknown",
      content: "This message was deleted.",
      contentRich: [{ type: "paragraph", children: [{ text: "This message was deleted." }] }],
    });

    return true;
  },
});

// Get the latest message across all chats a user is in (used for global notifications)
export const getLatestMessageForUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("messages"),
      senderId: v.optional(v.id("users")),
      sentAt: v.optional(v.number()),
      _creationTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const allChats = await ctx.db.query("chats").collect();
    const userChatIds = allChats
      .filter((chat) => chat.participants.includes(args.userId))
      .map((chat) => chat._id);

    if (userChatIds.length === 0) return null;

    // This is not extremely efficient but safe for small-to-medium datasets.
    // For large scale, we'd need a cross-chat index or a user-specific message feed.
    let latestMessage: any = null;

    for (const chatId of userChatIds) {
      const msg = await ctx.db
        .query("messages")
        .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
        .order("desc")
        .first();

      if (msg) {
        if (!latestMessage || msg._creationTime > latestMessage._creationTime) {
          latestMessage = msg;
        }
      }
    }

    if (!latestMessage) return null;

    return {
      _id: latestMessage._id,
      senderId: latestMessage.senderId,
      sentAt: latestMessage.sentAt,
      _creationTime: latestMessage._creationTime,
    };
  },
});

// Get messages with their reactions joined
export const getMessagesWithReactions = query({
  args: { chatId: v.id("chats"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { chatId, paginationOpts }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_time", (q) => q.eq("chatId", chatId))
      .filter((q) => q.eq(q.field("threadId"), undefined))
      .order("desc")
      .paginate(paginationOpts);

    const pageWithReactions = await Promise.all(
      messages.page.map(async (msg) => {
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", msg._id))
          .collect();
        return { ...msg, reactions };
      })
    );

    return { ...messages, page: pageWithReactions };
  },
});
