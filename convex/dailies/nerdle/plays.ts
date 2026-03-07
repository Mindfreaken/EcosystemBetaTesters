import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: {
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
  },
  handler: async (ctx, { game, date, wordId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_game_date_word", (q) => q.eq("userId", user._id).eq("game", game).eq("date", date).eq("wordId", wordId))
      .first();

    const now = Date.now();
    if (existing) {
      if (existing.status === "started") return existing._id;
      return existing._id;
    }

    const id = await ctx.db.insert("nerdleplays", {
      userId: user._id,
      game,
      date,
      wordId,
      status: "started",
      startedAt: now,
      usedHint: false,
    });
    return id;
  },
});

// In-progress updates
export const progress = mutation({
  args: {
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
    guesses: v.number(),
    usedHint: v.optional(v.boolean()),
    guessIndex: v.optional(v.number()), // 0-based row index
    guessText: v.optional(v.string()),  // normalized guess text
  },
  handler: async (ctx, { game, date, wordId, guesses, usedHint, guessIndex, guessText }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const row = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_game_date_word", (q) => q.eq("userId", user._id).eq("game", game).eq("date", date).eq("wordId", wordId))
      .first();

    const now = Date.now();
    if (!row) {
      // If no row, create a started row and set guesses
      const id = await ctx.db.insert("nerdleplays", {
        userId: user._id,
        game,
        date,
        wordId,
        status: "started",
        startedAt: now,
        guesses,
        usedHint: !!usedHint,
        ...(guessIndex === 0 && guessText ? { guess1: guessText } : {}),
      });
      return id;
    }

    // Only update in-progress games
    if (row.status === "started") {
      const patch: any = {
        guesses,
        usedHint: usedHint === undefined ? row.usedHint : !!usedHint,
      };
      if (typeof guessIndex === 'number' && guessText) {
        const key = (['guess1', 'guess2', 'guess3', 'guess4', 'guess5', 'guess6'] as const)[Math.max(0, Math.min(5, guessIndex))];
        patch[key] = guessText;
      }
      await ctx.db.patch(row._id, patch);
    }
    return row._id;
  },
});

export const getPlay = query({
  args: {
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
  },
  handler: async (ctx, { game, date, wordId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) return null;
    const row = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_game_date_word", (q) => q.eq("userId", user._id).eq("game", game).eq("date", date).eq("wordId", wordId))
      .first();
    return row ?? null;
  },
});

export const backfillDNFs = mutation({
  args: {
    today: v.string(), // YYYY-MM-DD in user's local timezone computed client-side
  },
  handler: async (ctx, { today }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Find plays for prior dates still in 'started'
    const candidates = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    let updated = 0;
    for (const row of candidates) {
      if (row.date < today && row.status === "started") {
        const finishedAt = now;
        const startedAt = row.startedAt ?? now;
        const durationMs = Math.max(0, finishedAt - startedAt);
        await ctx.db.patch(row._id, {
          status: "dnf",
          finishedAt,
          durationMs,
        });
        updated++;
      }
    }
    return { updated };
  },
});

export const finish = mutation({
  args: {
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
    win: v.boolean(),
    guesses: v.number(),
    usedHint: v.boolean(),
    lastGuessIndex: v.optional(v.number()), // 0-based
    lastGuessText: v.optional(v.string()),
  },
  handler: async (ctx, { game, date, wordId, win, guesses, usedHint, lastGuessIndex, lastGuessText }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const row = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_game_date_word", (q) => q.eq("userId", user._id).eq("game", game).eq("date", date).eq("wordId", wordId))
      .first();

    const now = Date.now();
    if (!row) {
      const id = await ctx.db.insert("nerdleplays", {
        userId: user._id,
        game,
        date,
        wordId,
        status: win ? "win" : "lose",
        startedAt: now,
        finishedAt: now,
        guesses,
        durationMs: 0,
        usedHint,
        ...(typeof lastGuessIndex === 'number' && lastGuessText
          ? { [(['guess1', 'guess2', 'guess3', 'guess4', 'guess5', 'guess6'] as const)[Math.max(0, Math.min(5, lastGuessIndex))]]: lastGuessText }
          : {}),
      });
      return id;
    }

    const finishedAt = now;
    const startedAt = row.startedAt ?? now;
    const durationMs = Math.max(0, finishedAt - startedAt);

    const patch: any = {
      status: win ? "win" : "lose",
      finishedAt,
      guesses,
      durationMs,
      usedHint: !!usedHint,
    };
    if (typeof lastGuessIndex === 'number' && lastGuessText) {
      const key = (['guess1', 'guess2', 'guess3', 'guess4', 'guess5', 'guess6'] as const)[Math.max(0, Math.min(5, lastGuessIndex))];
      patch[key] = lastGuessText;
    }
    await ctx.db.patch(row._id, patch);
    return row._id;
  },
});

export const dnf = mutation({
  args: {
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
    usedHint: v.boolean(),
    guesses: v.number(),
  },
  handler: async (ctx, { game, date, wordId, usedHint, guesses }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const row = await ctx.db
      .query("nerdleplays")
      .withIndex("by_user_game_date_word", (q) => q.eq("userId", user._id).eq("game", game).eq("date", date).eq("wordId", wordId))
      .first();

    const now = Date.now();
    if (!row) {
      // Do not create a new row for DNF if a play doesn't exist.
      // This avoids race conditions where unmount happens before start.
      return null as any;
    }

    const finishedAt = now;
    const startedAt = row.startedAt ?? now;
    const durationMs = Math.max(0, finishedAt - startedAt);

    await ctx.db.patch(row._id, {
      status: "dnf",
      finishedAt,
      durationMs,
      usedHint: !!usedHint,
      guesses,
    });
    return row._id;
  },
});
