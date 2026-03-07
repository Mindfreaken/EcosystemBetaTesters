import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Get the feed of all admin actions for a space.
 */
export const getAdminActions = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const actions = await ctx.db
            .query("spaceAdminActions")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .order("desc")
            .take(50);

        return await Promise.all(
            actions.map(async (a) => {
                const admin = await ctx.db.get(a.adminId);
                return { ...a, admin };
            })
        );
    },
});

/**
 * Get total action counts per admin for a space.
 */
export const getAdminActionStats = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const actions = await ctx.db
            .query("spaceAdminActions")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const stats: Record<string, { total: number; admin: any }> = {};
        for (const action of actions) {
            const adminId = action.adminId.toString();
            if (!stats[adminId]) {
                const admin = await ctx.db.get(action.adminId);
                stats[adminId] = { total: 0, admin };
            }
            stats[adminId].total++;
        }

        return Object.values(stats).sort((a, b) => b.total - a.total);
    },
});

/**
 * Get actions taken by a specific admin in a space.
 */
export const getActionsByAdmin = query({
    args: { spaceId: v.id("spaces"), adminId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("spaceAdminActions")
            .withIndex("by_space_admin", (q) => q.eq("spaceId", args.spaceId).eq("adminId", args.adminId))
            .order("desc")
            .collect();
    },
});

