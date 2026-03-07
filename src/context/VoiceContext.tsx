"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { LiveKitRoom } from "@livekit/components-react";

interface VoiceContextType {
    roomName: string | null;
    channelName: string | null;
    token: string | null;
    joinRoom: (roomName: string, channelName: string, token: string) => void;
    leaveRoom: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
    const [roomName, setRoomName] = useState<string | null>(null);
    const [channelName, setChannelName] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const joinRoom = (newRoom: string, newChannelName: string, newToken: string) => {
        setRoomName(newRoom);
        setChannelName(newChannelName);
        setToken(newToken);
    };

    const leaveRoom = () => {
        setRoomName(null);
        setChannelName(null);
        setToken(null);
    };

    return (
        <VoiceContext.Provider value={{ roomName, channelName, token, joinRoom, leaveRoom }}>
            <LiveKitRoom
                video={false}
                audio={true}
                token={token ?? undefined}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                data-lk-theme="default"
                connect={!!token && !!roomName}
                style={{ display: "contents" }}
            >
                {children}
            </LiveKitRoom>
        </VoiceContext.Provider>
    );
}

export function useVoiceContext() {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error("useVoiceContext must be used within a VoiceProvider");
    }
    return context;
}
