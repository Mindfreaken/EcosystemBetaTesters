import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";

export const addSnapshot = mutation({
  args: {
    userId: v.id("users"), // The user whose profile is being snapshotted
    snapshottingUserId: v.id("users"), // The user who is taking the snapshot
  },
  handler: async (ctx, args) => {
    const profileData = await ctx.db.get(args.userId);
    const socialScoreData = await ctx.db.query("socialScores").filter(q => q.eq(q.field("userId"), args.userId)).unique();
    const achievements = await ctx.db.query("userAchievements").filter(q => q.eq(q.field("userId"), args.userId)).collect();

    if (!profileData) {
      console.warn(`User with ID ${args.userId} not found for snapshot.`);
      return null;
    }

    // Fetch actual followers count
    const followers = await ctx.db.query("follows")
      .filter(q => q.eq(q.field("followingId"), args.userId))
      .collect();
    const followersCount = followers.length;

    await ctx.db.insert("profileSnapshots", {
      userId: args.userId,
      snapshottingUserId: args.snapshottingUserId,
      timestamp: Date.now(),
      joinNumber: profileData.joinNumber,
      displayName: profileData.displayName,
      username: profileData.username,
      followers: followersCount,
      achievementsCount: achievements.length,
      role: profileData.role,
      joinDate: profileData.createdAt,
      socialScore: socialScoreData?.score || 0,
    });

    return null; // Or return the snapshot ID if needed
  },
});

export const getSnapshotsForUser = query({
  args: {
    snapshottingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("profileSnapshots")
      .filter(q => q.eq(q.field("snapshottingUserId"), args.snapshottingUserId))
      .order("desc") // Get latest snapshots first
      .collect();
  },
});

export const deleteSnapshots = mutation({
  args: {
    userId: v.id("users"), // The user whose profile was snapshotted
    snapshottingUserId: v.id("users"), // The user who took the snapshot
  },
  handler: async (ctx, args) => {
    const snapshotsToDelete = await ctx.db.query("profileSnapshots")
      .filter(q =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("snapshottingUserId"), args.snapshottingUserId)
      )
      .collect();

    for (const snapshot of snapshotsToDelete) {
      await ctx.db.delete(snapshot._id);
    }
  },
}); 