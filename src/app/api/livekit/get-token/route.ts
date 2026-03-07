import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const room = searchParams.get("room");

        if (!room) {
            return NextResponse.json(
                { error: "Missing 'room' query parameter" },
                { status: 400 }
            );
        }

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
        const participantName = participantNameParam || (user?.firstName
            ? `${user.firstName} ${user.lastName || ""}`.trim()
            : userId);

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
