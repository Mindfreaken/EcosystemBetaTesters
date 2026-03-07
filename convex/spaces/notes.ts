import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const addNote = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        note: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!me) throw new Error("User not found");

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", me._id))
            .first();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin" && membership.role !== "moderator")) {
            throw new Error("Only staff can add notes");
        }

        return await ctx.db.insert("spaceMemberNotes", {
            spaceId: args.spaceId,
            userId: args.userId,
            authorId: me._id,
            note: args.note,
            createdAt: Date.now(),
        });
    },
});

export const getNotes = query({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!me) return [];

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", me._id))
            .first();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin" && membership.role !== "moderator")) {
            return []; // Only staff can view notes
        }

        const notes = await ctx.db
            .query("spaceMemberNotes")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .order("desc")
            .collect();

        // Enrich with author info
        return await Promise.all(
            notes.map(async (n) => {
                const author = await ctx.db.get(n.authorId);
                return {
                    ...n,
                    author: {
                        _id: author?._id,
                        displayName: author?.displayName || "Unknown",
                        avatarUrl: author?.avatarUrl,
                    },
                };
            })
        );
    },
});

export const deleteNote = mutation({
    args: {
        noteId: v.id("spaceMemberNotes"),
        spaceId: v.id("spaces"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!me) throw new Error("User not found");

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", me._id))
            .first();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin" && membership.role !== "moderator")) {
            throw new Error("Only staff can delete notes");
        }

        const note = await ctx.db.get(args.noteId);
        if (!note || note.spaceId !== args.spaceId) {
            throw new Error("Note not found or does not belong to this space");
        }

        // Optional: Ensure only the author, admin, or owner can delete it
        if (note.authorId !== me._id && membership.role === "moderator") {
            throw new Error("Moderators can only delete their own notes");
        }

        await ctx.db.delete(args.noteId);
    },
});
