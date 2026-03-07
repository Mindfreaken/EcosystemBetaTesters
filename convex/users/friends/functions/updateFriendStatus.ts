import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { api, internal } from "../../../_generated/api";

// Update friend status (block/unblock/remove)
export const updateFriendStatus = mutation({
  args: {
    friendshipId: v.id("friends"),
    status: v.union(
      v.literal("active"),
      v.literal("blocked"),
      v.literal("removed")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    // Get the previous status to handle special cases
    const previousStatus = friendship.status;
    
    // Special handling for unblocking (changing from blocked to active/removed)
    if (previousStatus === "blocked" && args.status !== "blocked") {
      // Check if there's still an active ban punishment APPLIED BY THIS USER to the friend
      const banPunishmentType = await ctx.db
        .query("punishmentTypes")
        .withIndex("by_name", q => q.eq("name", "ban"))
        .first();

      let activeBan: any = null;

      if (banPunishmentType) {
        activeBan = await ctx.db
          .query("userPunishments")
          .withIndex("by_type_and_user", q =>
            q.eq("punishmentTypeId", banPunishmentType._id).eq("userId", friendship.friendId)
          )
          .filter(q =>
            q.and(
              q.eq(q.field("appliedById"), friendship.userId),
              q.eq(q.field("active"), true)
            )
          )
          .first();
      }

      if (activeBan) {
        // Deactivate the ban so sync logic won't re-block; restore points
        await ctx.runMutation(api.community.punishments.deactivatePunishment, {
          punishmentId: activeBan._id,
          restorePoints: true,
        });
      }

      // Also deactivate any active 'mute' and 'unfriend' punishments from this user to the friend
      try {
        const typeNames = ["mute", "unfriend"];
        for (const typeName of typeNames) {
          const pType = await ctx.db
            .query("punishmentTypes")
            .withIndex("by_name", q => q.eq("name", typeName))
            .first();
          if (!pType) continue;
          const activeP = await ctx.db
            .query("userPunishments")
            .withIndex("by_type_and_user", q =>
              q.eq("punishmentTypeId", pType._id).eq("userId", friendship.friendId)
            )
            .filter(q => q.and(
              q.eq(q.field("appliedById"), friendship.userId),
              q.eq(q.field("active"), true)
            ))
            .collect();
          for (const p of activeP) {
            await ctx.runMutation(api.community.punishments.deactivatePunishment, {
              punishmentId: p._id,
              restorePoints: true,
            });
          }
        }
      } catch (e) {
        console.warn("Failed to deactivate auxiliary punishments on unban:", e);
      }
    }

    // Update the initiating user's friendship
    await ctx.db.patch(args.friendshipId, {
      status: args.status,
    });

    // Find and update the reciprocal friendship
    const otherSideFriendship = await ctx.db
      .query("friends")
      .withIndex("by_user_and_friend", q => 
        q.eq("userId", friendship.friendId).eq("friendId", friendship.userId)
      )
      .first();

    if (otherSideFriendship) {
      await ctx.db.patch(otherSideFriendship._id, {
        status: args.status,
      });
    } else {
      console.warn(`Reciprocal friendship not found between ${friendship.userId} and ${friendship.friendId}`);
    }

    // If unblocking to active, recreate follow relationships in both directions
    if (previousStatus === "blocked" && args.status === "active") {
      try {
        // Ensure user follows friend
        const userFollowsFriend = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", q =>
            q.eq("followerId", friendship.userId).eq("followingId", friendship.friendId)
          )
          .first();
        if (!userFollowsFriend) {
          await ctx.db.insert("follows", {
            followerId: friendship.userId,
            followingId: friendship.friendId,
            createdAt: Date.now(),
          });
        }

        // Ensure friend follows user
        const friendFollowsUser = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", q =>
            q.eq("followerId", friendship.friendId).eq("followingId", friendship.userId)
          )
          .first();
        if (!friendFollowsUser) {
          await ctx.db.insert("follows", {
            followerId: friendship.friendId,
            followingId: friendship.userId,
            createdAt: Date.now(),
          });
        }
      } catch (e) {
        console.warn("Failed to recreate follow relationships on unblock:", e);
      }
    }

    // If status is blocked, delete DM chat and messages
    if (args.status === "blocked") {
      await ctx.runMutation(internal.chat.functions.dm.deleteDmChatAndMessages, {
        userId: friendship.userId,
        blockedUserId: friendship.friendId
      });

      // Apply a 'ban' punishment to affect the friend's social score
      try {
        // Ensure default punishment types (ban/mute) exist
        await ctx.runMutation(api.community.punishments.initializePunishmentTypes, {});
        const banType = await ctx.db
          .query("punishmentTypes")
          .withIndex("by_name", q => q.eq("name", "ban"))
          .first();
        if (banType) {
          await ctx.runMutation(api.community.punishments.applyPunishment, {
            userId: friendship.userId,          // who applied the block
            punishmentTypeId: banType._id,      // ban type
            targetUserId: friendship.friendId,  // the friend being blocked
            affectSocialScore: true,
            endAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
          });
        }
      } catch (e) {
        console.warn("Failed to apply ban punishment on block:", e);
      }

      // Ensure only 'ban' counts: deactivate any existing 'mute' or 'unfriend' punishments applied by this user to this friend
      try {
        const typeNames = ["mute", "unfriend"];
        for (const typeName of typeNames) {
          const pType = await ctx.db
            .query("punishmentTypes")
            .withIndex("by_name", q => q.eq("name", typeName))
            .first();
          if (!pType) continue;
          const activeP = await ctx.db
            .query("userPunishments")
            .withIndex("by_type_and_user", q =>
              q.eq("punishmentTypeId", pType._id).eq("userId", friendship.friendId)
            )
            .filter(q => q.and(
              q.eq(q.field("appliedById"), friendship.userId),
              q.eq(q.field("active"), true)
            ))
            .collect();
          for (const p of activeP) {
            await ctx.runMutation(api.community.punishments.deactivatePunishment, {
              punishmentId: p._id,
              restorePoints: true,
            });
          }
        }
      } catch (e) {
        console.warn("Failed to deactivate non-ban punishments on block:", e);
      }

      // Remove follow relationships in both directions upon block
      try {
        // Delete follow from user to blocked friend
        const userToFriendFollowOnBlock = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", q =>
            q.eq("followerId", friendship.userId).eq("followingId", friendship.friendId)
          )
          .first();
        if (userToFriendFollowOnBlock) {
          await ctx.db.delete(userToFriendFollowOnBlock._id);
        }

        // Delete follow from blocked friend to user
        const friendToUserFollowOnBlock = await ctx.db
          .query("follows")
          .withIndex("by_follower_following", q =>
            q.eq("followerId", friendship.friendId).eq("followingId", friendship.userId)
          )
          .first();
        if (friendToUserFollowOnBlock) {
          await ctx.db.delete(friendToUserFollowOnBlock._id);
        }
      } catch (e) {
        console.warn("Failed to remove follow relationships on block:", e);
      }
    }

    // If status is removed, also remove follow relationships in both directions
    if (args.status === "removed") {
      // Find and delete follows from user to friend
      const userToFriendFollow = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", q => 
          q.eq("followerId", friendship.userId).eq("followingId", friendship.friendId)
        )
        .first();
      
      if (userToFriendFollow) {
        await ctx.db.delete(userToFriendFollow._id);
      }

      // Find and delete follows from friend to user
      const friendToUserFollow = await ctx.db
        .query("follows")
        .withIndex("by_follower_following", q => 
          q.eq("followerId", friendship.friendId).eq("followingId", friendship.userId)
        )
        .first();
      
      if (friendToUserFollow) {
        await ctx.db.delete(friendToUserFollow._id);
      }

      // Apply a small social score penalty for being unfriended
      try {
        // Ensure an 'unfriend' punishment type exists (low impact)
        let unfriendType = await ctx.db
          .query("punishmentTypes")
          .withIndex("by_name", q => q.eq("name", "unfriend"))
          .first();
        if (!unfriendType) {
          const newTypeId = await ctx.runMutation(api.community.punishments.addPunishmentType, {
            name: "unfriend",
            description: "User was unfriended",
            newPointValue: undefined as any, // placeholder; will be ignored
          } as any).catch(async () => {
            // Fallback: some versions of addPunishmentType expect { name, description, pointValue }
            return await ctx.runMutation(api.community.punishments.addPunishmentType, {
              name: "unfriend",
              description: "User was unfriended",
              pointValue: 5,
            } as any);
          });
          // After creation, fetch it
          unfriendType = await ctx.db
            .query("punishmentTypes")
            .withIndex("by_name", q => q.eq("name", "unfriend"))
            .first();
        }

        if (unfriendType) {
          await ctx.runMutation(api.community.punishments.applyPunishment, {
            userId: friendship.userId,
            punishmentTypeId: unfriendType._id,
            targetUserId: friendship.friendId,
            affectSocialScore: true,
            endAt: Date.now() + 72 * 60 * 60 * 1000, // 72 hours
          });
        }
      } catch (e) {
        console.warn("Failed to apply unfriend punishment on remove:", e);
      }
    }

    // If status is blocked or removed, delete the snapshot
    if (args.status === "blocked" || args.status === "removed") {
      // Delete the snapshot taken by the user whose friendship status is being updated
      await ctx.runMutation(api.users.profiles.snapshots.deleteSnapshots, {
        userId: friendship.friendId,
        snapshottingUserId: friendship.userId,
      });

      // Also delete the snapshot the other user might have taken
      await ctx.runMutation(api.users.profiles.snapshots.deleteSnapshots, {
        userId: friendship.userId,
        snapshottingUserId: friendship.friendId,
      });
    }
  },
});
