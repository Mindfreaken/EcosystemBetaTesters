import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";
import { SPACE_ASSISTANT_ID } from "./constants";

export const getPolls = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) throw new Error("Not authenticated");

        const polls = await ctx.db
            .query("spacePolls")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .order("desc")
            .collect();

        return await Promise.all(
            polls.map(async (poll) => {
                const creator = await ctx.db.get(poll.creatorId);
                const votes = await ctx.db
                    .query("spacePollVotes")
                    .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
                    .collect();

                // My vote
                const myVote = votes.find(v => v.userId === user._id);

                return {
                    ...poll,
                    creator,
                    totalVotes: votes.length,
                    votes: poll.options.map((_, idx) => votes.filter(v => (v as any).optionIndices?.includes(idx)).length),
                    myVoteIndices: (myVote as any)?.optionIndices || [],
                };
            })
        );
    },
});

export const createPoll = mutation({
    args: {
        spaceId: v.id("spaces"),
        question: v.string(),
        options: v.array(v.string()),
        allowMultiSelect: v.boolean(),
        showInAnnouncements: v.boolean(),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found");

        if (!member || !["owner", "admin", "moderator"].includes(member.role)) {
            throw new Error("Unauthorized");
        }

        // Check specific staff permission for admins/mods
        if (member.role === "admin" && space.adminCanCreatePolls === false) throw new Error("Unauthorized");
        if (member.role === "moderator" && !space.modCanCreatePolls) throw new Error("Unauthorized");

        const pollId = await ctx.db.insert("spacePolls", {
            spaceId: args.spaceId,
            creatorId: user._id,
            question: args.question,
            options: args.options,
            allowMultiSelect: args.allowMultiSelect,
            showInAnnouncements: args.showInAnnouncements,
            createdAt: Date.now(),
            expiresAt: args.expiresAt,
        });

        // Ensure a polls channel exists
        const allChannels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const hasPollsChannel = allChannels.some(c => c.type === "polls");
        if (!hasPollsChannel) {
            await ctx.db.insert("spaceChannels", {
                spaceId: args.spaceId,
                name: "polls",
                type: "polls",
                description: "Cast your votes on community polls.",
                channelOrder: allChannels.length,
                createdAt: Date.now(),
            });
        }

        // Assistant Announcement
        if (args.showInAnnouncements) {
            const allChannels = await ctx.db
                .query("spaceChannels")
                .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
                .collect();

            const announcementsChannel = allChannels.find(c => c.name.toLowerCase() === "announcements");
            let assistant = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", SPACE_ASSISTANT_ID))
                .unique();

            if (announcementsChannel && assistant) {
                await ctx.db.insert("spaceChannelMessages", {
                    channelId: announcementsChannel._id,
                    senderId: assistant._id,
                    content: `📊 **New Poll: ${args.question}**\n\n${args.options.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}\n\n*Check the #polls channel to cast your vote!*`,
                    createdAt: Date.now(),
                });
            }
        }

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "create_poll",
            details: `Created poll: ${args.question}`,
            timestamp: Date.now(),
        });

        return pollId;
    },
});

export const vote = mutation({
    args: {
        pollId: v.id("spacePolls"),
        optionIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        const poll = await ctx.db.get(args.pollId);
        if (!poll) throw new Error("Poll not found");

        if (poll.expiresAt && Date.now() > poll.expiresAt) {
            throw new Error("Poll has expired");
        }

        const existingVote = await ctx.db
            .query("spacePollVotes")
            .withIndex("by_poll_user", (q) => q.eq("pollId", args.pollId).eq("userId", user._id))
            .unique();

        if (existingVote) {
            let newIndices = [...(existingVote as any).optionIndices];
            if (poll.allowMultiSelect) {
                if (newIndices.includes(args.optionIndex)) {
                    throw new Error("You have already voted for this option");
                } else {
                    newIndices.push(args.optionIndex);
                }
            } else {
                throw new Error("You have already voted in this poll");
            }

            await ctx.db.patch(existingVote._id, {
                optionIndices: newIndices,
                createdAt: Date.now(),
            });
        } else {
            await ctx.db.insert("spacePollVotes", {
                pollId: args.pollId,
                userId: user._id,
                optionIndices: [args.optionIndex],
                createdAt: Date.now(),
            });
        }
    },
});

export const deletePoll = mutation({
    args: { pollId: v.id("spacePolls") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const poll = await ctx.db.get(args.pollId);
        if (!poll) throw new Error("Poll not found");

        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", poll.spaceId).eq("userId", user._id))
            .unique();

        if (!member || !["owner", "admin"].includes(member.role)) {
            // Creators can delete their own polls
            if (poll.creatorId !== user._id) {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.delete(args.pollId);

        // Delete associated votes
        const votes = await ctx.db
            .query("spacePollVotes")
            .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
            .collect();

        for (const vote of votes) {
            await ctx.db.delete(vote._id);
        }

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: poll.spaceId,
            adminId: user._id,
            actionType: "delete_poll",
            details: `Deleted poll: ${poll.question}`,
            timestamp: Date.now(),
        });
    },
});
