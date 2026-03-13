"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Crown, ShieldAlert, Shield } from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";

import ActivityTab from "./portal-tabs/ActivityTab";
import GeneralTab from "./portal-tabs/GeneralTab";
import ChannelsTab from "./portal-tabs/ChannelsTab";
import MembersTab from "./portal-tabs/MembersTab";
import EmojisTab from "./portal-tabs/EmojisTab";
import BansTab from "./portal-tabs/BansTab";
import { PollsTab } from "@/components/home/shell/ShellContent/MainContent/content/spaces/components/portal-tabs/PollsTab";
import ScheduleTab from "./portal-tabs/ScheduleTab";

interface SpacePortalProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
    userRole?: string;
}

function StatCard({ label, value }: { label: string, value: string | number }) {
    return (
        <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "block", fontSize: "0.7rem", fontWeight: 800 }}>
                {label.toUpperCase()}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("foreground") }}>
                {value}
            </Typography>
        </Box>
    );
}

export default function SpacePortal({ space, role, userRole }: SpacePortalProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId: space._id });

    // Default tab depends on role or general preference. Activity is a good default.
    const [currentTab, setCurrentTab] = React.useState("activity");

    const portalConfig = {
        owner: {
            title: "Space Control Center",
            icon: <Crown size={16} />,
            color: themeVar("primary")
        },
        admin: {
            title: "Admin Command Center",
            icon: <Shield size={16} />,
            color: themeVar("secondary")
        },
        moderator: {
            title: "Moderator Dashboard",
            icon: <ShieldAlert size={16} />,
            color: themeVar("chart4")
        }
    };

    const config = portalConfig[role];

    const isOwner = role === "owner";
    const isSpaceAdmin = role === "admin";
    const isMod = role === "moderator";

    const canEditGeneral = isOwner || isSpaceAdmin;
    const canManageChannels = isOwner ||
        (isSpaceAdmin && (space.adminCanEditChannels ?? true)) ||
        (isMod && (space.modCanEditChannels ?? false));
    const canManageEmojis = isOwner || isSpaceAdmin;
    const canManagePolls = isOwner ||
        (isSpaceAdmin && (space.adminCanCreatePolls !== false)) ||
        (isMod && (space.modCanCreatePolls ?? false));

    return (
        <Box sx={{ flex: 1, overflowY: "auto", p: 4, bgcolor: themeVar("background") }}>
            <Stack spacing={4}>
                {/* Header Section */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <Typography sx={{ display: "flex", alignItems: "center", gap: 1, color: config.color, fontWeight: 700, mb: 1, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            {config.icon} {config.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("foreground") }}>
                            {space.name} {role.charAt(0).toUpperCase() + role.slice(1)} Portal
                        </Typography>
                        <Typography sx={{ color: themeVar("mutedForeground"), mt: 0.5 }}>
                            Manage settings, members, and monitoring for this space.
                        </Typography>
                    </Box>

                    {/* Quick Stats */}
                    <Stack direction="row" spacing={3}>
                        <StatCard label="Total Members" value={members?.length ?? "..."} />
                    </Stack>
                </Box>

                <Divider sx={{ borderColor: themeVar("border") }} />

                <Tabs
                    value={currentTab}
                    onChange={(_, val) => setCurrentTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: `1px solid ${themeVar("border")}`,
                        "& .MuiTab-root": { color: themeVar("mutedForeground"), fontWeight: 700, textTransform: "none", fontSize: "0.875rem", minWidth: 100 },
                        "& .Mui-selected": { color: config.color },
                        "& .MuiTabs-indicator": { backgroundColor: config.color }
                    }}
                >
                    <Tab value="activity" label="Activity" />
                    {canEditGeneral && <Tab value="general" label="General" />}
                    <Tab value="members" label="Members" />
                    {canManageChannels && <Tab value="channels" label="Channels" />}
                    {(isOwner || isSpaceAdmin) && <Tab value="schedule" label="Schedule" />}
                    {canManagePolls && <Tab value="polls" label="Polls" />}
                    <Tab value="bans" label="Bans & Timeouts" />
                    {canManageEmojis && <Tab value="emojis" label="Emojis" />}
                </Tabs>

                <Box>
                    {currentTab === "activity" && <ActivityTab space={space} role={role} />}
                    {currentTab === "general" && canEditGeneral && <GeneralTab space={space} role={role} userRole={userRole} />}
                    {currentTab === "members" && <MembersTab space={space} role={role} userRole={userRole} />}
                    {currentTab === "channels" && canManageChannels && <ChannelsTab space={space} role={role} userRole={userRole} canManageChannels={canManageChannels} />}
                    {currentTab === "schedule" && (isOwner || isSpaceAdmin) && <ScheduleTab space={space} role={role} />}
                    {currentTab === "polls" && canManagePolls && <PollsTab space={space} role={role} userRole={userRole} />}
                    {currentTab === "bans" && <BansTab space={space} role={role} />}
                    {currentTab === "emojis" && canManageEmojis && <EmojisTab space={space} role={role} />}
                </Box>
            </Stack>
        </Box>
    );
}


