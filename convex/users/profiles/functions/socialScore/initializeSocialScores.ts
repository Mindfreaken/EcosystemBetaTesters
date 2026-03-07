import { mutation } from "../../../../_generated/server";

// Initialize social scores for all users
export const initializeSocialScores = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();

    // Count of initialized scores
    let initializedCount = 0;

    // Initialize social scores for each user
    for (const user of users) {
      // Check if user already has a social score
      const existingSocialScore = await ctx.db
        .query("socialScores")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      // If no social score exists, create one with default value
      if (!existingSocialScore) {
        await ctx.db.insert("socialScores", {
          userId: user._id,
          score: 10000,
          lastUpdated: Date.now(),
        });
        initializedCount++;
      }
    }

    return { success: true, initializedCount };
  },
});
