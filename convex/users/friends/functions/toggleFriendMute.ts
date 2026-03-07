import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { api } from "../../../_generated/api";

// Toggle friend mute status
export const toggleFriendMute = mutation({
  args: {
    friendshipId: v.id("friends"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    const nextMuted = !friendship.isMuted;

    // Update social score via punishments system
    try {
      // Ensure punishment types (mute) exist
      await ctx.runMutation(api.community.punishments.initializePunishmentTypes, {});

      // Acting user (who toggles mute) and target (friend)
      const actingUserId = friendship.userId;
      const targetUserId = friendship.friendId;

      // Fetch 'mute' punishment type
      const muteType = await ctx.db
        .query("punishmentTypes")
        .withIndex("by_name", (q) => q.eq("name", "mute"))
        .first();

      if (muteType) {
        if (nextMuted) {
          // Apply a mute punishment to the friend (affects social score)
          await ctx.runMutation(api.community.punishments.applyPunishment, {
            userId: actingUserId,
            punishmentTypeId: muteType._id,
            targetUserId,
            affectSocialScore: true,
            endAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        } else {
          // Deactivate any active mute punishments applied by this user to this friend and restore points
          const activeMutes = await ctx.db
            .query("userPunishments")
            .withIndex("by_type_and_user", (q) =>
              q.eq("punishmentTypeId", muteType._id).eq("userId", targetUserId)
            )
            .filter((q) =>
              q.and(
                q.eq(q.field("appliedById"), actingUserId),
                q.eq(q.field("active"), true)
              )
            )
            .collect();

          for (const p of activeMutes) {
            await ctx.runMutation(api.community.punishments.deactivatePunishment, {
              punishmentId: p._id,
              restorePoints: true,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Mute toggle punishment handling failed:", e);
    }

    await ctx.db.patch(args.friendshipId, {
      isMuted: nextMuted,
    });
    return null;
  },
});
