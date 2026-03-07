import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Track a user's view of a space.
 */
export const trackSpaceView = mutation({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return;

        const now = Date.now();
        const date = new Date(now);
        const day = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const month = day.substring(0, 7); // YYYY-MM

        // Daily
        const existingDaily = await ctx.db
            .query("spaceDailyActive")
            .withIndex("by_day_user", (q) => q.eq("spaceId", args.spaceId).eq("day", day).eq("userId", user._id))
            .unique();
        if (!existingDaily) {
            await ctx.db.insert("spaceDailyActive", {
                spaceId: args.spaceId,
                userId: user._id,
                day,
                createdAt: now,
            });
        }

        // Monthly
        const existingMonthly = await ctx.db
            .query("spaceMonthlyActive")
            .withIndex("by_month_user", (q) => q.eq("spaceId", args.spaceId).eq("month", month).eq("userId", user._id))
            .unique();
        if (!existingMonthly) {
            await ctx.db.insert("spaceMonthlyActive", {
                spaceId: args.spaceId,
                userId: user._id,
                month,
                createdAt: now,
            });
        }
    },
});

/**
 * Get space analytics (DAU/MAU).
 */
export const getSpaceStats = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const date = new Date(now);
        const day = date.toISOString().split("T")[0];
        const month = day.substring(0, 7);

        const dailyCount = await ctx.db
            .query("spaceDailyActive")
            .withIndex("by_day", (q) => q.eq("spaceId", args.spaceId).eq("day", day))
            .collect();

        const monthlyCount = await ctx.db
            .query("spaceMonthlyActive")
            .withIndex("by_month", (q) => q.eq("spaceId", args.spaceId).eq("month", month))
            .collect();

        return {
            dailyActive: dailyCount.length,
            monthlyActive: monthlyCount.length,
        };
    },
});

