import { QueryCtx, MutationCtx } from "../_generated/server";
import { isUserBlocked } from "../lib/permissions_utils";
import { Doc } from "../_generated/dataModel";

export async function ensureUserActive(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized: missing Clerk identity");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
        .first();

    if (!user) {
        throw new Error("User not found");
    }

    if (isUserBlocked(user)) {
        // We throw a specific error that the frontend can catch to redirect
        throw new Error(JSON.stringify({
            code: "USER_SUSPENDED",
            stage: user.suspensionStatus,
            message: "Your account is currently suspended."
        }));
    }

    return user;
}
