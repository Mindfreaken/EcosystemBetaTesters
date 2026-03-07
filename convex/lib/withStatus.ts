
import {
    query as baseQuery,
    mutation as baseMutation,
    internalQuery as baseInternalQuery,
    internalMutation as baseInternalMutation,
    QueryCtx,
    MutationCtx
} from "../_generated/server";
import { ensureUserActive } from "../auth/helpers";
import { v } from "convex/values";

// We define custom wrappers that enforce the status check

export function queryWithStatus({ args, handler }: { args: any; handler: any }) {
    return baseQuery({
        args,
        handler: async (ctx: any, args: any) => {
            await ensureUserActive(ctx);
            return handler(ctx, args);
        },
    });
}

export function mutationWithStatus({ args, handler }: { args: any; handler: any }) {
    return baseMutation({
        args,
        handler: async (ctx: any, args: any) => {
            await ensureUserActive(ctx);
            return handler(ctx, args);
        },
    });
}
