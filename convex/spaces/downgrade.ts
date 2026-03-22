import { internalMutation } from "../_generated/server";
import { sendSystemDM } from "../chat/system";

export const processDowngrades = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // 1. Send 24-Hour Warnings
    const usersNeedingWarning = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.neq(q.field("pendingSpaceDeletionDate"), undefined),
          q.eq(q.field("spaceDeletionWarningSent"), false),
          q.lte(q.field("pendingSpaceDeletionDate"), now + ONE_DAY_MS),
          q.gt(q.field("pendingSpaceDeletionDate"), now)
        )
      )
      .collect();

    for (const user of usersNeedingWarning) {
      console.log(`Sending downgrade warning to user ${user._id}`);
      
      const warningMessage = `🚨 Action Required: Your subscription has lapsed. Please renew your subscription or delete 95 spaces of your choice within 24 hours, otherwise our system will automatically delete your newest spaces to meet the free limit.`;
      
      // Send DM
      await sendSystemDM(ctx, user._id, warningMessage);
      
      // Insert Activity Log for In-App Notification
      await ctx.db.insert("activities", {
        userId: user._id,
        type: "system_alert",
        title: "Subscription Lapsed",
        description: "Your subscription has lapsed. Please renew or delete 95 spaces of your choice within 24 hours to prevent automatic space deletion.",
        timestamp: now,
      });

      // Mark warning as sent
      await ctx.db.patch(user._id, {
        spaceDeletionWarningSent: true,
      });
    }

    // 2. Process Actual Downgrades (Deletions)
    const usersToDowngrade = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.neq(q.field("pendingSpaceDeletionDate"), undefined),
          q.lte(q.field("pendingSpaceDeletionDate"), now)
        )
      )
      .collect();

    for (const user of usersToDowngrade) {
      console.log(`Processing downgrade for user ${user._id}`);
      
      // Find all spaces owned by the user
      const userSpaces = await ctx.db
        .query("spaces")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
      
      // Sort by newest first
      userSpaces.sort((a, b) => b._creationTime - a._creationTime);
      
      const FREE_TIER_LIMIT = 5;
      
      if (userSpaces.length > FREE_TIER_LIMIT) {
        const spacesToDeleteCount = userSpaces.length - FREE_TIER_LIMIT;
        // The first N elements are the newest spaces
        const spacesToDelete = userSpaces.slice(0, spacesToDeleteCount);
        
        for (const space of spacesToDelete) {
          console.log(`Deleting space ${space._id} due to downgrade`);
          await ctx.db.delete(space._id);
        }
      }

      // Reset user state
      await ctx.db.patch(user._id, {
        maxSpaces: FREE_TIER_LIMIT,
        pendingSpaceDeletionDate: undefined,
        spaceDeletionWarningSent: false,
      });
      
      // Send final notification
      await sendSystemDM(ctx, user._id, `Your subscription downgrade has been processed. Your space limit has been reset to ${FREE_TIER_LIMIT}.`);
      await ctx.db.insert("activities", {
        userId: user._id,
        type: "system_alert",
        title: "Subscription Downgraded",
        description: `Your subscription has been downgraded and your limit reset to ${FREE_TIER_LIMIT} spaces.`,
        timestamp: now,
      });
    }
  },
});
