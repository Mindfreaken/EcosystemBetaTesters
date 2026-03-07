import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { api, internal } from "../_generated/api";

// Default punishment types
const DEFAULT_PUNISHMENT_TYPES = [
  {
    name: "ban",
    description: "User has been banned",
    pointValue: 50,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: "mute",
    description: "User has been muted",
    pointValue: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Threshold settings to prevent abuse
const PUNISHMENT_THRESHOLDS = {
  ban: {
    daily: 2,     // Max 2 bans per day count against score
    weekly: 5,    // Max 5 bans per week count against score
  },
  mute: {
    daily: 3,     // Max 3 mutes per day count against score
    weekly: 7,    // Max 7 mutes per week count against score
  },
  default: {
    daily: 3,     // Default threshold for new punishment types
    weekly: 7,
  }
};

// Initialize default punishment types
export const initializePunishmentTypes = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if punishment types are already initialized
    const existingBan = await ctx.db
      .query("punishmentTypes")
      .withIndex("by_name", (q) => q.eq("name", "ban"))
      .first();
    
    // If not already initialized, add the default punishment types
    if (!existingBan) {
      for (const punishmentType of DEFAULT_PUNISHMENT_TYPES) {
        await ctx.db.insert("punishmentTypes", punishmentType);
      }
    }
    
    return null;
  },
});

// Deactivate any active punishments whose endAt has passed and restore user scores
export const expireEndedPunishments = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    // Fetch active punishments; we'll filter by endAt in JS since endAt may be optional
    const active = await ctx.db
      .query("userPunishments")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const toExpire = active.filter((p: any) => typeof p.endAt === "number" && p.endAt <= now);
    const affectedUsers = new Set<Id<"users">>();

    for (const p of toExpire) {
      await ctx.db.patch(p._id, { active: false, affectSocialScore: false });
      affectedUsers.add(p.userId);
    }

    for (const userId of affectedUsers) {
      await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId });
    }

    return toExpire.length;
  },
});

// Get all punishment types
export const getPunishmentTypes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("punishmentTypes"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      pointValue: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number())
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("punishmentTypes").collect();
  },
});

// Update a punishment type's point value
export const updatePunishmentTypeValue = mutation({
  args: {
    punishmentTypeId: v.id("punishmentTypes"),
    newPointValue: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const punishmentType = await ctx.db.get(args.punishmentTypeId);
    
    if (!punishmentType) {
      throw new Error("Punishment type not found");
    }

    // Update the punishment type
    await ctx.db.patch(args.punishmentTypeId, {
      pointValue: args.newPointValue,
      updatedAt: Date.now(),
    });

    // Update all affected user social scores
    await updateSocialScoresForPunishmentType(ctx, args.punishmentTypeId);
    
    return null;
  },
});

// Add a new punishment type
export const addPunishmentType = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    pointValue: v.number(),
  },
  returns: v.id("punishmentTypes"),
  handler: async (ctx, args) => {
    // Check if punishment type already exists
    const existing = await ctx.db
      .query("punishmentTypes")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      throw new Error(`Punishment type '${args.name}' already exists`);
    }
    
    // Add the new punishment type
    return await ctx.db.insert("punishmentTypes", {
      name: args.name,
      description: args.description,
      pointValue: args.pointValue,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Apply a punishment to a user
export const applyPunishment = mutation({
  args: {
    userId: v.id("users"), // User applying the punishment (e.g., moderator)
    punishmentTypeId: v.id("punishmentTypes"),
    targetUserId: v.id("users"), // User receiving the punishment (now mandatory)
    affectSocialScore: v.optional(v.boolean()), // NEW: Flag to determine if this should affect social score
    endAt: v.optional(v.number()), // Optional end time (ms since epoch) for automatic expiration
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const punishmentType = await ctx.db.get(args.punishmentTypeId);
    if (!punishmentType) {
      throw new Error("Punishment type not found");
    }
    
    const user = await ctx.db.get(args.userId); // User applying the punishment
    if (!user) {
      throw new Error("User (applying the punishment) not found");
    }
    
    // Verify the target user (being punished) exists
    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("Target user (being punished) not found");
    }

    // Check if the user has exceeded their monthly limit for this type of punishment
    if (punishmentType.name === "mute") {
      const muteCount = await ctx.runQuery(api.community.punishmentLimits.getUserMuteCount, {
        userId: args.userId
      });
      
      if (muteCount.count >= muteCount.limit) {
        throw new Error(`You have reached your monthly limit of ${muteCount.limit} mutes. Limit resets on ${new Date(muteCount.resetDate).toLocaleDateString()}.`);
      }
    }
    
    // Check if the user has exceeded their total monthly punishment limit
    const punishmentCount = await ctx.runQuery(api.community.punishmentLimits.getUserTotalPunishmentCount, {
      userId: args.userId
    });
    
    // Add the punishment record with the new affectSocialScore flag
    const affectSocialScore = args.affectSocialScore !== false; // Default to true if not specified
    
    // If user is about to exceed the limit, warn them
    if (affectSocialScore && punishmentCount.count >= punishmentCount.limit - 1) {
      throw new Error(
        `Warning: This is your last punishment that will affect social score this month. ` +
        `If you apply more than ${punishmentCount.limit} punishments that affect social score per month, ` +
        `ALL of your punishments this month will be reset.`
      );
    }
    
    const insertRecord: any = {
      userId: args.targetUserId, // The user being punished
      punishmentTypeId: args.punishmentTypeId,
      targetUserId: args.targetUserId,
      appliedAt: Date.now(),
      active: true,
      affectSocialScore,
      appliedById: args.userId, // Store who applied the punishment
    };
    if (args.endAt !== undefined) insertRecord.endAt = args.endAt;
    await ctx.db.insert("userPunishments", insertRecord);

    // Update the punished user's social score, but only if affectSocialScore is true
    if (affectSocialScore) {
      await updateUserSocialScore(ctx, args.targetUserId);
    }
    
    // Sync punishment status with friend records
    await ctx.runMutation(api.community.punishments.syncPunishmentsWithFriendRecord, {
      userId: args.userId,
      targetUserId: args.targetUserId
    });
    
    return null;
  },
});

// Remove a punishment from a user
export const removePunishment = mutation({
  args: {
    punishmentId: v.id("userPunishments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const punishment = await ctx.db.get(args.punishmentId);
    if (!punishment) {
      throw new Error("Punishment not found");
    }
    
    // Store the original values before making changes
    const originalUserId = punishment.userId;
    const wasAffectingSocialScore = punishment.affectSocialScore !== false; // Default to true for backward compatibility
    const appliedById = punishment.appliedById; // Who originally applied this punishment
    
    // Mark the punishment as inactive and ensure it doesn't affect social score anymore
    await ctx.db.patch(args.punishmentId, {
      active: false,
      affectSocialScore: false // Explicitly set to false to ensure it won't affect score anymore
    });

    // Always update the user's social score to ensure the punishment effect is removed
    // Even if it wasn't affecting score before, this ensures consistency
    await updateUserSocialScore(ctx, originalUserId);
    
    // Sync punishment status with friend records
    if (appliedById) {
      await ctx.runMutation(api.community.punishments.syncPunishmentsWithFriendRecord, {
        userId: appliedById,
        targetUserId: originalUserId
      });
    }
    
    
    
    return null;
  },
});

// Get a user's punishments
export const getUserPunishments = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("userPunishments"),
      _creationTime: v.number(),
      userId: v.id("users"),
      punishmentTypeId: v.id("punishmentTypes"),
      punishmentName: v.string(),
      punishmentDescription: v.optional(v.string()),
      pointValue: v.optional(v.number()),
      targetUserId: v.optional(v.id("users")),
      appliedAt: v.number(),
      active: v.boolean(),
      affectSocialScore: v.optional(v.boolean()),
      appliedById: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx, args) => {
    const punishments = await ctx.db
      .query("userPunishments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Enhance punishments with type information
    const enhancedPunishments = [];
    
    for (const punishment of punishments) {
      const punishmentType = await ctx.db.get(punishment.punishmentTypeId);
      if (punishmentType) {
        enhancedPunishments.push({
          ...punishment,
          punishmentName: punishmentType.name,
          punishmentDescription: punishmentType.description,
          pointValue: punishmentType.pointValue,
          affectSocialScore: punishment.affectSocialScore !== false // Default to true for backward compatibility
        });
      }
    }
    
    return enhancedPunishments;
  },
});

// Get the threshold configuration
export const getPunishmentThresholds = query({
  args: {},
  returns: v.any(),
  handler: async () => {
    return PUNISHMENT_THRESHOLDS;
  },
});

// Helper function to update a user's social score based on active punishments
async function updateUserSocialScore(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  // Get all the user's active punishments
  const activePunishments = await ctx.db
    .query("userPunishments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("active"), true))
    .collect();
  
  // Group punishments by type
  const punishmentsByType: Record<string, Array<{ id: Id<"userPunishments">, appliedAt: number, pointValue: number }>> = {};
  
  for (const punishment of activePunishments) {
    // Skip punishments that don't affect social score
    const affectSocialScore = punishment.affectSocialScore !== false; // Default to true for backward compatibility
    if (!affectSocialScore) continue;
    
    const punishmentType = await ctx.db.get(punishment.punishmentTypeId);
    if (!punishmentType) continue;
    
    // Initialize array for this punishment type if it doesn't exist
    if (!punishmentsByType[punishmentType.name]) {
      punishmentsByType[punishmentType.name] = [];
    }
    
    // Add punishment details to the appropriate group
    punishmentsByType[punishmentType.name].push({
      id: punishment._id,
      appliedAt: punishment.appliedAt as number, // Ensure it's treated as number
      pointValue: punishmentType.pointValue ?? 0 // Default to 0 if undefined
    });
  }
  
  // Calculate total point deduction with thresholds applied
  let totalDeduction = 0;
  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  // Process each punishment type
  for (const [typeName, punishments] of Object.entries(punishmentsByType)) {
    // Sort punishments by date (newest first) so we can count most recent
    const sortedPunishments = punishments.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    
    // Get thresholds for this punishment type
    const thresholds = PUNISHMENT_THRESHOLDS[typeName as keyof typeof PUNISHMENT_THRESHOLDS] || 
                       PUNISHMENT_THRESHOLDS.default;
    
    // Filter punishments from last day and last week
    const lastDayPunishments = sortedPunishments.filter(p => 
      new Date(p.appliedAt) >= oneDayAgo
    );
    
    const lastWeekPunishments = sortedPunishments.filter(p => 
      new Date(p.appliedAt) >= oneWeekAgo
    );
    
    // Apply daily threshold
    const dailyCountedPunishments = lastDayPunishments.slice(0, thresholds.daily);
    
    // Apply weekly threshold (excluding punishments already counted in daily)
    const dailyPunishmentIds = new Set(dailyCountedPunishments.map(p => p.id.toString()));
    const weeklyPunishmentsExcludingDaily = lastWeekPunishments.filter(p => 
      !dailyPunishmentIds.has(p.id.toString())
    ).slice(0, thresholds.weekly);
    
    // Add all other punishments outside time window
    const olderPunishments = sortedPunishments.filter(p => 
      new Date(p.appliedAt) < oneWeekAgo
    );
    
    // Calculate deduction for this punishment type
    const deduction = [...dailyCountedPunishments, ...weeklyPunishmentsExcludingDaily, ...olderPunishments]
      .reduce((total, p) => total + p.pointValue, 0);
    
    totalDeduction += deduction;
  }
  
  // Get the user's current social score
  const socialScore = await ctx.db
    .query("socialScores")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  
  const baseScore = 10000; // Maximum social score
  const newScore = Math.max(0, baseScore - totalDeduction); // Ensure score doesn't go below 0
  
  if (socialScore) {
    // Update existing social score
    await ctx.db.patch(socialScore._id, {
      score: newScore,
      lastUpdated: Date.now()
    });
  } else {
    // Create a new social score
    await ctx.db.insert("socialScores", {
      userId,
      score: newScore,
      lastUpdated: Date.now()
    });
  }
}

// Helper function to update all users with a specific punishment type when the point value changes
async function updateSocialScoresForPunishmentType(
  ctx: MutationCtx,
  punishmentTypeId: Id<"punishmentTypes">
) {
  // Get all active punishments of this type
  const activePunishments = await ctx.db
    .query("userPunishments")
    .withIndex("by_type_and_user", (q) => q.eq("punishmentTypeId", punishmentTypeId))
    .filter((q) => q.eq(q.field("active"), true))
    .collect();
  
  // Get unique user IDs from the punishments
  const userIds = new Set<Id<"users">>();
  
  for (const punishment of activePunishments) {
    // Only include punishments that affect social score
    const affectSocialScore = punishment.affectSocialScore !== false; // Default to true for backward compatibility
    if (affectSocialScore) {
      userIds.add(punishment.userId);
    }
  }
  
  // Update each user's social score
  for (const userId of userIds) {
    await updateUserSocialScore(ctx, userId);
  }
}

// Internal mutation to update a user's social score based on active punishments
export const updateUserSocialScoreMutation = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx: MutationCtx, args: { userId: Id<"users"> }) => {
    return updateUserSocialScore(ctx, args.userId);
  },
});

// Sync punishment status with friend records
export const syncPunishmentsWithFriendRecord = mutation({
  args: {
    userId: v.id("users"),      // User who applied the punishment
    targetUserId: v.id("users") // User who received the punishment
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate users exist
    const [user, targetUser] = await Promise.all([
      ctx.db.get(args.userId),
      ctx.db.get(args.targetUserId)
    ]);
    if (!user || !targetUser) return null;

    // Active punishments applied by this user to the target
    const activePunishments = await ctx.db
      .query("userPunishments")
      .filter(q => 
        q.and(
          q.eq(q.field("appliedById"), args.userId),
          q.eq(q.field("userId"), args.targetUserId),
          q.eq(q.field("active"), true)
        )
      )
      .collect();
    
    // Get punishment types
    const punishmentTypes = await ctx.db.query("punishmentTypes").collect();
    const punishmentTypeMap = new Map(
      punishmentTypes.map(type => [type._id.toString(), type.name])
    );
    
    // Determine if there are active bans or mutes
    const hasActiveBan = activePunishments.some(p => 
      punishmentTypeMap.get(p.punishmentTypeId.toString()) === "ban"
    );
    
    const hasActiveMute = activePunishments.some(p => 
      punishmentTypeMap.get(p.punishmentTypeId.toString()) === "mute"
    );
    
    // Get friend record (in either direction)
    let friendRecord = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", q => 
        q.eq("userId", args.userId).eq("friendId", args.targetUserId)
      )
      .first();
    
    if (!friendRecord) {
      // Check reverse direction
      friendRecord = await ctx.db
        .query("friends")
        .withIndex("by_user_and_friend", q => 
          q.eq("userId", args.targetUserId).eq("friendId", args.userId)
        )
        .first();
    }
    
    // If friend record exists, update it
    if (friendRecord) {
      const updates: Record<string, any> = {};
      
      if (hasActiveBan) {
        updates.status = "blocked";
      } else if (friendRecord.status === "blocked" && !hasActiveBan) {
        updates.status = "active";
      }
      
      if (hasActiveMute !== friendRecord.isMuted) {
        updates.isMuted = hasActiveMute;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(friendRecord._id, updates);
      }
    }
    
    return null;
  }
});

// Deactivate a punishment (set to inactive) instead of removing it
export const deactivatePunishment = mutation({
  args: {
    punishmentId: v.id("userPunishments"),
    restorePoints: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const punishment = await ctx.db.get(args.punishmentId);
    if (!punishment) {
      throw new Error("Punishment not found");
    }
    
    // Store the original values before making changes
    const originalUserId = punishment.userId;
    const wasAffectingSocialScore = punishment.affectSocialScore !== false; // Default to true for backward compatibility
    const appliedById = punishment.appliedById; // Who originally applied this punishment
    
    // Determine if we should restore points
    const restorePoints = args.restorePoints !== false;
    
    // Mark the punishment as inactive
    const updates: Record<string, any> = {
      active: false
    };
    
    // Only modify affectSocialScore if we're restoring points
    if (restorePoints && wasAffectingSocialScore) {
      updates.affectSocialScore = false;
    }
    
    // Update the punishment
    await ctx.db.patch(args.punishmentId, updates);

    // Always update the user's social score if we're restoring points
    if (restorePoints && wasAffectingSocialScore) {
      await updateUserSocialScore(ctx, originalUserId);
    }
    
    // Sync punishment status with friend records
    if (appliedById) {
      await ctx.runMutation(api.community.punishments.syncPunishmentsWithFriendRecord, {
        userId: appliedById,
        targetUserId: originalUserId
      });
    }
    
    
    
    return null;
  },
});

// Get punishments applied by a specific user to a target
export const getPunishmentsAppliedByUser = query({
  args: {
    appliedById: v.id("users"),
    targetUserId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("userPunishments"),
      _creationTime: v.number(),
      userId: v.id("users"),
      punishmentTypeId: v.id("punishmentTypes"),
      punishmentName: v.string(),
      punishmentDescription: v.optional(v.string()),
      pointValue: v.optional(v.number()),
      targetUserId: v.optional(v.id("users")),
      appliedAt: v.number(),
      active: v.boolean(),
      affectSocialScore: v.optional(v.boolean()),
      appliedById: v.optional(v.id("users")),
    })
  ),
  handler: async (ctx, args) => {
    // Find punishments where this user is the one who applied it
    // and the target is the specified user
    const punishments = await ctx.db
      .query("userPunishments")
      .withIndex("by_applied_by", (q) => q.eq("appliedById", args.appliedById))
      .filter((q) => q.eq(q.field("userId"), args.targetUserId))
      .collect();
    
    // Enhance punishments with type information
    const enhancedPunishments = [];
    
    for (const punishment of punishments) {
      const punishmentType = await ctx.db.get(punishment.punishmentTypeId);
      if (punishmentType) {
        enhancedPunishments.push({
          ...punishment,
          punishmentName: punishmentType.name,
          punishmentDescription: punishmentType.description,
          pointValue: punishmentType.pointValue,
          affectSocialScore: punishment.affectSocialScore !== false // Default to true for backward compatibility
        });
      }
    }
    
    return enhancedPunishments;
  },
}); 