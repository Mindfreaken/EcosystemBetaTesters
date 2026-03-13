import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ensureUserActive } from "../auth/helpers";
import { Id } from "../_generated/dataModel";

/**
 * Check if the current user has permission to manage roles in a space.
 */
async function ensureRoleManager(ctx: any, spaceId: Id<"spaces">) {
    const user = await ensureUserActive(ctx);
    const membership = await ctx.db
        .query("spaceMembers")
        .withIndex("by_space_user", (q: any) => q.eq("spaceId", spaceId).eq("userId", user._id))
        .unique();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
        throw new Error("Unauthorized: Only owners and admins can manage roles.");
    }
    return user;
}

export const createRole = mutation({
    args: {
        spaceId: v.id("spaces"),
        name: v.string(),
        color: v.string(),
        style: v.string(),
        gradientConfig: v.optional(v.object({
            color1: v.string(),
            color2: v.string(),
            angle: v.number(),
            isAnimated: v.boolean(),
        })),
        isHoisted: v.boolean(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);
        
        // Ensure order is at least 3 (giving space for system roles)
        const order = Math.max(args.order, 3);

        return await ctx.db.insert("spaceRoles", {
            ...args,
            order,
            createdAt: Date.now(),
        });
    },
});

export const reorderRoles = mutation({
    args: {
        spaceId: v.id("spaces"),
        roles: v.array(v.object({
            id: v.id("spaceRoles"),
            order: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);
        for (const r of args.roles) {
            const role = await ctx.db.get(r.id);
            if (role && !role.isSystem) {
                // Ensure order is at least 3
                const newOrder = Math.max(r.order, 3);
                await ctx.db.patch(r.id, { order: newOrder });
            }
        }
    },
});

export const updateRole = mutation({
    args: {
        id: v.id("spaceRoles"),
        name: v.optional(v.string()),
        color: v.optional(v.string()),
        style: v.optional(v.string()),
        gradientConfig: v.optional(v.object({
            color1: v.string(),
            color2: v.string(),
            angle: v.number(),
            isAnimated: v.boolean(),
        })),
        isHoisted: v.optional(v.boolean()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const role = await ctx.db.get(id);
        if (!role) throw new Error("Role not found");
        await ensureRoleManager(ctx, role.spaceId);

        // Don't allow changing order of system roles
        if (role.isSystem && updates.order !== undefined) {
            delete updates.order;
        }

        await ctx.db.patch(id, updates);
    },
});

export const deleteRole = mutation({
    args: { id: v.id("spaceRoles") },
    handler: async (ctx, args) => {
        const role = await ctx.db.get(args.id);
        if (!role) throw new Error("Role not found");
        await ensureRoleManager(ctx, role.spaceId);

        if (role.isSystem) {
            throw new Error("Cannot delete system roles (Owner, Admin, Moderator).");
        }

        // Remove all associations
        const associations = await ctx.db
            .query("spaceMemberRoles")
            .withIndex("by_role", (q) => q.eq("roleId", args.id))
            .collect();
        
        for (const assoc of associations) {
            await ctx.db.delete(assoc._id);
        }

        await ctx.db.delete(args.id);
    },
});

export const getSpaceRoles = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const roles = await ctx.db
            .query("spaceRoles")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        // If system roles are missing, we should ideally create them.
        // But since this is a query, we can't mutate.
        // We'll return the roles, and let the UI or a separate "ensure" mutation handle creation.
        // Actually, a better place is a mutation that is called when Entering/Managing roles.
        return roles;
    },
});

export const ensureSystemRoles = mutation({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);

        const systemRoles = [
            { key: "owner", name: "Owner", color: "#f59f00", order: 0 },
            { key: "admin", name: "Admin", color: "#3296fa", order: 1 },
            { key: "moderator", name: "Moderator", color: "#4dabf7", order: 2 },
        ];

        for (const sr of systemRoles) {
            const existing = await ctx.db
                .query("spaceRoles")
                .filter(q => q.and(
                    q.eq(q.field("spaceId"), args.spaceId),
                    q.eq(q.field("systemKey"), sr.key)
                ))
                .unique();

            if (!existing) {
                await ctx.db.insert("spaceRoles", {
                    spaceId: args.spaceId,
                    name: sr.name,
                    color: sr.color,
                    style: "solid",
                    isHoisted: true,
                    order: sr.order,
                    isSystem: true,
                    systemKey: sr.key,
                    createdAt: Date.now(),
                });
            }
        }
    }
});

export const assignRole = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        roleId: v.id("spaceRoles"),
    },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);

        const existing = await ctx.db
            .query("spaceMemberRoles")
            .withIndex("by_space_user_role", (q) => 
                q.eq("spaceId", args.spaceId)
                .eq("userId", args.userId)
                .eq("roleId", args.roleId)
            )
            .unique();

        if (existing) return;

        await ctx.db.insert("spaceMemberRoles", args);
    },
});

export const removeRole = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        roleId: v.id("spaceRoles"),
    },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);

        const existing = await ctx.db
            .query("spaceMemberRoles")
            .withIndex("by_space_user_role", (q) => 
                q.eq("spaceId", args.spaceId)
                .eq("userId", args.userId)
                .eq("roleId", args.roleId)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const getMemberRoles = query({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const associations = await ctx.db
            .query("spaceMemberRoles")
            .withIndex("by_space_user", (q) => 
                q.eq("spaceId", args.spaceId)
                .eq("userId", args.userId)
            )
            .collect();

        return await Promise.all(
            associations.map(async (a) => await ctx.db.get(a.roleId))
        );
    },
});

export const batchUpdateRoleMembers = mutation({
    args: {
        spaceId: v.id("spaces"),
        roleId: v.id("spaceRoles"),
        userIdsToAdd: v.array(v.id("users")),
        userIdsToRemove: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        await ensureRoleManager(ctx, args.spaceId);

        // Add roles
        for (const userId of args.userIdsToAdd) {
            const existing = await ctx.db
                .query("spaceMemberRoles")
                .withIndex("by_space_user_role", (q) =>
                    q.eq("spaceId", args.spaceId)
                    .eq("userId", userId)
                    .eq("roleId", args.roleId)
                )
                .unique();
            if (!existing) {
                await ctx.db.insert("spaceMemberRoles", {
                    spaceId: args.spaceId,
                    userId,
                    roleId: args.roleId,
                });
            }
        }

        // Remove roles
        for (const userId of args.userIdsToRemove) {
            const existing = await ctx.db
                .query("spaceMemberRoles")
                .withIndex("by_space_user_role", (q) =>
                    q.eq("spaceId", args.spaceId)
                    .eq("userId", userId)
                    .eq("roleId", args.roleId)
                )
                .unique();
            if (existing) {
                await ctx.db.delete(existing._id);
            }
        }
    },
});
