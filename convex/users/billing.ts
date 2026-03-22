import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { sendSystemDM } from "../chat/system";

/**
 * Internal mutation to update user subscription fields after Stripe verification.
 */
export const getUserStripeId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    return user?.stripeCustomerId ?? null;
  },
});

export const updateUserSubscription = internalMutation({
  args: {
    clerkUserId: v.string(),
    stripeCustomerId: v.string(),
    maxSpaces: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        maxSpaces: args.maxSpaces,
        stripeCustomerId: args.stripeCustomerId,
        pendingSpaceDeletionDate: undefined, // Clear any pending downgrade
        spaceDeletionWarningSent: false, // Reset warning
      });
      console.log(`Updated user ${user._id} limit to ${args.maxSpaces}`);
    } else {
      console.error(`User with clerk ID ${args.clerkUserId} not found during webhook.`);
    }
  },
});

/**
 * Internal mutation to start the 7-day downgrade timer when a subscription is deleted.
 */
export const startDowngradeCountdown = internalMutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id" as any, (q) => q.eq("stripeCustomerId", args.stripeCustomerId)) // Note: Requires index creation
      .first();

    // Fallback if index isn't ready or we need to scan (since index doesn't exist yet)
    let targetUser = user;
    if (!targetUser) {
      const allUsers = await ctx.db.query("users").collect();
      targetUser = allUsers.find(u => u.stripeCustomerId === args.stripeCustomerId) || null;
    }

    if (targetUser) {
      const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();
      await ctx.db.patch(targetUser._id, {
        pendingSpaceDeletionDate: now + GRACE_PERIOD_MS,
        spaceDeletionWarningSent: false,
      });
      console.log(`Started 7-day downgrade countdown for user ${targetUser._id}`);

      // Send the initial 7-day warning
      const warningMessage = `🚨 Subscription Cancelled: Your space subscription has ended. You have exactly 7 days to renew your subscription. If not renewed, our system will automatically delete your newest spaces to meet the free limit of 5.`;
      
      await sendSystemDM(ctx, targetUser._id, warningMessage);
      
      await ctx.db.insert("activities", {
        userId: targetUser._id,
        type: "system_alert",
        title: "Subscription Cancelled",
        description: "Your subscription was cancelled. You have 7 days to renew before excess spaces are automatically deleted.",
        timestamp: now,
      });

    } else {
      console.error(`User with stripe customer ID ${args.stripeCustomerId} not found.`);
    }
  },
});
