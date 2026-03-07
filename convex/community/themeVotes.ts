import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Cast a vote for a theme
 */
export const castVote = mutation({
  args: {
    themeId: v.string(),
    vote: v.union(v.literal("up"), v.literal("down")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    console.log("castVote called with args:", args);

    const identity = await ctx.auth.getUserIdentity();
    console.log("castVote: Identity:", identity);

    if (!identity) {
      console.log("castVote: No identity found, returning false.");
      return false;
    }

    console.log("castVote: Attempting to find user with clerkUserId:", identity.subject);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    
    console.log("castVote: User query result:", user);

    if (!user) {
      console.log("castVote: No user record found in DB for clerkUserId:", identity.subject, ", returning false.");
      return false;
    }

    // Check if the user has already voted for this theme
    console.log("castVote: Checking for existing vote for user:", user._id, "and theme:", args.themeId);
    const existingVote = await ctx.db
      .query("themeVotes")
      .withIndex("by_user_and_theme", (q) =>
        q.eq("userId", user._id).eq("themeId", args.themeId)
      )
      .first();
    
    console.log("castVote: Existing vote query result:", existingVote);

    if (existingVote) {
      console.log("castVote: User has already voted, returning false.");
      // Don't allow changing votes
      return false;
    }

    // Cast the vote
    console.log("castVote: Inserting new vote for user:", user._id);
    await ctx.db.insert("themeVotes", {
      userId: user._id,
      themeId: args.themeId,
      vote: args.vote,
      createdAt: Date.now(),
    });
    console.log("castVote: Vote inserted successfully, returning true.");

    return true;
  },
});

/**
 * Get all votes cast by the current user keyed by themeId
 */
export const getUserVotes = query({
  args: {},
  returns: v.record(v.string(), v.union(v.literal("up"), v.literal("down"))),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return {};

    const votes = await ctx.db
      .query("themeVotes")
      .withIndex("by_user_and_theme", (q) => q.eq("userId", user._id))
      .collect();

    const result: Record<string, "up" | "down"> = {};
    for (const vRow of votes) {
      result[vRow.themeId] = vRow.vote as "up" | "down";
    }
    return result;
  },
});

/**
 * Get vote counts for all themes (specifically upvotes for sorting)
 */
export const getAllThemeVoteCounts = query({
  args: {},
  // Returns a record mapping themeId to its upvote and downvote counts
  returns: v.record(v.string(), v.object({
    upvotes: v.number(),
    downvotes: v.number(),
  })),
  handler: async (ctx) => {
    const allVotes = await ctx.db.query("themeVotes").collect();

    const themeVoteCounts: Record<string, { upvotes: number; downvotes: number }> = {};

    for (const vote of allVotes) {
      if (!themeVoteCounts[vote.themeId]) {
        themeVoteCounts[vote.themeId] = { upvotes: 0, downvotes: 0 };
      }
      if (vote.vote === "up") {
        themeVoteCounts[vote.themeId].upvotes++;
      } else if (vote.vote === "down") {
        themeVoteCounts[vote.themeId].downvotes++;
      }
    }
    return themeVoteCounts;
  },
});

/**
 * Check if a user has voted for a theme
 */
export const hasUserVoted = query({
  args: {
    themeId: v.string(),
  },
  returns: v.object({
    hasVoted: v.boolean(),
    vote: v.optional(v.union(v.literal("up"), v.literal("down"))),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasVoted: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    
    if (!user) {
      return { hasVoted: false };
    }

    // Check if the user has voted for this theme
    const userVote = await ctx.db
      .query("themeVotes")
      .withIndex("by_user_and_theme", (q) =>
        q.eq("userId", user._id).eq("themeId", args.themeId)
      )
      .first();

    if (!userVote) {
      return { hasVoted: false };
    }

    return {
      hasVoted: true,
      vote: userVote.vote,
    };
  },
}); 