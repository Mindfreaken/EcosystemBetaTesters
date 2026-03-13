"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { useQuery, useAction } from "convex/react";
import { api } from "convex/_generated/api";

interface VoiceContextType {
    roomName: string | null;
    channelName: string | null;
    spaceId: string | null;
    token: string | null;
    joinRoom: (roomName: string, channelName: string, spaceId: string, token: string) => void;
    leaveRoom: () => void;
    prefetchToken: (roomId: string, participantName: string) => Promise<void>;
    prefetchTokensForSpace: (spaceId: string, roomIds: string[], participantName: string) => Promise<void>;
    clearPrefetchedTokensForSpace: (spaceId: string) => void;
    prefetchedTokens: Record<string, string>;
    me: any;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
    const [roomName, setRoomName] = useState<string | null>(null);
    const [channelName, setChannelName] = useState<string | null>(null);
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [prefetchedTokens, setPrefetchedTokensState] = useState<Record<string, string>>({});
    const prefetchedTokensRef = React.useRef<Record<string, string>>({});

    const setPrefetchedTokens = React.useCallback((updater: React.SetStateAction<Record<string, string>>) => {
        setPrefetchedTokensState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            prefetchedTokensRef.current = next;
            return next;
        });
    }, []);

    // Pre-load user data globally
    const me = useQuery(api.spaces.core.getMe);
    const generateToken = useAction(api.spaces.voiceToken.generate);

    const joinRoom = React.useCallback((newRoom: string, newChannelName: string, newSpaceId: string, newToken: string) => {
        setRoomName(newRoom);
        setChannelName(newChannelName);
        setSpaceId(newSpaceId);
        setToken(newToken);
    }, []);

    const leaveRoom = React.useCallback(() => {
        setRoomName(null);
        setChannelName(null);
        setSpaceId(null);
        setToken(null);
    }, []);

    const prefetchToken = React.useCallback(async (roomId: string, participantName: string) => {
        if (prefetchedTokensRef.current[roomId]) return;
        try {
            const data = await generateToken({ room: roomId, participantName });
            if (data.token) {
                setPrefetchedTokens(prev => ({ ...prev, [roomId]: data.token }));
            }
        } catch (err) {
            console.error("Failed to prefetch token", err);
        }
    }, [setPrefetchedTokens, generateToken]);

    const prefetchTokensForSpace = React.useCallback(async (sId: string, roomIds: string[], participantName: string) => {
        const needed = roomIds.filter(id => !prefetchedTokensRef.current[id]);
        if (needed.length === 0) return;

        await Promise.all(needed.map(async (roomId) => {
            try {
                const data = await generateToken({ room: roomId, participantName });
                if (data.token) {
                    setPrefetchedTokens(prev => ({ ...prev, [roomId]: data.token }));
                }
            } catch (err) {
                console.error("Failed to prefetch token", roomId, err);
            }
        }));
    }, [setPrefetchedTokens, generateToken]);

    const clearPrefetchedTokensForSpace = React.useCallback((sId: string) => {
        // Just clear all tokens to avoid memory leaks when leaving space.
        // We do this to ensure tokens don't expire for spaces we left and re-entered.
        setPrefetchedTokens({});
    }, [setPrefetchedTokens]);

    return (
        <VoiceContext.Provider value={{ roomName, channelName, spaceId, token, joinRoom, leaveRoom, prefetchToken, prefetchTokensForSpace, clearPrefetchedTokensForSpace, prefetchedTokens, me }}>
            <LiveKitRoom
                video={false}
                audio={false} // By setting this to false, LiveKit does not force-publish default audio on connect, allowing saved user choices in MediaDeviceMenu to be respected without being overridden. Users can still toggle audio via the UI buttons which publish using their saved device.
                token={token ?? undefined}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                data-lk-theme="default"
                connect={!!token && !!roomName}
                style={{ display: "contents" }}
                options={{
                    publishDefaults: {
                        red: true,
                    }
                }}
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


