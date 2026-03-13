import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Register a new device for the current user.
 */
export const registerDevice = mutation({
  args: {
    deviceId: v.string(),
    deviceName: v.optional(v.string()),
    registrationId: v.number(),
    identityKey: v.string(), // Base64
    signedPreKey: v.object({
      id: v.number(),
      key: v.string(),
      signature: v.string(),
    }),
    oneTimePreKeys: v.array(v.object({
      id: v.number(),
      key: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Check if device already exists
    const existingKey = await ctx.db
      .query("encryptionKeys")
      .withIndex("by_user_device", (q) => q.eq("userId", user._id).eq("deviceId", args.deviceId))
      .unique();

    if (existingKey) {
      await ctx.db.patch(existingKey._id, {
        identityKey: args.identityKey,
        signedPreKey: args.signedPreKey,
        oneTimePreKeys: args.oneTimePreKeys,
        registrationId: args.registrationId,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("encryptionKeys", {
        userId: user._id,
        deviceId: args.deviceId,
        identityKey: args.identityKey,
        signedPreKey: args.signedPreKey,
        oneTimePreKeys: args.oneTimePreKeys,
        registrationId: args.registrationId,
        lastSeenAt: now,
      });
    }

    const existingDevice = await ctx.db
      .query("userDevices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("deviceId"), args.deviceId))
      .unique();

    if (existingDevice) {
      await ctx.db.patch(existingDevice._id, {
        deviceName: args.deviceName,
        lastActiveAt: now,
      });
    } else {
      await ctx.db.insert("userDevices", {
        userId: user._id,
        deviceId: args.deviceId,
        deviceName: args.deviceName,
        createdAt: now,
        lastActiveAt: now,
      });
    }
  },
});

/**
 * Get all devices and their public keys for a set of users.
 * Used for fan-out encryption.
 */
export const getUserDevicesAndKeys = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.userIds.map(async (userId) => {
        const keys = await ctx.db
          .query("encryptionKeys")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        return { userId, devices: keys };
      })
    );
    return results;
  },
});

/**
 * Fetch a specific device's key bundle.
 */
export const getDeviceKeyBundle = query({
  args: { userId: v.id("users"), deviceId: v.string() },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("encryptionKeys")
      .withIndex("by_user_device", (q) => q.eq("userId", args.userId).eq("deviceId", args.deviceId))
      .unique();
    
    if (!keys) return null;

    // In a real implementation, we would "consume" a one-time prekey.
    // For this prototype, we'll return the first one available.
    const oneTimePreKey = keys.oneTimePreKeys[0];

    return {
      registrationId: keys.registrationId,
      identityKey: keys.identityKey,
      signedPreKey: keys.signedPreKey,
      oneTimePreKey: oneTimePreKey || null,
    };
  },
});

/**
 * Get all devices for the current user.
 */
export const getMyDevices = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("userDevices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
