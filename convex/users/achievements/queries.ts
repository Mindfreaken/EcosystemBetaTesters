import { query } from "../../_generated/server";
import { v } from "convex/values";
import { achievementReturnType, rarityValidator, userAchievementReturnType } from "./types";
import { Id } from "../../_generated/dataModel";

export const getAll = query({
  args: {},
  returns: v.array(achievementReturnType),
  handler: async (ctx) => {
    return await ctx.db.query("achievements").collect();
  },
});

export const getUserAchievements = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(userAchievementReturnType),
  handler: async (ctx, { userId }) => {
    const userAchievementsDocs = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return userAchievementsDocs;
  },
});

export const getUserAchievementsWithDetails = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.object({
    _id: v.id("userAchievements"),
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    earnedDate: v.number(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    imageUrl: v.string(),
    rarity: rarityValidator,
  })),
  handler: async (ctx, { userId }) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const result = [] as Array<{
      _id: Id<"userAchievements">;
      userId: Id<"users">;
      achievementId: Id<"achievements">;
      earnedDate: number;
      name: string;
      description: string;
      category: string;
      imageUrl: string;
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
    }>;

    for (const userAchievement of userAchievements) {
      const achievement = await ctx.db.get(userAchievement.achievementId);
      if (achievement) {
        result.push({
          ...userAchievement,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          imageUrl: achievement.imageUrl,
          rarity: achievement.rarity,
        });
      }
    }

    return result;
  },
});
