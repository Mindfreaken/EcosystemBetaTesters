import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import { determineRarity, extractMaxUsers, isLimitedEdition } from "./helpers";

export const syncFromAchievementDefs = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    return await syncFromAchievementDefsImpl(ctx);
  },
});

export async function syncFromAchievementDefsImpl(ctx: MutationCtx): Promise<number> {
  const achievementDefs = await ctx.db.query("achievementsDefs").collect();
  let syncCount = 0;

  for (const def of achievementDefs) {
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_name", (q) => q.eq("name", def.name))
      .unique();

    if (!existing) {
      const rarity = determineRarity(def.category);
      await ctx.db.insert("achievements", {
        name: def.name,
        description: def.description,
        category: def.category,
        imageUrl: def.iconUrl || "/achievements/default.svg",
        rarity,
        maxUsers: extractMaxUsers(def.requirements),
        limitedEdition: isLimitedEdition(def.requirements),
      });
      syncCount++;
    }
  }

  return syncCount;
}
