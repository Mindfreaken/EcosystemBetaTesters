import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { convertToPublicHttpsUrl } from "./attachments/helpers";

const BYTES_PER_GB = 1024 * 1024 * 1024;
const DEFAULT_FREE_LIMIT_GB = 1; // Fallback when system parameters are not yet configured

// Using centralized URL normalization helper

// Generate a presigned URL for uploading a file to Convex storage
export const generateUploadUrl = mutation({
  args: {
    fileSize: v.number(),
    overwrite: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({ success: v.literal(true), url: v.string() }),
    v.object({ success: v.literal(false), spaceNeeded: v.number() })
  ),
  handler: async (ctx, args): Promise<{ success: true; url: string; } | { success: false; spaceNeeded: number; }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to upload a file.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) { throw new Error("User record not found."); }

    // Temporarily bypass quota checks and system parameters; always allow upload for authenticated users
    return { success: true, url: await ctx.storage.generateUploadUrl() };
  },
});

// Store file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    userId: v.id("users"),
    chatId: v.optional(v.id("chats")),
    path: v.string(),
  },
  returns: v.object({
    _id: v.id("files"),
    storageId: v.id("_storage"),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the URL for the file
    const rawUrl = await ctx.storage.getUrl(args.storageId);
    
    if (!rawUrl) {
      throw new Error("Failed to get URL for uploaded file");
    }
    const publicUrl = convertToPublicHttpsUrl(rawUrl);
    if (!publicUrl) {
      // This case should ideally not happen if rawUrl is valid and conversion is robust
      // or if convertToPublicHttpsUrl always returns string for non-null input.
      // Given the current helper, if rawUrl is non-null, publicUrl will be non-null.
      throw new Error("Failed to convert raw URL to public HTTPS URL");
    }
    
    // Extract the URL pattern (domain + storage ID) for easier lookups
    let urlPattern: string | undefined = undefined;
    try {
      const storageMatch = publicUrl.match(/\/storage\/([^/?#]+)/);
      if (storageMatch && storageMatch[1]) {
        urlPattern = storageMatch[1];
      }
    } catch (error) {
      console.error("Error extracting URL pattern:", error);
    }
    
    // Save file metadata in the database
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: args.userId,
      chatId: args.chatId,
      path: args.path,
      uploadedAt: Date.now(),
      urlPattern,
    });
    
    // After inserting the file, update the user's storage calculation
    await ctx.scheduler.runAfter(0, internal.users.onboarding.storage.updateUserStorage, {
      userId: args.userId,
    });

    return {
      _id: fileId,
      storageId: args.storageId,
      url: publicUrl,
    };
  },
});

// Get file URL by ID
export const getFileUrl = query({
  args: {
    fileId: v.id("files"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }
    
    const rawUrl = await ctx.storage.getUrl(file.storageId);
    return convertToPublicHttpsUrl(rawUrl);
  },
});

// Check if a file has active reports against it
export const hasActiveReports = query({
  args: {
    fileId: v.id("files"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the file
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return false;
    }
    
    // Check for reports related to this file
    const reports = await ctx.db
      .query("chatReports")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .filter(q => q.neq(q.field("status"), "resolved"))
      .collect();
    
    return reports.length > 0;
  },
});

// Delete a file
export const deleteFile = mutation({
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
      .withIndex("by_clerk_id", q => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found.");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return false;
    }
    
    // Check if user has permission to delete this file
    if (file.uploadedBy.toString() !== user._id.toString()) {
      throw new Error("Unauthorized to delete this file");
    }
    
    // Check if file has active reports against it
    const reports = await ctx.db
      .query("chatReports")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .filter(q => q.neq(q.field("status"), "resolved"))
      .collect();
    
    if (reports.length > 0) {
      // Don't delete files with active reports
      return false;
    }
    
    // If the file is associated with a chat, schedule deletion of the related message via internal helper
    if (file.chatId) {
      await ctx.scheduler.runAfter(0, internal.chat.functions.files.removeMessageForFileAttachment, {
        fileId: args.fileId,
      });
    }
    
    // Delete the file from storage
    await ctx.storage.delete(file.storageId);
    // Delete the file record from the database
    await ctx.db.delete(args.fileId);

    // After deleting the file, update the user's storage calculation
    await ctx.scheduler.runAfter(0, internal.users.onboarding.storage.updateUserStorage, {
      userId: user._id,
    });
    
    return true;
  },
});

// Find a file by path
export const findFileByPath = query({
  args: {
    path: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(v.id("files"), v.null()),
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("uploadedBy", args.userId))
      .filter((q) => q.eq(q.field("path"), args.path))
      .collect();
    
    if (files.length === 0) {
      return null;
    }
    
    // Return the most recently uploaded file if there are multiple matches
    return files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
  },
});

// Find a file by storage ID
export const findFileByStorageId = query({
  args: {
    storageId: v.string(),
  },
  returns: v.union(v.id("files"), v.null()),
  handler: async (ctx, args) => {
    // Try to convert the string to a storage ID if it's not already in the correct format
    let storageId;
    try {
      // If it's already a proper ID with table prefix, this will work
      if (args.storageId.includes(':')) {
        storageId = args.storageId as Id<"_storage">;
      } else {
        // For legacy IDs, we need to query by string comparison
        const files = await ctx.db
          .query("files")
          .filter((q) => q.eq(q.field("storageId").toString(), args.storageId))
          .collect();
        
        if (files.length > 0) {
          // Return the most recently uploaded file if there are multiple matches
          return files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
        }
        return null;
      }
    } catch (error) {
      console.error("Error processing storage ID:", error);
      return null;
    }
    
    // If we have a proper storage ID, query by it directly
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("storageId"), storageId))
      .collect();
    
    if (files.length === 0) {
      return null;
    }
    
    // Return the most recently uploaded file if there are multiple matches
    return files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
  },
});

// Find a file by its URL
export const findFileByUrl = query({
  args: {
    url: v.string(),
  },
  returns: v.union(v.id("files"), v.null()),
  handler: async (ctx, args) => {
    // Extract the storage ID from the URL
    const storageIdMatch = args.url.match(/\/storage\/([^/?#]+)/);
    if (!storageIdMatch || !storageIdMatch[1]) {
      return null;
    }
    
    const storageId = storageIdMatch[1];
    
    // First try to find by URL pattern
    // This will work for files uploaded after we added the urlPattern field
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("urlPattern"), storageId))
      .collect();
      
    if (files.length > 0) {
      return files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
    }
    
    // Try to find by direct storage ID match
    try {
      // First try to find by direct storageId match (for properly formatted IDs)
      if (storageId.includes(':')) {
        const storageIdObj = storageId as Id<"_storage">;
        const filesByStorageId = await ctx.db
          .query("files")
          .filter((q) => q.eq(q.field("storageId"), storageIdObj))
          .collect();
        
        if (filesByStorageId.length > 0) {
          return filesByStorageId.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
        }
      }
      
      // For legacy IDs (UUIDs without table prefix), compare as strings
      const filesByLegacyId = await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("storageId").toString(), storageId))
        .collect();
      
      if (filesByLegacyId.length > 0) {
        return filesByLegacyId.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
      }
      
      // If still not found, try to find by direct URL comparison
      // Get a batch of recent files (limit to 100 to avoid performance issues)
      const recentFiles = await ctx.db
        .query("files")
        .order("desc")
        .take(100);
      
      // Check each file's URL
      for (const file of recentFiles) {
        const rawStorageUrl = await ctx.storage.getUrl(file.storageId);
        // Transform the URL from storage before comparing with args.url
        const publicStorageUrl = convertToPublicHttpsUrl(rawStorageUrl);
        if (publicStorageUrl === args.url) {
          return file._id;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error finding file by URL:", error);
      return null;
    }
  },
});

// Find a file by URL pattern (storage ID in URL)
export const findFileByUrlPattern = query({
  args: {
    urlPattern: v.string(),
  },
  returns: v.union(v.id("files"), v.null()),
  handler: async (ctx, args) => {
    // Look up files by URL pattern
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("urlPattern"), args.urlPattern))
      .collect();
    
    if (files.length === 0) {
      return null;
    }
    
    // Return the most recently uploaded file if there are multiple matches
    return files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
  },
});

// Clean up orphaned files for a user
export const cleanupOrphanedFiles = mutation({
  args: {
    userId: v.id("users"),
    olderThanHours: v.optional(v.number()),
  },
  returns: v.array(v.id("files")),
  handler: async (ctx, args): Promise<Id<"files">[]> => {
    // Get files uploaded by this user
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("uploadedBy", args.userId))
      .collect();
    
    const cutoffTime = args.olderThanHours 
      ? Date.now() - (args.olderThanHours * 60 * 60 * 1000) 
      : 0;
    
    const deletedFileIds: Id<"files">[] = [];
    
    // Check each file for references in the users table
    for (const file of files) {
      // Skip recently uploaded files based on cutoffTime
      if (file.uploadedAt > cutoffTime) {
        continue;
      }
      
      // Get the file URL and transform it for comparison
      const rawFileUrl = await ctx.storage.getUrl(file.storageId);
      if (!rawFileUrl) {
        continue;
      }
      const publicFileUrl = convertToPublicHttpsUrl(rawFileUrl);
      if (!publicFileUrl) { // Should not happen if rawFileUrl is valid
        continue;
      }
      
      // Check if this file is referenced in any user's avatarUrl or coverUrl
      // Assuming avatarUrl and coverUrl store the public (transformed) HTTPS URL
      const usersWithFile = await ctx.db
        .query("users")
        .filter((q) => 
          q.or(
            q.eq(q.field("avatarUrl"), publicFileUrl),
            q.eq(q.field("coverUrl"), publicFileUrl)
          )
        )
        .collect();
      
      // If the file is not referenced by any user, delete it
      if (usersWithFile.length === 0) {
        // Check if the file has active reports
        const reports = await ctx.db
          .query("chatReports")
          .withIndex("by_file", (q) => q.eq("fileId", file._id))
          .filter(q => q.neq(q.field("status"), "resolved"))
          .collect();
        
        if (reports.length === 0) {
          // Delete the file from storage
          await ctx.storage.delete(file.storageId);
          // Delete the file metadata
          await ctx.db.delete(file._id);
          deletedFileIds.push(file._id);
        }
      }
    }
    
    return deletedFileIds;
  },
});

// Admin mutation to delete a file, bypassing ownership checks
export const adminDeleteFile = mutation({
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
      .withIndex("by_clerk_id", q => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found.");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return false;
    }
    
    // Check if user has permission to delete this file
    if (file.uploadedBy.toString() !== user._id.toString()) {
      throw new Error("Unauthorized to delete this file");
    }
    
    // Check if file has active reports against it
    const reports = await ctx.db
      .query("chatReports")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .filter(q => q.neq(q.field("status"), "resolved"))
      .collect();
    
    if (reports.length > 0) {
      // Don't delete files with active reports
      return false;
    }
    
    // If the file is associated with a chat, schedule deletion of the related message via internal helper
    if (file.chatId) {
      await ctx.scheduler.runAfter(0, internal.chat.functions.files.removeMessageForFileAttachment, {
        fileId: args.fileId,
      });
    }
    
    // Delete the file from storage
    await ctx.storage.delete(file.storageId);
    // Delete the file record from the database
    await ctx.db.delete(file._id);

    // After deleting the file, update the user's storage calculation
    await ctx.scheduler.runAfter(0, internal.users.onboarding.storage.updateUserStorage, {
      userId: user._id,
    });
    
    return true;
  },
}); 