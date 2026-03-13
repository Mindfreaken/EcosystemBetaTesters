import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Signal Protocol Keys & Device Management
 * 
 * encryptionKeys: Stores public keys for each device.
 * userDevices: Tracks devices registered to a user.
 */

export const keyTables = {
  encryptionKeys: defineTable({
    userId: v.id("users"),
    deviceId: v.string(), // Unique per browser instance
    identityKey: v.string(), // Base64 encoded public identity key
    signedPreKey: v.object({
      id: v.number(),
      key: v.string(), // Base64
      signature: v.string(), // Base64
    }),
    oneTimePreKeys: v.array(v.object({
      id: v.number(),
      key: v.string(), // Base64
    })),
    registrationId: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"])
    .index("by_user_device", ["userId", "deviceId"]),

  userDevices: defineTable({
    userId: v.id("users"),
    deviceId: v.string(),
    deviceName: v.optional(v.string()), // e.g., "Chrome on Windows"
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"]),
} as const;
