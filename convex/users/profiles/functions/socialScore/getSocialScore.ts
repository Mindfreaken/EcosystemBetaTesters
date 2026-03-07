import { query } from "../../../../_generated/server";
import { v } from "convex/values";

// Get a user's social score
export const getSocialScore = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    score: v.number(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Get the user's social score
    const socialScore = await ctx.db
      .query("socialScores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (socialScore) {
      return {
        score: socialScore.score,
        lastUpdated: socialScore.lastUpdated,
      };
    } else {
      // Return default max score if no record exists
      return {
        score: 10000,
        lastUpdated: Date.now(),
      };
    }
  },
});
