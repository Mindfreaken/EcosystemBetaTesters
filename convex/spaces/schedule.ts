import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

export const getEvents = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) throw new Error("Not authenticated");

        // Fetch events for this space, ordered by startTime
        const events = await ctx.db
            .query("spaceEvents")
            .withIndex("by_space_time", q => q.eq("spaceId", args.spaceId))
            .collect();

        return events;
    },
});

import { SPACE_ASSISTANT_ID } from "./constants";

export const createEvent = mutation({
    args: {
        spaceId: v.id("spaces"),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        showInAnnouncements: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", q => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!member || !["owner", "admin", "moderator"].includes(member.role)) {
            throw new Error("Unauthorized to create events");
        }

        const eventId = await ctx.db.insert("spaceEvents", {
            spaceId: args.spaceId,
            creatorId: user._id,
            title: args.title,
            description: args.description,
            startTime: args.startTime,
            endTime: args.endTime,
            showInAnnouncements: args.showInAnnouncements,
            createdAt: Date.now(),
        });

        // 1. Ensure a schedule channel exists
        const allChannels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", q => q.eq("spaceId", args.spaceId))
            .collect();

        const hasScheduleChannel = allChannels.some(c => c.type === "schedule");
        if (!hasScheduleChannel) {
            await ctx.db.insert("spaceChannels", {
                spaceId: args.spaceId,
                name: "schedule",
                type: "schedule",
                description: "Automated schedule and events channel.",
                channelOrder: allChannels.length,
                createdAt: Date.now(),
            });
        }

        // 2. Find or create Space Assistant user
        let assistant = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", q => q.eq("clerkUserId", SPACE_ASSISTANT_ID))
            .unique();

        if (!assistant) {
            const assistantId = await ctx.db.insert("users", {
                clerkUserId: SPACE_ASSISTANT_ID,
                username: "assistant",
                displayName: "Space Assistant",
                email: "assistant@ecosystem.app",
                role: "assistant",
                avatarUrl: "/avatars/default/default_001.jpg",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                overseeradmin: true,
                isBanned: false,
                storageStatus: 'free',
                totalStorageAllocatedGB: 0,
                currentStorageUsedGB: 0
            });
            assistant = await ctx.db.get(assistantId);
        }

        // 3. Post announcement to #announcements if it exists and showInAnnouncements is true
        const announcementsChannel = allChannels.find(c => c.name.toLowerCase() === "announcements");
        if (announcementsChannel && assistant && args.showInAnnouncements) {
            await ctx.db.insert("spaceChannelMessages", {
                channelId: announcementsChannel._id,
                senderId: assistant._id,
                content: `📅 **New Event Scheduled: ${args.title}**\n\n${args.description ? `${args.description}\n\n` : ""}*Check the #schedule channel for more details!*`,
                createdAt: Date.now(),
            });
        }

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "create_event",
            details: `Created schedule event: ${args.title}`,
            timestamp: Date.now(),
        });

        return eventId;
    },
});

export const updateEvent = mutation({
    args: {
        eventId: v.id("spaceEvents"),
        spaceId: v.id("spaces"),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", q => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!member || !["owner", "admin", "moderator"].includes(member.role)) {
            throw new Error("Unauthorized to update events");
        }

        await ctx.db.patch(args.eventId, {
            title: args.title,
            description: args.description,
            startTime: args.startTime,
            endTime: args.endTime,
        });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "update_event",
            details: `Updated schedule event: ${args.title}`,
            timestamp: Date.now(),
        });
    },
});

export const deleteEvent = mutation({
    args: {
        eventId: v.id("spaceEvents"),
        spaceId: v.id("spaces"),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", q => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!member || !["owner", "admin", "moderator"].includes(member.role)) {
            throw new Error("Unauthorized to delete events");
        }

        const event = await ctx.db.get(args.eventId);
        if (event) {
            await ctx.db.delete(args.eventId);

            // Log the action
            await ctx.db.insert("spaceAdminActions", {
                spaceId: args.spaceId,
                adminId: user._id,
                actionType: "delete_event",
                details: `Deleted schedule event: ${event.title}`,
                timestamp: Date.now(),
            });
        }
    },
});
