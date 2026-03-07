import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getByDate = query({
  args: {
    game: v.string(),
    date: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      game: v.string(),
      date: v.string(),
      wordId: v.number(),
      displayName: v.string(),
    })
  ),
  handler: async (ctx, { game, date }) => {
    const row = await ctx.db
      .query("nerdleschedules")
      .withIndex("by_game_date", (q) => q.eq("game", game).eq("date", date))
      .first();
    if (!row) return null;
    return {
      game: row.game,
      date: row.date,
      wordId: row.wordId,
      displayName: row.displayName,
    };
  },
});
