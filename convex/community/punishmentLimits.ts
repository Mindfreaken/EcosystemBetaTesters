import { query, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { api, internal } from "../_generated/api";

// Constants
const MONTHLY_MUTE_LIMIT = 5;
const MONTHLY_PUNISHMENT_LIMIT = 5;
const SCORE_RESTORATION_POINTS = 15;
const DAYS_FOR_SCORE_RESTORATION = 30;

// Get the number of mutes a user has applied in the current month
export const getUserMuteCount = query({
  args: { 
    userId: v.id("users") 
  },
  returns: v.object({
    count: v.number(),
    limit: v.number(),
    resetDate: v.string()
  }),
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // First day of next month - when limits reset
    const resetDate = new Date(currentYear, currentMonth + 1, 1);
    
    // Get the mute punishment type
    const muteType = await ctx.db
      .query("punishmentTypes")
      .withIndex("by_name", q => q.eq("name", "mute"))
      .first();
    
    if (!muteType) {
      return { count: 0, limit: MONTHLY_MUTE_LIMIT, resetDate: resetDate.toISOString() };
    }
    
    // Get the count of mutes the user has issued this month
    const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    
    // Find punishments where this user is the one who applied the punishment
    // We need to query all user punishments and filter by type and who applied them
    const punishments = await ctx.db
      .query("userPunishments")
      .withIndex("by_applied_by", q => q.eq("appliedById", args.userId))
      .collect();
    
    // Filter to only mute punishments applied in the current month
    const muteCount = punishments.filter(p => {
      return p.punishmentTypeId === muteType._id && 
             p.appliedAt >= startOfMonth && 
             p.appliedAt < resetDate.getTime();
    }).length;
    
    return { 
      count: muteCount, 
      limit: MONTHLY_MUTE_LIMIT, 
      resetDate: resetDate.toISOString() 
    };
  }
});

// Get the total number of punishments a user has applied in the current month
export const getUserTotalPunishmentCount = query({
  args: { 
    userId: v.id("users") 
  },
  returns: v.object({
    count: v.number(),
    limit: v.number(),
    resetDate: v.string()
  }),
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // First day of next month - when limits reset
    const resetDate = new Date(currentYear, currentMonth + 1, 1);
    
    // Get the count of all punishments the user has issued this month
    const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    
    // Find punishments where this user is the one who applied the punishment
    const punishments = await ctx.db
      .query("userPunishments")
      .withIndex("by_applied_by", q => q.eq("appliedById", args.userId))
      .collect();
    
    // Filter punishments applied this month that affect social score
    const punishmentCount = punishments.filter(p => {
      return p.appliedAt >= startOfMonth && 
             p.appliedAt < resetDate.getTime() &&
             p.affectSocialScore === true;
    }).length;
    
    return { 
      count: punishmentCount, 
      limit: MONTHLY_PUNISHMENT_LIMIT, 
      resetDate: resetDate.toISOString() 
    };
  }
});

// Check if a user has exceeded their monthly mute limit
type MuteCountResult = { count: number; limit: number; resetDate: string };

export const hasExceededMuteLimit = internalQuery({
  args: { 
    userId: v.id("users") 
  },
  returns: v.boolean(),
  handler: async (ctx, args: { userId: Id<"users"> }): Promise<boolean> => {
    const result = await ctx.runQuery(api.community.punishmentLimits.getUserMuteCount as any, {
      userId: args.userId
    }) as MuteCountResult;
    
    return result.count >= result.limit;
  }
});

// Check if a user has exceeded their monthly punishment limit
type PunishmentCountResult = { count: number; limit: number; resetDate: string };

export const hasExceededPunishmentLimit = internalQuery({
  args: { 
    userId: v.id("users") 
  },
  returns: v.boolean(),
  handler: async (ctx, args: { userId: Id<"users"> }): Promise<boolean> => {
    const result = await ctx.runQuery(api.community.punishmentLimits.getUserTotalPunishmentCount as any, {
      userId: args.userId
    }) as PunishmentCountResult;
    
    return result.count >= result.limit;
  }
});

// Reset all social score impacts for punishments from a user who exceeded limits
export const resetPunishmentsForUser = internalMutation({
  args: { 
    userId: v.id("users") 
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Start of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    
    // Find punishments applied by this user in the current month that affect social score
    const punishments = await ctx.db
      .query("userPunishments")
      .withIndex("by_applied_by", q => q.eq("appliedById", args.userId))
      .collect();
    
    const userPunishments = punishments.filter(p => {
      return p.appliedAt >= startOfMonth &&
             p.affectSocialScore === true;
    });
    
    // Update each punishment to no longer affect social score
    let resetCount = 0;
    for (const punishment of userPunishments) {
      await ctx.db.patch(punishment._id, {
        affectSocialScore: false
      });
      resetCount++;
    }
    
    // Update affected users' social scores
    const affectedUserIds = new Set<Id<"users">>();
    for (const punishment of userPunishments) {
      affectedUserIds.add(punishment.userId);
    }
    
    // Recalculate social scores for all affected users
    for (const userId of affectedUserIds) {
      await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, {
        userId
      });
    }
    
    return resetCount;
  }
});

// Check all users who exceeded their monthly limit and reset their punishments
export const checkAndResetMonthlyLimits = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db
      .query("users")
      .collect();
    
    let totalResetCount = 0;
    
    // For each user, check if they exceeded the limit
    for (const user of users) {
      const punishmentCount = await ctx.runQuery(api.community.punishmentLimits.getUserTotalPunishmentCount as any, {
        userId: user._id
      }) as PunishmentCountResult;
      
      if (punishmentCount.count >= punishmentCount.limit) {
        // User exceeded limit, reset their punishments
        const resetCount = await ctx.runMutation(internal.community.punishmentLimits.resetPunishmentsForUser, {
          userId: user._id
        });
        
        totalResetCount += resetCount;
        
        // Notify the user about the reset
        await ctx.db.insert("activities", {
          userId: user._id,
          type: "event",
          title: "Punishment Limit Exceeded",
          description: `You've exceeded the monthly limit of ${MONTHLY_PUNISHMENT_LIMIT} punishments that affect social score. All punishments you've applied this month have been reset.`,
          timestamp: Date.now(),
          content: "To maintain fairness in the Ecosystem, we limit how many social score penalties a single user can apply per month."
        });
      }
    }
    
    return totalResetCount;
  }
});

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