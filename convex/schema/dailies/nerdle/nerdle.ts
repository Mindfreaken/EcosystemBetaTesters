import { defineTable } from "convex/server";
import { v } from "convex/values";

// Nerdle game tables (migrated from convex/schema.ts)
export const nerdleTables = {
  englishWords: defineTable({
    word: v.string(),
  }).index("by_word", ["word"]),
  
  // Unified schedules table to store per-day words per game/period
  nerdleschedules: defineTable({
    game: v.string(), // e.g., "minecraft" | "valorant"
    period: v.string(), // e.g., "test", "beta", "season1"...
    date: v.string(), // YYYY-MM-DD
    wordId: v.number(),
    displayName: v.string(),
  })
    .index("by_game_date", ["game", "date"]) 
    .index("by_period_game_date", ["period", "game", "date"]),
  nerdleplays: defineTable({
    userId: v.id("users"),
    game: v.string(),
    date: v.string(),
    wordId: v.number(),
    status: v.string(), // "started" | "win" | "lose" | "dnf"
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    guesses: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    usedHint: v.optional(v.boolean()),
    guess1: v.optional(v.string()),
    guess2: v.optional(v.string()),
    guess3: v.optional(v.string()),
    guess4: v.optional(v.string()),
    guess5: v.optional(v.string()),
    guess6: v.optional(v.string()),
  })
    .index("by_user_game_date_word", ["userId", "game", "date", "wordId"])
    .index("by_user_date", ["userId", "date"]) 
    .index("by_game_date", ["game", "date"]),
} as const;
