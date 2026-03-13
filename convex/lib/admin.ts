import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Ensures a user is authorized for administrative actions.
 * Throws an error if the user is not an admin or overseer.
 */
export async function ensureAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }

  // Use the clerkUserId from identity to find the Convex user document
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("Unauthorized: Platform user profile not found");
  }

  // Use overseeradmin role for dashboard access
  if (!user.overseeradmin) {
    throw new Error(`Unauthorized: Overseer Administrative privileges required for ${user.username}`);
  }

  return user;
}

/**
 * Ensures a user has Overseer status (higher than regular admin).
 */
export async function ensureOverseer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await ensureAdmin(ctx);
  
  if (!user.overseer && !user.overseeradmin) {
    throw new Error(`Unauthorized: Overseer privileges required for ${user.username}`);
  }

  return user;
}
