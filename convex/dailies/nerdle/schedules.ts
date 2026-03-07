import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const upsertMany = mutation({
  args: {
    entries: v.array(
      v.object({
        game: v.string(),
        period: v.string(),
        date: v.string(), // YYYY-MM-DD
        wordId: v.number(),
        displayName: v.string(),
      })
    ),
    replace: v.optional(v.boolean()), // if true, clear existing rows for the (period, game) before insert
  },
  handler: async (ctx, args) => {
    const entries = args.entries;
    if (!entries.length) return 0;

    if (args.replace) {
      // Determine all (period, game) pairs and delete existing
      const keys = new Set(entries.map((e) => `${e.period}|||${e.game}`));
      for (const key of keys) {
        const [period, game] = key.split("|||");
        const toDelete = await ctx.db
          .query("nerdleschedules")
          .withIndex("by_period_game_date", (q) => q.eq("period", period as string).eq("game", game as string))
          .collect();
        for (const row of toDelete) {
          await ctx.db.delete(row._id);
        }
      }
    }

    // Insert or update per (game, date)
    let inserted = 0;
    for (const e of entries) {
      const existing = await ctx.db
        .query("nerdleschedules")
        .withIndex("by_game_date", (q) => q.eq("game", e.game).eq("date", e.date))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          period: e.period,
          wordId: e.wordId,
          displayName: e.displayName,
        });
      } else {
        await ctx.db.insert("nerdleschedules", {
          game: e.game,
          period: e.period,
          date: e.date,
          wordId: e.wordId,
          displayName: e.displayName,
        });
      }
      inserted++;
    }

    return inserted;
  },
});
