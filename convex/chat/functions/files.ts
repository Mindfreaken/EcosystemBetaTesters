import { query, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { convertToPublicHttpsUrl } from "../attachments/helpers";

// Get files for a chat
export const getFilesForChat = query({
  args: {
    chatId: v.id("chats"),
  },
  returns: v.array(
    v.object({
      _id: v.id("files"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      url: v.string(),
      uploadedBy: v.id("users"),
      uploadedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const result: Array<{
      _id: Id<"files">;
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
      uploadedBy: Id<"users">;
      uploadedAt: number;
    }> = [];

    for (const file of files) {
      const rawUrl = await ctx.storage.getUrl(file.storageId);
      if (rawUrl) {
        const publicUrl = convertToPublicHttpsUrl(rawUrl);
        if (publicUrl) {
          result.push({
            _id: file._id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            url: publicUrl,
            uploadedBy: file.uploadedBy,
            uploadedAt: file.uploadedAt,
          });
        }
      }
    }

    return result;
  },
});

// Internal helper: remove message that references a given file as attachment
export const removeMessageForFileAttachment = internalMutation({
  args: {
    fileId: v.id("files"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;

    if (file.chatId) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_and_time", (q) => q.eq("chatId", file.chatId!))
        .collect();

      for (const message of messages) {
        if (message.attachments?.some((att) => (att as any).fileId === file._id)) {
          await ctx.db.delete(message._id);
          break; // Assuming one message per file attachment
        }
      }
    }

    return null;
  },
});
