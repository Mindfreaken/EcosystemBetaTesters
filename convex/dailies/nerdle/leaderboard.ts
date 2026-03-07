import { query } from "../../_generated/server";
import { v } from "convex/values";

// Aggregates per-user leaderboard stats for a given game and season date window.
// Implicit DNF rule: rows with status === 'started' and date < today are treated as DNF.
export const seasonStats = query({
  args: {
    game: v.string(),
    start: v.string(), // inclusive YYYY-MM-DD
    end: v.string(),   // inclusive YYYY-MM-DD
  },
  handler: async (ctx, { game, start, end }) => {
    // Fetch rows in date window by index by_game_date
    const rows = await ctx.db
      .query("nerdleplays")
      .withIndex("by_game_date", (q) => q.eq("game", game))
      .filter((q) => q.gte(q.field("date"), start))
      .filter((q) => q.lte(q.field("date"), end))
      .collect();

    // Today string for implicit DNF evaluation
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Group rows per user
    const byUser = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = r.userId as unknown as string;
      const arr = byUser.get(key);
      if (arr) arr.push(r);
      else byUser.set(key, [r]);
    }

    type Agg = {
      userId: string;
      wins: number;
      losses: number; // explicit losses + DNFs count here for WL ratio
      dnfs: number;   // explicit + implicit
      plays: number;  // total plays (rows)
      avgGuesses: number; // finished only (win/lose)
      currentStreak: number; // consecutive wins ending at latest played date in window
      wlRatio: number;
    };

    const result: Agg[] = [];

    for (const [userKey, list] of byUser.entries()) {
      // Sort by date ascending for streak calc
      list.sort((a, b) => a.date.localeCompare(b.date));

      let wins = 0;
      let losses = 0;
      let dnfs = 0;
      let finishedCount = 0;
      let guessesSum = 0;

      // Compute implicit DNFs and aggregates
      for (const row of list) {
        const isPast = row.date < todayStr;
        if (row.status === "win") {
          wins += 1;
          if (typeof row.guesses === "number") { guessesSum += row.guesses; finishedCount += 1; }
        } else if (row.status === "lose") {
          losses += 1;
          if (typeof row.guesses === "number") { guessesSum += row.guesses; finishedCount += 1; }
        } else if (row.status === "dnf") {
          dnfs += 1;
          losses += 1; // count dnf as loss for WL ratio
        } else if (row.status === "started") {
          if (isPast) {
            // Implicit DNF for past days
            dnfs += 1;
            losses += 1;
          }
        }
      }

      const plays = list.length;
      const avgGuesses = finishedCount > 0 ? guessesSum / finishedCount : 0;

      // Current streak: count trailing wins from latest played date until a non-win is found
      let currentStreak = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        const row = list[i];
        const isPast = row.date < todayStr;
        let status = row.status;
        if (status === "started" && isPast) status = "dnf"; // implicit
        if (status === "win") currentStreak += 1; else break;
      }

      const wlRatio = (losses > 0) ? wins / losses : wins;
      result.push({ userId: userKey, wins, losses, dnfs, plays, avgGuesses, currentStreak, wlRatio });
    }

    // Attach displayName by fetching user records
    const withNames = await Promise.all(
      result.map(async (r) => {
        // userId is an Id<"users"> at runtime; cast for get; cast record to any for flexible property access
        const user = (await ctx.db.get(r.userId as any)) as any;
        const displayName: string = (user?.displayName || user?.username || user?.email || "Unknown");
        return { ...r, displayName };
      })
    );

    // Sort: WL ratio desc, streak desc, avg guesses asc, wins desc
    withNames.sort((a, b) => {
      if (b.wlRatio !== a.wlRatio) return b.wlRatio - a.wlRatio;
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (a.avgGuesses !== b.avgGuesses) return a.avgGuesses - b.avgGuesses;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.plays - a.plays);
    });

    return withNames;
  },
});
