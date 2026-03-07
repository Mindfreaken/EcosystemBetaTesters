import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { convertToPublicHttpsUrl } from "../attachments/helpers";

// List managed user files (excluding space files)
export const getManagedUserFiles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("files"),
      fileName: v.string(),
      fileSize: v.number(),
      fileType: v.string(),
      uploadedAt: v.number(),
      url: v.string(),
      path: v.string(),
      chatId: v.optional(v.id("chats")),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const userFiles = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("uploadedBy", user._id))
      .order("desc")
      .collect();

    // Exclude files from spaces, which will have their own storage management.
    const filteredFiles = userFiles.filter((file) => !file.path.startsWith("spaces/"));

    const result = [] as Array<{
      _id: Id<"files">;
      fileName: string;
      fileSize: number;
      fileType: string;
      uploadedAt: number;
      url: string;
      path: string;
      chatId?: Id<"chats">;
    }>;

    for (const file of filteredFiles) {
      const rawUrl = await ctx.storage.getUrl(file.storageId);
      if (!rawUrl) continue;
      const publicUrl = convertToPublicHttpsUrl(rawUrl);
      if (!publicUrl) continue;
      result.push({
        _id: file._id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        url: publicUrl,
        path: file.path,
        chatId: file.chatId as Id<"chats"> | undefined,
      });
    }

    return result;
  },
});

// Delete a file and its associated chat message (if any)
export const deleteFileAndMessage = mutation({
  args: {
    fileId: v.id("files"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to delete a file.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found.");

    const file = await ctx.db.get(args.fileId);
    if (!file) return false;

    if (file.uploadedBy.toString() !== user._id.toString()) {
      throw new Error("Unauthorized to delete this file");
    }

    // Find and delete the message containing this attachment
    if (file.chatId) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_and_time", (q) => q.eq("chatId", file.chatId as Id<"chats">))
        .collect();
      const messageToDelete = messages.find((m) => m.attachments?.some((a) => a.fileId === args.fileId));
      if (messageToDelete) {
        await ctx.db.delete(messageToDelete._id);
      }
    } else {
      // Fallback for files without a chatId
      const allChats = await ctx.db.query("chats").collect();
      const userChats = allChats.filter((chat) => chat.participants.includes(user._id));
      for (const chat of userChats) {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_chat_and_time", (q) => q.eq("chatId", chat._id))
          .collect();
        const messageToDelete = messages.find((m) => m.attachments?.some((a) => a.fileId === args.fileId));
        if (messageToDelete) {
          await ctx.db.delete(messageToDelete._id);
          break;
        }
      }
    }

    // Delete file from storage and metadata from db
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(file._id);

    return true;
  },
});
