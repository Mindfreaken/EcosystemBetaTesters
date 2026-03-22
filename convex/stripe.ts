"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

/**
 * Action to handle incoming Stripe Webhooks.
 * Validates the signature and processes checkout completion.
 */
export const handleWebhook = action({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Stripe secrets are missing in environment variables.");
      return { status: 500, message: "Server configuration error" };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    let event;
    try {
      event = stripe.webhooks.constructEvent(args.payload, args.signature, webhookSecret);
    } catch (err: any) {
      console.warn(`Webhook signature verification failed: ${err.message}`);
      return { status: 400, message: "Invalid signature" };
    }

    console.log(`Processing Stripe event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerkUserId;

      if (clerkUserId) {
        console.log(`Fulfilling purchase for user: ${clerkUserId}`);
        await ctx.runMutation(internal.users.billing.updateUserSubscription, {
          clerkUserId,
          stripeCustomerId: session.customer as string,
          maxSpaces: 100, // You can make this dynamic based on the price ID later
        });
      } else {
        console.warn("No clerkUserId found in session metadata.");
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;

      if (stripeCustomerId) {
        console.log(`Starting downgrade countdown for customer: ${stripeCustomerId}`);
        await ctx.runMutation(internal.users.billing.startDowngradeCountdown, {
          stripeCustomerId,
        });
      }
    }

    return { status: 200, message: "Success" };
  },
});

