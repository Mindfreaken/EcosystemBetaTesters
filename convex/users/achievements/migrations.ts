import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { SYSTEM_ACHIEVEMENTS } from "./system";

export const migrateEarlyAdopterRarity = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let updated = 0;
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_name", (q) => q.eq("name", "Early Adopter"))
      .unique();

    if (existing && existing.rarity !== "mythic") {
      await ctx.db.patch(existing._id, { rarity: "mythic" });
      updated = 1;
    }
    return updated;
  },
});

export const dedupeAndNormalizeAchievements = mutation({
  args: {},
  returns: v.object({
    deduped: v.number(),
    normalized: v.number(),
    reassignedUserAchievements: v.number(),
  }),
  handler: async (ctx) => {
    let deduped = 0;
    let normalized = 0;
    let reassignedUserAchievements = 0;

    for (const sys of SYSTEM_ACHIEVEMENTS) {
      const sameName = await ctx.db
        .query("achievements")
        .withIndex("by_name", (q) => q.eq("name", sys.name))
        .collect();

      if (sameName.length === 0) {
        await ctx.db.insert("achievements", sys);
        normalized++;
        continue;
      }

      const [keep, ...dupes] = sameName.sort((a, b) => a._creationTime - b._creationTime);

      const needsPatch =
        keep.description !== sys.description ||
        keep.category !== sys.category ||
        keep.imageUrl !== sys.imageUrl ||
        keep.rarity !== sys.rarity ||
        (keep.maxUsers ?? undefined) !== (sys.maxUsers ?? undefined) ||
        (keep.limitedEdition ?? undefined) !== (sys.limitedEdition ?? undefined);

      if (needsPatch) {
        await ctx.db.patch(keep._id, {
          description: sys.description,
          category: sys.category,
          imageUrl: sys.imageUrl,
          rarity: sys.rarity,
          maxUsers: sys.maxUsers,
          limitedEdition: sys.limitedEdition,
        });
        normalized++;
      }

      for (const d of dupes) {
        const uas = await ctx.db
          .query("userAchievements")
          .filter((q) => q.eq(q.field("achievementId"), d._id))
          .collect();

        for (const ua of uas) {
          const existingUA = await ctx.db
            .query("userAchievements")
            .withIndex("by_user_and_achievement", (q) =>
              q.eq("userId", ua.userId).eq("achievementId", keep._id)
            )
            .unique();

          if (!existingUA) {
            await ctx.db.insert("userAchievements", {
              userId: ua.userId,
              achievementId: keep._id,
              earnedDate: ua.earnedDate,
            });
            reassignedUserAchievements++;
          }

          await ctx.db.delete(ua._id);
        }

        await ctx.db.delete(d._id);
        deduped++;
      }
    }

    return { deduped, normalized, reassignedUserAchievements };
  },
});
