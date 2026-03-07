import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { rarityValidator } from "./types";

export const awardAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("achievements"),
  },
  returns: v.union(v.null(), v.id("userAchievements")),
  handler: async (ctx, { userId, achievementId }) => {
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_user_and_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .unique();

    if (existing) {
      return null;
    }

    return await ctx.db.insert("userAchievements", {
      userId,
      achievementId,
      earnedDate: Date.now(),
    });
  },
});

export const checkEarlyAdopter = mutation({
  args: {
    userId: v.id("users"),
    joinNumber: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, { userId, joinNumber }) => {
    const isEarlyAdopter = joinNumber <= 2000;

    if (isEarlyAdopter) {
      const earlyAdopterAchievement = await ctx.db
        .query("achievements")
        .withIndex("by_name", (q) => q.eq("name", "Early Adopter"))
        .unique();

      if (earlyAdopterAchievement) {
        const existingUserAchievement = await ctx.db
          .query("userAchievements")
          .withIndex("by_user_and_achievement", (q) =>
            q.eq("userId", userId).eq("achievementId", earlyAdopterAchievement._id)
          )
          .unique();

        if (!existingUserAchievement) {
          await ctx.db.insert("userAchievements", {
            userId,
            achievementId: earlyAdopterAchievement._id,
            earnedDate: Date.now(),
          });
        }
      }
    }
    return isEarlyAdopter;
  },
});

export const createAchievement = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    imageUrl: v.string(),
    rarity: rarityValidator,
    maxUsers: v.optional(v.number()),
    limitedEdition: v.optional(v.boolean()),
  },
  returns: v.id("achievements"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("achievements", args);
  },
});
