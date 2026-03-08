"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { AccessToken } from "livekit-server-sdk";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const generate = action({
    args: {
        room: v.string(), // channelId mapped to room
        participantName: v.string(),
    },
    handler: async (ctx, args): Promise<{ token: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const clerkUserId = identity.subject;
        const channelId = args.room as Id<"spaceChannels">;

        // Get join details to verify membership and timeout
        const joinDetails = await ctx.runQuery(api.spaces.voice.getJoinDetails, {
            channelId,
            clerkUserId,
        });

        if (joinDetails?.error) {
            throw new Error(joinDetails.error);
        }

        if (joinDetails?.membership?.timeoutUntil && joinDetails.membership.timeoutUntil > Date.now()) {
            throw new Error("You are currently timed out and cannot join voice channels.");
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.warn("LiveKit environment variables are missing");
            throw new Error("Server is missing LiveKit credentials");
        }

        const participantName = args.participantName ||
            joinDetails.user?.displayName ||
            joinDetails.user?.username ||
            clerkUserId;

        // Generate token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: clerkUserId,
            name: participantName,
        });

        // Grant permissions
        at.addGrant({ roomJoin: true, room: args.room, canPublish: true, canSubscribe: true });

        const token = await at.toJwt();
        return { token };
    }
});
