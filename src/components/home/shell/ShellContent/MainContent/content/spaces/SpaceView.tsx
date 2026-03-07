"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";
import { Settings, Users, MessageSquare, Hash, Layout, Info, Crown, Shield, ChevronDown, ChevronRight, Volume2, Calendar, BarChart3 } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import OwnerPortal from "./components/OwnerPortal";
import AdminPortal from "./components/AdminPortal";
import ModeratorPortal from "./components/ModeratorPortal";
import ChannelChat from "./components/ChannelChat";
import ScheduleChannel from "./components/ScheduleChannel";
import PollsChannel from "./components/PollsChannel";
import VoiceRoom from "./components/VoiceRoom";
import UserMembersPortal from "./components/UserMembersPortal";
import { useVoiceContext } from "@/context/VoiceContext";

interface SpaceViewProps {
    spaceId: string;
}

export default function SpaceView({ spaceId }: SpaceViewProps) {
    const sId = spaceId as Id<"spaces">;
    const space = useQuery(api.spaces.core.getSpace, { spaceId: sId });
    const me = useQuery(api.spaces.core.getMe);
    const myRole = useQuery(api.spaces.members.getMyRole, { spaceId: sId });
    const { prefetchTokensForSpace, clearPrefetchedTokensForSpace } = useVoiceContext();
    const channels = useQuery(api.spaces.channels.getChannels, { spaceId: sId });
    const categories = useQuery(api.spaces.channels.getCategories, { spaceId: sId });
    const voicePresence = useQuery(api.spaces.voice.getVoicePresence, { spaceId: sId });
    const events = useQuery(api.spaces.schedule.getEvents, { spaceId: sId });
    const unreadStatuses = useQuery(api.spaces.channels.getUnreadStatuses, { spaceId: sId });
    const trackView = useMutation(api.spaces.analytics.trackSpaceView);
    const markAsRead = useMutation(api.spaces.channels.markChannelAsRead);
    const [currentView, setCurrentView] = React.useState<"main" | "owner" | "admin" | "mod" | "chat" | "members">("main");
    const [activeChannelId, setActiveChannelId] = React.useState<Id<"spaceChannels"> | null>(null);
    const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: prev[categoryId] === undefined ? false : !prev[categoryId]
        }));
    };

    const activeChannel = React.useMemo(() => {
        if (!channels || !activeChannelId) return null;
        return channels.find(c => c._id === activeChannelId);
    }, [channels, activeChannelId]);

    const handleChannelClick = (channelId: Id<"spaceChannels">) => {
        setActiveChannelId(channelId);
        setCurrentView("chat");
    };

    React.useEffect(() => {
        if (spaceId) {
            trackView({ spaceId: sId });
        }
    }, [spaceId, trackView, sId]);

    // Pre-fetch tokens for all voice rooms in this space
    React.useEffect(() => {
        if (spaceId && channels && me) {
            const voiceChannelIds = channels.filter(c => c.type === "voice").map(c => c._id);
            if (voiceChannelIds.length > 0) {
                prefetchTokensForSpace(spaceId, voiceChannelIds, me.displayName || me.username || "User");
            }
        }
    }, [spaceId, channels, me, prefetchTokensForSpace]);

    // Cleanup prefetched tokens when leaving the space
    React.useEffect(() => {
        return () => {
            if (spaceId) {
                clearPrefetchedTokensForSpace(spaceId);
            }
        };
    }, [spaceId, clearPrefetchedTokensForSpace]);

    if (space === undefined) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <CircularProgress size={40} sx={{ color: themeVar("primary") }} />
            </Box>
        );
    }

    if (space === null) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h5" color="error">Space not found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
            {/* Space Sidebar (Channels/Categories) */}
            <Box
                sx={{
                    width: 260,
                    borderRight: `1px solid ${themeVar("border")}`,
                    bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 20%)`,
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                }}
            >
                {/* Space Header */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: `1px solid ${themeVar("border")}`,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: themeVar("textLight") }}>
                        {space.name}
                    </Typography>
                </Box>

                {/* Channel List */}
                <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                    {categories === undefined || channels === undefined ? (
                        <Box sx={{ px: 2, py: 4, display: "flex", justifyContent: "center" }}>
                            <CircularProgress size={20} sx={{ color: themeVar("textSecondary") }} />
                        </Box>
                    ) : (
                        <>
                            {/* Welcome / Home Button */}
                            <ChannelItem
                                icon={<Layout size={16} />}
                                label="Welcome"
                                active={currentView === "main"}
                                onClick={() => {
                                    setCurrentView("main");
                                    setActiveChannelId(null);
                                }}
                            />

                            {/* System Channels (Rules & Announcements) */}
                            {channels.filter((c: any) => !c.categoryId && (c.name === "rules" || c.name === "announcements")).sort((a: any, b: any) => a.channelOrder - b.channelOrder).map((channel: any) => (
                                <ChannelItem
                                    key={channel._id}
                                    icon={<MessageSquare size={16} />}
                                    label={channel.name}
                                    active={activeChannelId === channel._id && currentView === "chat"}
                                    unread={!!unreadStatuses?.[channel._id]}
                                    onClick={() => handleChannelClick(channel._id)}
                                />
                            ))}

                            {/* Uncategorized Channels (Rest) */}
                            {channels.filter((c: any) => !c.categoryId && c.name !== "rules" && c.name !== "announcements").map((channel: any) => (
                                <React.Fragment key={channel._id}>
                                    <ChannelItem
                                        icon={channel.type === "voice" ? <Volume2 size={16} /> : (channel.type === "schedule" ? <Calendar size={16} /> : (channel.type === "polls" ? <BarChart3 size={16} /> : <MessageSquare size={16} />))}
                                        label={channel.name}
                                        active={activeChannelId === channel._id && currentView === "chat"}
                                        unread={!!unreadStatuses?.[channel._id]}
                                        onClick={() => handleChannelClick(channel._id)}
                                    />
                                    {channel.type === "voice" && voicePresence && voicePresence.filter((p: any) => p.channelId === channel._id).length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pl: 4, mb: 1 }}>
                                            {voicePresence.filter((p: any) => p.channelId === channel._id).map((p: any) => (
                                                <Avatar
                                                    key={p.userId}
                                                    src={p.user?.avatarUrl}
                                                    alt={p.user?.displayName || "User"}
                                                    sx={{ width: 24, height: 24, border: `2px solid ${themeVar("backgroundAlt")}` }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Categorized Channels */}
                            {categories.sort((a: any, b: any) => a.order - b.order).map((category: any) => {
                                const categoryChannels = channels.filter((c: any) => c.categoryId === category._id).sort((a: any, b: any) => a.channelOrder - b.channelOrder);
                                const isExpanded = expandedCategories[category._id] !== false;

                                return (
                                    <Box key={category._id} sx={{ mt: 2 }}>
                                        <Box
                                            onClick={() => toggleCategory(category._id)}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                px: 1,
                                                mb: 0.5,
                                                cursor: "pointer",
                                                color: themeVar("textSecondary"),
                                                "&:hover": { color: themeVar("textLight") }
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            <Typography variant="overline" sx={{ fontWeight: 800, fontSize: 11, ml: 0.5, lineHeight: 1 }}>
                                                {category.name}
                                            </Typography>
                                        </Box>

                                        {isExpanded && categoryChannels.map((channel: any) => (
                                            <React.Fragment key={channel._id}>
                                                <ChannelItem
                                                    icon={channel.type === "voice" ? <Volume2 size={16} /> : (channel.type === "schedule" ? <Calendar size={16} /> : (channel.type === "polls" ? <BarChart3 size={16} /> : <MessageSquare size={16} />))}
                                                    label={channel.name}
                                                    active={activeChannelId === channel._id && currentView === "chat"}
                                                    unread={!!unreadStatuses?.[channel._id]}
                                                    onClick={() => handleChannelClick(channel._id)}
                                                    indent={true}
                                                />
                                                {channel.type === "voice" && voicePresence && voicePresence.filter((p: any) => p.channelId === channel._id).length > 0 && (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pl: 5, mb: 1 }}>
                                                        {voicePresence.filter((p: any) => p.channelId === channel._id).map((p: any) => (
                                                            <Avatar
                                                                key={p.userId}
                                                                src={p.user?.avatarUrl}
                                                                alt={p.user?.displayName || "User"}
                                                                sx={{ width: 24, height: 24, border: `2px solid ${themeVar("backgroundAlt")}` }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                );
                            })}

                            {channels.length === 0 && categories.length === 0 && (
                                <Typography variant="caption" sx={{ px: 2, color: themeVar("textSecondary"), fontStyle: "italic", display: "block", mt: 2 }}>No channels found</Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Top Header */}
                <Box
                    sx={{
                        height: 48,
                        borderBottom: `1px solid ${themeVar("border")}`,
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        justifyContent: "space-between",
                        bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 50%)`,
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
                            onClick={() => {
                                if (activeChannelId) setCurrentView("chat");
                                else setCurrentView("main");
                            }}
                        >
                            {currentView === "owner" ? (
                                <Crown size={20} style={{ color: themeVar("primary") }} />
                            ) : currentView === "admin" ? (
                                <Shield size={20} style={{ color: themeVar("primary") }} />
                            ) : currentView === "mod" ? (
                                <Shield size={20} style={{ color: themeVar("warning") }} />
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", color: (currentView === "chat" || currentView === "main") ? themeVar("primary") : themeVar("textSecondary") }}>
                                    {activeChannel?.type === "voice" && currentView === "chat" ? <Volume2 size={20} /> : <MessageSquare size={20} />}
                                </Box>
                            )}
                            <Typography sx={{ fontWeight: 700, color: (currentView === "chat" || currentView === "main" || currentView === "owner" || currentView === "admin" || currentView === "mod" || currentView === "members") ? themeVar("textLight") : themeVar("textSecondary") }}>
                                {currentView === "owner" ? "Owner Portal" :
                                    currentView === "admin" ? "Admin Portal" :
                                        currentView === "mod" ? "Moderator Portal" :
                                            currentView === "members" ? "Members Portal" :
                                                (activeChannel?.name || "welcome")}
                            </Typography>
                        </Box>

                        {(myRole === "owner" || myRole === "admin" || myRole === "moderator" || myRole === "member") && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                                {myRole === "owner" && (
                                    <Button
                                        size="small"
                                        startIcon={<Crown size={14} />}
                                        onClick={() => setCurrentView("owner")}
                                        sx={{
                                            color: currentView === "owner" ? themeVar("primary") : themeVar("textSecondary"),
                                            fontWeight: 700,
                                            fontSize: "0.75rem",
                                            textTransform: "none",
                                            "&:hover": { color: themeVar("textLight") }
                                        }}
                                    >
                                        Owner
                                    </Button>
                                )}
                                {(myRole === "owner" || myRole === "admin") && (
                                    <Button
                                        size="small"
                                        startIcon={<Shield size={14} />}
                                        onClick={() => setCurrentView("admin")}
                                        sx={{
                                            color: currentView === "admin" ? themeVar("primary") : themeVar("textSecondary"),
                                            fontWeight: 700,
                                            fontSize: "0.75rem",
                                            textTransform: "none",
                                            "&:hover": { color: themeVar("textLight") }
                                        }}
                                    >
                                        Admin
                                    </Button>
                                )}
                                {(myRole === "owner" || myRole === "admin" || myRole === "moderator") && (
                                    <Button
                                        size="small"
                                        startIcon={<Shield size={14} />}
                                        onClick={() => setCurrentView("mod")}
                                        sx={{
                                            color: currentView === "mod" ? themeVar("warning") : themeVar("textSecondary"),
                                            fontWeight: 700,
                                            fontSize: "0.75rem",
                                            textTransform: "none",
                                            "&:hover": { color: themeVar("textLight") }
                                        }}
                                    >
                                        Mod
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    startIcon={<Users size={14} />}
                                    onClick={() => setCurrentView("members")}
                                    sx={{
                                        color: currentView === "members" ? themeVar("primary") : themeVar("textSecondary"),
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                        textTransform: "none",
                                        "&:hover": { color: themeVar("textLight") }
                                    }}
                                >
                                    Members
                                </Button>
                            </Box>
                        )}
                    </Box>
                    {/* Removed inactive Info button */}
                </Box>

                {/* Content Area Rendering */}
                <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {currentView === "owner" && space ? (
                        <OwnerPortal space={space} />
                    ) : currentView === "admin" && space ? (
                        <AdminPortal space={space} />
                    ) : currentView === "mod" && space ? (
                        <ModeratorPortal space={space} />
                    ) : currentView === "members" && space ? (
                        <UserMembersPortal space={space} />
                    ) : currentView === "chat" && activeChannel ? (
                        activeChannel.type === "voice" ? (
                            <VoiceRoom roomId={activeChannel._id} roomName={activeChannel.name} spaceId={spaceId} />
                        ) : activeChannel.type === "schedule" ? (
                            <ScheduleChannel channel={activeChannel} spaceId={spaceId} />
                        ) : activeChannel.type === "polls" ? (
                            <PollsChannel channel={activeChannel} spaceId={spaceId} />
                        ) : (
                            <ChannelChat channel={activeChannel} userRole={myRole || undefined} />
                        )
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                position: "relative",
                                overflow: "hidden",
                                backgroundImage: space.coverUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(${space.coverUrl})` : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                p: 4
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: "50%",
                                    bgcolor: space.coverUrl ? "rgba(255,255,255,0.1)" : `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 3,
                                    border: `1px solid ${space.coverUrl ? "rgba(255,255,255,0.2)" : themeVar("primary")}`,
                                    backdropFilter: space.coverUrl ? "blur(10px)" : "none",
                                    boxShadow: space.coverUrl ? "0 10px 30px rgba(0,0,0,0.3)" : "none"
                                }}
                            >
                                {space.avatarUrl ? (
                                    <Avatar src={space.avatarUrl} sx={{ width: 80, height: 80, borderRadius: "50%" }} />
                                ) : (
                                    <MessageSquare size={48} style={{ color: space.coverUrl ? "white" : themeVar("primary") }} />
                                )}
                            </Box>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 900,
                                    color: "white",
                                    mb: 1,
                                    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                                    letterSpacing: "-0.02em"
                                }}
                            >
                                Welcome to {space.name}!
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: "rgba(255,255,255,0.7)",
                                    maxWidth: 500,
                                    fontWeight: 500,
                                    mb: 4
                                }}
                            >
                                {space.description || `This is the start of your journey in ${space.name}. Start by inviting members or configuring your first channels.`}
                            </Typography>

                            {/* Schedule Area */}
                            {(() => {
                                const upcomingEvents = (events || []).filter(e => e.endTime > Date.now());
                                if (upcomingEvents.length === 0) return null;

                                return (
                                    <Box sx={{ maxWidth: 600, width: "100%", mb: 4, textAlign: "left" }}>
                                        <Typography variant="overline" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.5)", display: "block", mb: 1, pl: 1 }}>UPCOMING EVENTS</Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            {upcomingEvents.slice(0, 3).map(event => {
                                                const startDate = new Date(event.startTime);
                                                const endDate = new Date(event.endTime);
                                                const dateStr = startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                                                const timeStr = `${startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

                                                return (
                                                    <Box key={event._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "flex-start", gap: 2 }}>
                                                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`, color: themeVar("primary") }}>
                                                            <Calendar size={20} />
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ color: "white", fontWeight: 700 }}>{event.title}</Typography>
                                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block", fontWeight: 600 }}>{dateStr} • {timeStr}</Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                            {upcomingEvents.length > 3 && (
                                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", textAlign: "center", mt: 1, display: "block" }}>
                                                    + {upcomingEvents.length - 3} more
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })()}

                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setCurrentView("members")}
                                    startIcon={<Users size={18} />}
                                    sx={{
                                        bgcolor: themeVar("primary"),
                                        fontWeight: 700,
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                        textTransform: "none"
                                    }}
                                >
                                    Invite Friends
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

function ChannelItem({ icon, label, active = false, unread = false, onClick, indent = false }: { icon: React.ReactNode; label: string; active?: boolean; unread?: boolean; onClick?: () => void; indent?: boolean }) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                ml: indent ? 1 : 0,
                mb: 0.25,
                borderRadius: 1.5,
                cursor: "pointer",
                position: "relative",
                color: active ? themeVar("textLight") : (unread ? themeVar("textLight") : themeVar("textSecondary")),
                bgcolor: active ? `color-mix(in oklab, ${themeVar("primary")}, transparent 85%)` : "transparent",
                "&:hover": {
                    bgcolor: active ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : `color-mix(in oklab, ${themeVar("textLight")}, transparent 95%)`,
                    color: themeVar("textLight"),
                },
                transition: "all 0.2s ease",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center" }}>{icon}</Box>
            <Typography variant="body2" sx={{ fontWeight: (active || unread) ? 900 : 500, flex: 1 }}>
                {label}
            </Typography>
            {unread && !active && (
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: themeVar("primary"),
                        boxShadow: `0 0 10px ${themeVar("primary")}`,
                    }}
                />
            )}
        </Box>
    );
}
