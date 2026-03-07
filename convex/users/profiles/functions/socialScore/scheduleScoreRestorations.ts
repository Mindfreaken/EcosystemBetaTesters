import { internalMutation } from "../../../../_generated/server";
import { v } from "convex/values";

// Constants
const SCORE_RESTORATION_POINTS = 15;
const DAYS_FOR_SCORE_RESTORATION = 30;

// Schedule a social score restoration task for users who haven't had punishments in 30 days
export const scheduleScoreRestorations = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (DAYS_FOR_SCORE_RESTORATION * 24 * 60 * 60 * 1000);
    
    // Get all social scores less than max
    const maxScore = 10000;
    const socialScores = await ctx.db
      .query("socialScores")
      .filter(q => q.lt(q.field("score"), maxScore))
      .collect();
    
    let restoredCount = 0;
    
    for (const score of socialScores) {
      // Check if user has had any active punishments in the last 30 days
      const recentPunishments = await ctx.db
        .query("userPunishments")
        .withIndex("by_user", q => q.eq("userId", score.userId))
        .filter(q => q.gt(q.field("appliedAt"), thirtyDaysAgo))
        .first();
      
      // If no recent punishments, restore some points
      if (!recentPunishments) {
        const newScore = Math.min(maxScore, score.score + SCORE_RESTORATION_POINTS);
        await ctx.db.patch(score._id, {
          score: newScore,
          lastUpdated: now
        });
        
        // Record the restoration in user activities
        await ctx.db.insert("activities", {
          userId: score.userId,
          type: "achievement",
          title: "Social Score Restoration",
          description: `${SCORE_RESTORATION_POINTS} points were restored to your social score after 30 days of good behavior.`,
          timestamp: now,
          content: `Your social score has been increased to ${newScore}.`
        });
        
        restoredCount++;
      }
    }
    
    return restoredCount;
  }
}); 