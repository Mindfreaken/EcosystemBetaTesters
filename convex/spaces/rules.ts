import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Get all rules for a specific space.
 */
export const getRules = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("spaceRules")
            .withIndex("by_space_order", (q) => q.eq("spaceId", args.spaceId))
            .collect();
    },
});

/**
 * Add a new rule to a space.
 */
export const addRule = mutation({
    args: {
        spaceId: v.id("spaces"),
        title: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only owners and admins can add rules.");
        }

        const existingRules = await ctx.db
            .query("spaceRules")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const newRuleId = await ctx.db.insert("spaceRules", {
            spaceId: args.spaceId,
            title: args.title,
            description: args.description,
            order: existingRules.length,
            createdAt: Date.now(),
        });

        return newRuleId;
    },
});

/**
 * Update an existing rule.
 */
export const updateRule = mutation({
    args: {
        ruleId: v.id("spaceRules"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const rule = await ctx.db.get(args.ruleId);
        if (!rule) throw new Error("Rule not found.");

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", rule.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only owners and admins can update rules.");
        }

        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;

        await ctx.db.patch(args.ruleId, updates);
    },
});

/**
 * Delete a rule.
 */
export const deleteRule = mutation({
    args: { ruleId: v.id("spaceRules") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const rule = await ctx.db.get(args.ruleId);
        if (!rule) throw new Error("Rule not found.");

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", rule.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only owners and admins can delete rules.");
        }

        await ctx.db.delete(args.ruleId);

        // Re-order remaining rules
        const remainingRules = await ctx.db
            .query("spaceRules")
            .withIndex("by_space_order", (q) => q.eq("spaceId", rule.spaceId))
            .collect();

        for (let i = 0; i < remainingRules.length; i++) {
            await ctx.db.patch(remainingRules[i]._id, { order: i });
        }
    },
});

/**
 * Reorder rules.
 */
export const reorderRules = mutation({
    args: {
        spaceId: v.id("spaces"),
        rules: v.array(v.object({
            id: v.id("spaceRules"),
            order: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only owners and admins can reorder rules.");
        }

        for (const r of args.rules) {
            await ctx.db.patch(r.id, { order: r.order });
        }
    },
});
