import { query, internalMutation, internalQuery, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

const BYTES_PER_GB = 1024 * 1024 * 1024;

export const updateUserStorage = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Find all files for the user
    const userFiles = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("uploadedBy", userId))
      .collect();

    // Calculate the total storage used in bytes
    const totalBytesUsed = userFiles.reduce((sum, file) => sum + file.fileSize, 0);

    // Convert bytes to GB
    const totalGBUsed = totalBytesUsed / BYTES_PER_GB;

    // Update the user's record (removed currentStorageUsedGB as it is gone from schema)
    console.log(`Calculated storage for user ${userId} to ${totalGBUsed.toFixed(4)} GB.`);
  },
});

export const getUserStorageInfo = query({
  args: {},
  returns: v.union(v.null(), v.object({
    currentStorageUsedBytes: v.number(),
    storageLimitBytes: v.number(),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const systemParams = await ctx.db.query("system_parameters").first();
    if (!systemParams) {
      // This should not happen if the seeder has been run.
      console.error("System parameters not found. Please seed the database.");
      return null;
    }

    const storageLimitGB =
      user.storageStatus === 'paid' && user.totalStorageAllocatedGB
        ? user.totalStorageAllocatedGB
        : systemParams.freeUserStorageLimitGB;

    // Calculate current storage on the fly since currentStorageUsedGB was removed from schema
    const files = await ctx.db.query("files").withIndex("by_user", q => q.eq("uploadedBy", user._id)).collect();
    const currentStorageUsedBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    const storageLimitBytes = storageLimitGB * BYTES_PER_GB;

    return {
      currentStorageUsedBytes,
      storageLimitBytes,
    };
  },
});

export const backfillUserStorage = internalAction({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log("Starting backfill for user storage calculations.");

    const users = await ctx.runQuery(internal.users.onboarding.storage.getAllUsersForBackfill);

    let count = 0;
    for (const user of users) {
      await ctx.scheduler.runAfter(0, internal.users.onboarding.storage.updateUserStorage, {
        userId: user._id,
      });
      count++;
    }

    const message = `Scheduled storage update jobs for ${count} users.`;
    console.log(message);
    return message;
  },
});

// Internal query to safely fetch all users for the backfill action
export const getAllUsersForBackfill = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
