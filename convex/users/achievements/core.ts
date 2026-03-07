import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { SYSTEM_ACHIEVEMENTS } from "./system";
import { syncFromAchievementDefsImpl } from "./sync";

export const initializeAchievements = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allExisting = await ctx.db.query("achievements").collect();
    const existingNames = new Set(allExisting.map((a) => a.name));

    for (const achievement of SYSTEM_ACHIEVEMENTS) {
      const already = await ctx.db
        .query("achievements")
        .withIndex("by_name", (q) => q.eq("name", achievement.name))
        .collect();

      if (already.length === 0) {
        await ctx.db.insert("achievements", achievement);
      }
    }

    await syncFromAchievementDefsImpl(ctx);
    return null;
  },
});
