import { query } from "../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../_generated/dataModel";
import { User } from "../types";

// Get a user's complete profile data
export const getProfile = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    console.log("[getProfile] Received userId:", args.userId);

    // Get user data - try Convex ID first, then Clerk ID
    let user: User | null = null;
    try {
      user = await ctx.db.get(args.userId as Id<"users">) as User | null;
      console.log("Found user by Convex ID:", args.userId);
    } catch {
      console.log("Invalid Convex ID, will try as Clerk ID:", args.userId);
      user = null;
    }
    if (!user) {
      // If not found by Convex ID, try by Clerk ID
      console.log("[getProfile] Looking up user by Clerk ID:", args.userId);
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkUserId", args.userId as string))
        .first() as User | null;
      if (!user) {
        console.log("[getProfile] User not found by Clerk ID");
        return null;
      }
      console.log("[getProfile] Found user by Clerk ID:", {
        id: user._id,
        username: user.username
      });
    }
    console.log("[getProfile] Resolved user._id:", user._id);

    // Get achievements
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();

    const achievements = await Promise.all(
      userAchievements.map(async ua => {
        const achievement = await ctx.db.get(ua.achievementId);
        return {
          id: ua.achievementId,
          name: achievement?.name || "",
          description: achievement?.description || "",
          imageUrl: achievement?.imageUrl || "",
          earnedDate: ua.earnedDate,
          category: achievement?.category || "",
          rarity: achievement?.rarity || "common",
          limitedEdition: achievement?.limitedEdition,
          maxUsers: achievement?.maxUsers
        };
      })
    );

    // Determine if the viewer is the profile owner
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity?.subject === user.clerkUserId;

    // Get recent activity
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    // Filter activities: exclude punishments from everyone, and system alerts from non-owners
    const filteredActivities = activities.filter(a => {
      const t = String(a.type || "").toLowerCase();
      const title = String(a.title || "").toLowerCase();
      
      if (t.includes("punishment") || title.includes("punishment")) return false;
      if (t === "system_alert" && !isOwner) return false;
      
      return true;
    });

    // Transform activities to match frontend type
    const recentActivity = filteredActivities.map(activity => ({
      id: activity._id,
      type: activity.type,
      title: activity.title,
      // Sanitize to ensure no internal IDs are leaked in UI
      description: typeof activity.description === 'string'
        ? activity.description.replace(/\s*\(ID:[^)]+\)/i, '')
        : activity.description,
      timestamp: activity.timestamp,
      imageUrl: activity.imageUrl,
      content: activity.content,
      targetType: activity.targetType,
      targetName: activity.targetName
    }));

    // Get follow counts
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", q => q.eq("followingId", user._id))
      .collect();
    console.log("[getProfile] Raw followers data:", followers);

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", q => q.eq("followerId", user._id))
      .collect();
    console.log("[getProfile] Raw following data:", following);

    // Get social score
    const socialScore = await ctx.db
      .query("socialScores")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .first();
    
    const currentScore = socialScore?.score || 10000;
    const isMaxScore = currentScore === 10000;

    // Get friend status if viewing user is provided
    const viewingUserId = identity?.subject;
    let isFollowing = false;
    let isFriend = false;
    let isPendingFriend = false;

    if (viewingUserId) {
      // Get viewing user's Convex ID
      const viewingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkUserId", viewingUserId))
        .first() as User | null;

      if (viewingUser) {
        // Check if viewing user is following this profile
        const followRecord = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", q => 
            q.eq("followerId", viewingUser._id)
             .eq("followingId", user._id)
          )
          .first();
        isFollowing = !!followRecord;

        // Check friend status
        const friendRecord1 = await ctx.db
          .query("friends")
          .withIndex("by_user_and_friend", q => 
            q.eq("userId", viewingUser._id)
             .eq("friendId", user._id)
          )
          .first();

        const friendRecord2 = await ctx.db
          .query("friends")
          .withIndex("by_user_and_friend", q => 
            q.eq("userId", user._id)
             .eq("friendId", viewingUser._id)
          )
          .first();
        
        const friendRecord = friendRecord1 || friendRecord2;

        if (friendRecord) {
          isFriend = friendRecord.status === "active";
        }
        isPendingFriend = false; // FriendRequests table would be needed for this
      }
    }

    return {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      customStatus: user.customStatus,
      joinNumber: user.joinNumber,
      achievements,
      recentActivity,
      stats: {
        followers: followers.length,
        following: following.length,
        posts: activities.filter(a => a.type === "post").length,
        socialScore: currentScore,
        isMaxScore
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isFollowing,
      isFriend,
      isPendingFriend,
      profileTypeId: (user as any).profileTypeId,
    };
  },
});
