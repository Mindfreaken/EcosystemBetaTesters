import { query } from "../../_generated/server";
import { v } from "convex/values";

// Get a user by Clerk ID
export const getUserByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkUserId: v.optional(v.string()),
      username: v.optional(v.string()),
      displayName: v.optional(v.string()),
      email: v.string(),
      avatarUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
      isAdmin: v.optional(v.boolean()),
      lastSeen: v.optional(v.number()),
      status: v.optional(v.string()),
      customStatus: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      joinNumber: v.optional(v.number()),
      isBanned: v.optional(v.boolean()),
      role: v.optional(v.string())
    })
  ),
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (user) {
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        clerkUserId: user.clerkUserId,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        isAdmin: user.isAdmin,
        lastSeen: user.lastSeen,
        status: user.status,
        customStatus: user.customStatus,
        bio: user.bio,
        location: user.location,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        joinNumber: user.joinNumber,
        isBanned: user.isBanned,
        role: user.role,
      };
    }
    return null;
  },
});

// Count of active users in the last N days (default: 30)
export const getActiveUserCount = query({
  args: {
    windowDays: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, { windowDays }) => {
    const days = windowDays ?? 30;
    const now = Date.now();
    const threshold = now - days * 24 * 60 * 60 * 1000;

    // Collect all users; for large datasets, consider adding an index and filtering via range
    const all = await ctx.db.query("users").collect();
    const active = all.filter((u) => {
      // Exclude system user(s)
      if (u.role === 'system') return false;
      const last = u.lastSeen ?? u.updatedAt ?? u.createdAt;
      return typeof last === 'number' && last >= threshold;
    });
    return active.length;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique();
    return user;
  },
});

// Get details for multiple users by their Convex IDs
export const getUsersDetailsByConvexId = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      username: v.string(),
      displayName: v.string(),
      avatarUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { userIds }) => {
    // Fetch actual user data from the database
    const userDocs = await Promise.all(
      userIds.map(userId => ctx.db.get(userId))
    );

    // Filter out any null values and map to the expected structure
    return userDocs
      .filter(Boolean)
      .map(user => ({
        userId: user!._id,
        username: user!.username || "UnknownUser",
        displayName: user!.displayName || user!.username || "Unknown User",
        avatarUrl: user!.avatarUrl, // Already an optional string in the schema
        coverUrl: user!.coverUrl, // Add coverUrl to the returned object
      }));
  },
});
// Get a single user by their Convex ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
