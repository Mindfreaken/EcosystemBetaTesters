import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const room = searchParams.get("room"); // This is the channelId

        if (!room) {
            return NextResponse.json(
                { error: "Missing 'room' query parameter" },
                { status: 400 }
            );
        }

        let joinDetails: any = null;

        // --- CONVEX JOIN DETAILS CHECK ---
        try {
            joinDetails = await convex.query(api.spaces.voice.getJoinDetails, {
                channelId: room as any,
                clerkUserId: userId
            });

            if (joinDetails?.error) {
                return NextResponse.json({ error: joinDetails.error }, { status: 404 });
            }

            if (joinDetails?.membership?.timeoutUntil && joinDetails.membership.timeoutUntil > Date.now()) {
                return NextResponse.json({ error: "You are currently timed out and cannot join voice channels." }, { status: 403 });
            }
        } catch (convexErr) {
            console.error("Convex check failed:", convexErr);
        }
        // ----------------------------------

        const participantNameParam = searchParams.get("participantName");

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.warn("LiveKit environment variables are missing");
            return NextResponse.json(
                { error: "Server is missing LiveKit credentials" },
                { status: 500 }
            );
        }

        // Determine participant identity/name
        // Use provided name, or Convex display name, or fallback to Clerk ID
        const participantName = participantNameParam ||
            joinDetails.user?.displayName ||
            joinDetails.user?.username ||
            userId;

        // Generate token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: userId,
            name: participantName,
        });

        // Grant permissions
        at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (error) {
        console.error("Error generating LiveKit token:", error);
        return NextResponse.json(
            { error: "Failed to generate token" },
            { status: 500 }
        );
    }
}
