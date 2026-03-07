import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { ensureUserActive } from "../auth/helpers";

export const getSettings = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("settings"),
    _creationTime: v.number(),
    userId: v.optional(v.id("users")),
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    language: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    showCallsInHeader: v.optional(v.boolean()),
    useThemeColorForRage: v.optional(v.boolean()),
    nerdleKeyboardHintDismissed: v.optional(v.boolean()),
    disableThemeVoteConfirm: v.optional(v.boolean()),
    preferredMicrophoneId: v.optional(v.string()),
    preferredCameraId: v.optional(v.string()),
    preferredSpeakerId: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const result = await ctx.db
      .query("settings")
      .withIndex("by_clerk_id_unique", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!result) return null;
    return {
      _id: result._id,
      _creationTime: result._creationTime,
      userId: result.userId,
      theme: result.theme,
      notifications: result.notifications,
      language: result.language,
      clerkUserId: result.clerkUserId,
      updatedAt: result.updatedAt,
      showCallsInHeader: result.showCallsInHeader,
      useThemeColorForRage: result.useThemeColorForRage,
      nerdleKeyboardHintDismissed: result.nerdleKeyboardHintDismissed,
      disableThemeVoteConfirm: result.disableThemeVoteConfirm,
      preferredMicrophoneId: result.preferredMicrophoneId,
      preferredCameraId: result.preferredCameraId,
      preferredSpeakerId: result.preferredSpeakerId,
    };
  },
});

export const setTheme = mutation({
  args: {
    theme: v.string(),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { theme, updatedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized: missing Clerk identity");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_clerk_id_unique", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { theme, updatedAt });
    } else {
      await ctx.db.insert("settings", { clerkUserId: identity.subject, theme, updatedAt });
    }
    return null;
  },
});

export const updateCallNotificationPreference = mutation({
  args: {
    showCallsInHeader: v.boolean(),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { showCallsInHeader, updatedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized: missing Clerk identity");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_clerk_id_unique", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { showCallsInHeader, updatedAt });
    } else {
      await ctx.db.insert("settings", { clerkUserId: identity.subject, showCallsInHeader, updatedAt });
    }
    return null;
  },
});

export const updateSettings = mutation({
  args: {
    settings: v.object({
      theme: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
      language: v.optional(v.string()),
      showCallsInHeader: v.optional(v.boolean()),
      useThemeColorForRage: v.optional(v.boolean()),
      nerdleKeyboardHintDismissed: v.optional(v.boolean()),
      disableThemeVoteConfirm: v.optional(v.boolean()),
      preferredMicrophoneId: v.optional(v.string()),
      preferredCameraId: v.optional(v.string()),
      preferredSpeakerId: v.optional(v.string()),
    })
  },
  returns: v.null(),
  handler: async (ctx, { settings }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("updateSettings: missing Clerk identity");
      throw new Error("Unauthorized");
    }

    console.log(`Updating settings for Clerk user ${identity.subject}:`, settings);
    const updatedAt = Date.now();

    try {
      const row = await ctx.db
        .query("settings")
        .withIndex("by_clerk_id_unique", (q) => q.eq("clerkUserId", identity.subject))
        .first();

      if (row) {
        console.log(`Found existing settings for Clerk user ${identity.subject}, updating...`);
        await ctx.db.patch(row._id, { ...settings, updatedAt });
        console.log(`Settings updated for Clerk user ${identity.subject}`);
      } else {
        console.log(`No existing settings found for Clerk user ${identity.subject}, creating new entry...`);
        await ctx.db.insert("settings", { clerkUserId: identity.subject, ...settings, updatedAt });
        console.log(`New settings created for Clerk user ${identity.subject}`);
      }
      return null;
    } catch (error) {
      console.error(`Error updating settings for Clerk user ${identity.subject}:`, error);
      throw error;
    }
  },
});

export const getVoiceVolumes = query({
  args: {},
  handler: async (ctx) => {
    const user = await ensureUserActive(ctx).catch(() => null);
    if (!user) return [];
    return await ctx.db
      .query("userVoiceSettings")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const setVoiceVolume = mutation({
  args: {
    targetUserId: v.string(),
    volume: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ensureUserActive(ctx);
    const existing = await ctx.db
      .query("userVoiceSettings")
      .withIndex("by_owner_target", (q) =>
        q.eq("ownerId", user._id).eq("targetUserId", args.targetUserId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { volume: args.volume, lastUpdated: Date.now() });
    } else {
      await ctx.db.insert("userVoiceSettings", {
        ownerId: user._id,
        targetUserId: args.targetUserId,
        volume: args.volume,
        lastUpdated: Date.now(),
      });
    }
  },
});