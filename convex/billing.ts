"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

/**
 * Creates a Stripe Checkout Session for subscription with Managed Payments (MOR) enabled.
 * Uses the Stripe Preview API version requested by the user.
 */
export const createCheckoutSession = action({
  args: {
    priceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: You must be logged in to upgrade.");
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in Convex environment variables. Please add it in your Convex dashboard.");
    }

    const priceId = args.priceId ?? process.env.STRIPE_SPACE_PRICE_ID;
    if (!priceId) {
      throw new Error("STRIPE_SPACE_PRICE_ID is not set in Convex environment variables. Please add it in your Convex dashboard.");
    }

    // Initialize Stripe with a fallback version, we'll override it in the request options
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create the session following the user's specific curl parameters
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      // @ts-ignore - managed_payments is currently a preview feature
      managed_payments: {
        enabled: true,
      },
      success_url: `${appUrl}/home?view=spaces&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/home?view=spaces`,
      metadata: {
        clerkUserId: identity.subject,
      },
      customer_email: identity.email,
    }, {
      // Use the specific preview version as requested in the curl command
      apiVersion: "2026-02-25.preview" as any,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe Checkout session URL.");
    }

    return { url: session.url };
  },
});

/**
 * Creates a Stripe Customer Portal session.
 */
export const createCustomerPortalSession = action({
  args: {},
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: You must be logged in to manage billing.");
    }

    const stripeCustomerId = await ctx.runQuery(internal.users.billing.getUserStripeId, {
      clerkUserId: identity.subject,
    });

    if (!stripeCustomerId) {
      throw new Error("No active Stripe customer found. You might need to subscribe first.");
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in Convex environment variables.");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = (await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/home?view=settings`,
    })) as any;

    if (!session.url) {
      throw new Error("Failed to create Stripe Customer Portal session URL.");
    }

    return { url: session.url };
  },
});

