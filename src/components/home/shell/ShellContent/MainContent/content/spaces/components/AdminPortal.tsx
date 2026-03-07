"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import {
    Shield,
    Users,
    Activity,
    UserMinus,
    Trophy,
    Link,
    Plus,
    Trash2,
    Lock,
    Unlock,
    Clock,
    Search,
    ShieldAlert,
    X,
    Hash,
    Edit2,
    Check,
    MessageSquarePlus,
    Smile,
    Image as ImageIcon
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

interface AdminPortalProps {
    space: Doc<"spaces">;
}

const parseRules = (text: string) => {
    if (!text || !text.includes("=== SERVER RULES ===")) return [];
    try {
        const blocks = text.split("=== SERVER RULES ===\n\n")[1].split("\n\n");
        return blocks.map(block => {
            const lines = block.split('\n');
            const firstLine = lines[0].trim();
            const firstSpace = firstLine.indexOf(' ');
            if (firstSpace === -1) return null;
            let parsedId = firstLine.substring(0, firstSpace);
            if (parsedId.endsWith('.')) parsedId = parsedId.slice(0, -1);
            const title = firstLine.substring(firstSpace + 1);
            const description = lines.slice(1).map(l => l.trimStart()).join('\n');
            return { id: parsedId, title, description };
        }).filter(Boolean) as { id: string, title: string, description: string }[];
    } catch {
        return [];
    }
}

export default function AdminPortal({ space }: AdminPortalProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId: space._id });
    const globalActions = useQuery(api.spaces.audit.getAdminActions, { spaceId: space._id });
    const invites = useQuery(api.spaces.invites.getSpaceInvites, { spaceId: space._id });
    const leaderboard = useQuery(api.spaces.invites.getInviteLeaderboard, { spaceId: space._id });
    const bans = useQuery(api.spaces.moderation.getSpaceBans, { spaceId: space._id });
    const timeouts = useQuery(api.spaces.moderation.getSpaceTimeouts, { spaceId: space._id });

    const createInvite = useMutation(api.spaces.invites.createInvite);
    const revokeInvite = useMutation(api.spaces.invites.revokeInvite);
    const kickMember = useMutation(api.spaces.members.kickMember);
    const setRole = useMutation(api.spaces.members.setMemberRole);
    const unbanUser = useMutation(api.spaces.moderation.unbanUser);
    const timeoutUser = useMutation(api.spaces.moderation.timeoutUser);
    const channels = useQuery(api.spaces.channels.getChannels, { spaceId: space._id });
    const categories = useQuery(api.spaces.channels.getCategories, { spaceId: space._id });
    const createChannel = useMutation(api.spaces.channels.createChannel);
    const updateChannel = useMutation(api.spaces.channels.updateChannel);
    const deleteChannel = useMutation(api.spaces.channels.deleteChannel);

    const createCategory = useMutation(api.spaces.channels.createCategory);
    const updateCategory = useMutation(api.spaces.channels.updateCategory);
    const deleteCategory = useMutation(api.spaces.channels.deleteCategory);
    const setupWelcome = useMutation(api.spaces.welcome.setupWelcomeCategory);

    const customEmojis = useQuery(api.spaces.emojis.getSpaceCustomEmojis, { spaceId: space._id });
    const generateUploadUrl = useMutation(api.spaces.emojis.generateEmojiUploadUrl);
    const saveCustomEmoji = useMutation(api.spaces.emojis.saveCustomEmoji);
    const deleteCustomEmoji = useMutation(api.spaces.emojis.deleteCustomEmoji);


    const [searchQuery, setSearchQuery] = React.useState("");
    const [creatingInvite, setCreatingInvite] = React.useState(false);
    const [selectedInviterId, setSelectedInviterId] = React.useState<Id<"users"> | null>(null);
    const [currentTab, setCurrentTab] = React.useState("activity");
    const [creatingChannel, setCreatingChannel] = React.useState(false);
    const [newChannelName, setNewChannelName] = React.useState("");
    const [newChannelCategoryId, setNewChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");
    const [editingChannelId, setEditingChannelId] = React.useState<Id<"spaceChannels"> | null>(null);
    const [editingChannelName, setEditingChannelName] = React.useState("");
    const [editingChannelCategoryId, setEditingChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");

    const [creatingCategory, setCreatingCategory] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState("");
    const [editingCategoryId, setEditingCategoryId] = React.useState<Id<"spaceCategories"> | null>(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");

    const [emojiName, setEmojiName] = React.useState("");
    const [uploadingEmoji, setUploadingEmoji] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [confirmDialog, setConfirmDialog] = React.useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmLabel?: string;
        isDanger?: boolean;
    }>({
        open: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(false);
    const [welcomeRules, setWelcomeRules] = React.useState([{ id: "1", title: "Be Respectful", description: "Treat everyone with respect." }]);

    const welcomeContentQuery = useQuery(api.spaces.welcome.getWelcomeContent, { spaceId: space._id });

    const handleOpenWelcomeSetup = () => {
        if (welcomeContentQuery) {
            if (welcomeContentQuery.rulesText) {
                const parsed = parseRules(welcomeContentQuery.rulesText);
                if (parsed.length > 0) setWelcomeRules(parsed);
            }
        }
        setWelcomeDialogOpen(true);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        await createChannel({
            spaceId: space._id,
            name: newChannelName,
            type: "text",
            categoryId: newChannelCategoryId === "" ? undefined : newChannelCategoryId as Id<"spaceCategories">
        });
        setCreatingChannel(false);
        setNewChannelName("");
        setNewChannelCategoryId("");
    };

    const handleUpdateChannel = async () => {
        if (!editingChannelId || !editingChannelName.trim()) return;
        await updateChannel({
            channelId: editingChannelId,
            name: editingChannelName,
            categoryId: editingChannelCategoryId === "" ? undefined : editingChannelCategoryId as Id<"spaceCategories">
        });
        setEditingChannelId(null);
        setEditingChannelName("");
        setEditingChannelCategoryId("");
    };

    const handleDeleteChannel = async (channelId: Id<"spaceChannels">, name: string) => {
        setConfirmDialog({
            open: true,
            title: "Delete Channel",
            message: `Are you sure you want to delete #${name}? This will permanently remove all messages in this channel.`,
            confirmLabel: "Delete Channel",
            isDanger: true,
            onConfirm: async () => {
                await deleteChannel({ channelId });
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        await createCategory({ spaceId: space._id, name: newCategoryName });
        setCreatingCategory(false);
        setNewCategoryName("");
    };

    const handleUpdateCategory = async () => {
        if (!editingCategoryId || !editingCategoryName.trim()) return;
        await updateCategory({ categoryId: editingCategoryId, name: editingCategoryName });
        setEditingCategoryId(null);
        setEditingCategoryName("");
    };

    const handleDeleteCategory = async (categoryId: Id<"spaceCategories">, name: string) => {
        setConfirmDialog({
            open: true,
            title: "Delete Category",
            message: `Are you sure you want to delete category "${name}"? Channels within this category will become uncategorized.`,
            confirmLabel: "Delete Category",
            isDanger: true,
            onConfirm: async () => {
                await deleteCategory({ categoryId });
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleUploadEmoji = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !emojiName.trim()) return;

        setUploadingEmoji(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await saveCustomEmoji({
                spaceId: space._id,
                name: emojiName.trim().toLowerCase(),
                storageId: storageId as Id<"_storage">,
            });
            setEmojiName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to upload emoji.");
        } finally {
            setUploadingEmoji(false);
        }
    };

    const handleDeleteEmoji = async (emojiId: Id<"spaceCustomEmojis">, name: string) => {
        setConfirmDialog({
            open: true,
            title: "Delete Emoji",
            message: `Are you sure you want to delete :${name}:? This cannot be undone.`,
            confirmLabel: "Delete Emoji",
            isDanger: true,
            onConfirm: async () => {
                await deleteCustomEmoji({ emojiId });
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleCreateInviteCode = async () => {
        setCreatingInvite(true);
        try {
            await createInvite({ spaceId: space._id });
        } finally {
            setCreatingInvite(false);
        }
    };

    const filteredMembers = members?.filter(m =>
        m.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?._id.toString().includes(searchQuery)
    );

    return (
        <Box sx={{ flex: 1, overflowY: "auto", p: 4, bgcolor: themeVar("background") }}>
            <Stack spacing={4}>
                {/* Header Section */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <Typography sx={{ display: "flex", alignItems: "center", gap: 1, color: themeVar("secondary"), fontWeight: 700, mb: 1, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <Shield size={16} /> Admin Command Center
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("textLight") }}>{space.name} Administration</Typography>
                        <Typography sx={{ color: themeVar("textSecondary"), mt: 0.5 }}>Manage members and monitor activity in this space.</Typography>
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
                    sx={{
                        borderBottom: `1px solid ${themeVar("border")}`,
                        "& .MuiTab-root": { color: themeVar("textSecondary"), fontWeight: 700, textTransform: "none", fontSize: "0.875rem", minWidth: 100 },
                        "& .Mui-selected": { color: themeVar("secondary") },
                        "& .MuiTabs-indicator": { backgroundColor: themeVar("secondary") }
                    }}
                >
                    <Tab value="activity" label="Activity" />
                    <Tab value="members" label="Members" />
                    <Tab value="invites" label="Invites" />
                    <Tab value="bans" label="Bans & Timeouts" />
                    {(space.adminCanEditChannels ?? true) && <Tab value="channels" label="Channels" />}
                    <Tab value="emojis" label="Emojis" />
                </Tabs>

                <Box sx={{ display: "grid", gridTemplateColumns: currentTab === "activity" ? "1fr 350px" : "1fr", gap: 4 }}>
                    <Stack spacing={4}>
                        {currentTab === "members" && (
                            /* Member Management */
                            <Box sx={{ maxWidth: 800 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>MEMBER MANAGEMENT</Typography>
                                    <TextField
                                        size="small"
                                        placeholder="Search members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search size={14} /></InputAdornment>,
                                            sx: { fontSize: "0.8rem", height: 32, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)` }
                                        }}
                                    />
                                </Box>
                                <Stack spacing={1} sx={{ maxHeight: 400, overflowY: "auto", pr: 1 }}>
                                    {filteredMembers?.map((member: any) => (
                                        <Box
                                            key={member._id}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`,
                                                border: `1px solid ${themeVar("border")}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                transition: "all 0.2s ease",
                                                "&:hover": { borderColor: themeVar("secondary") }
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar src={member.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{member.user?.displayName || "User"}</Typography>
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Joined {new Date(member.joinedAt).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                        bgcolor: member.role === "owner" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : member.role === "admin" ? `color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)` : member.role === "moderator" ? `color-mix(in oklab, ${themeVar("warning")}, transparent 90%)` : "rgba(0,0,0,0.2)",
                                                        border: `1px solid ${member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("warning") : themeVar("border")}`,
                                                        mr: 1
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("warning") : themeVar("textSecondary") }}>
                                                        {member.role.toUpperCase()}
                                                    </Typography>
                                                </Box>

                                                {member.role === "member" && (
                                                    <Tooltip title="Appoint Moderator">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("warning"), "&:hover": { bgcolor: "rgba(255,165,0,0.1)" } }}
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    open: true,
                                                                    title: "Promote Member",
                                                                    message: `Promote ${member.user?.displayName} to Moderator?`,
                                                                    confirmLabel: "Promote",
                                                                    isDanger: false,
                                                                    onConfirm: async () => {
                                                                        await setRole({ spaceId: space._id, userId: member.userId, role: "moderator" });
                                                                        setConfirmDialog(prev => ({ ...prev, open: false }));
                                                                    }
                                                                });
                                                            }}
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {member.role === "member" && (
                                                    <Tooltip title="Kick Member">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("danger"), "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    open: true,
                                                                    title: "Kick Member",
                                                                    message: `Are you sure you want to kick ${member.user?.displayName}? They will need a new invite to join back.`,
                                                                    confirmLabel: "Kick Member",
                                                                    isDanger: true,
                                                                    onConfirm: async () => {
                                                                        await kickMember({ spaceId: space._id, targetUserId: member.userId });
                                                                        setConfirmDialog(prev => ({ ...prev, open: false }));
                                                                    }
                                                                });
                                                            }}
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                    {filteredMembers?.length === 0 && (
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4 }}>No members found.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {currentTab === "invites" && (
                            /* Invite Management Section */
                            <Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 0.5 }}>INVITE MANAGEMENT</Typography>
                                </Box>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 600 }}>
                                    {/* Active Invite Codes */}
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), display: "flex", alignItems: "center", gap: 1 }}>
                                                <Link size={14} /> ACTIVE CODES
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                disabled={creatingInvite || space.allowInvites === false}
                                                onClick={handleCreateInviteCode}
                                                sx={{ color: themeVar("secondary") }}
                                            >
                                                <Plus size={18} />
                                            </IconButton>
                                        </Box>
                                        <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
                                            {invites?.map((invite: any) => (
                                                <Box key={invite._id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}` }}>
                                                    <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                                                        <Typography sx={{ fontWeight: 900, color: themeVar("secondary"), letterSpacing: "0.1em", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{invite.code}</Typography>
                                                        <Typography variant="caption" sx={{ color: themeVar("textSecondary"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>By {invite.creatorDisplayName} • {invite.uses} uses</Typography>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => revokeInvite({ spaceId: space._id, inviteId: invite._id })}
                                                        sx={{ color: themeVar("danger") }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                            {(!invites || invites.length === 0) && (
                                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", textAlign: "center", py: 2 }}>No active invite codes.</Typography>
                                            )}
                                        </Stack>
                                    </Box>

                                    {/* Invite Leaderboard */}
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                            <Trophy size={14} /> INVITE LEADERBOARD
                                        </Typography>
                                        <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
                                            {leaderboard?.map((entry: any, index: number) => (
                                                <Box
                                                    key={entry.userId}
                                                    onClick={() => setSelectedInviterId(entry.userId as Id<"users">)}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        cursor: "pointer",
                                                        p: 1,
                                                        borderRadius: 1,
                                                        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1, mr: 1 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 900, color: index === 0 ? themeVar("highlight") : themeVar("textSecondary"), width: 14, flexShrink: 0 }}>{index + 1}.</Typography>
                                                        <Avatar src={entry.avatarUrl} sx={{ width: 24, height: 24, flexShrink: 0 }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeVar("textLight"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.displayName}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("secondary"), whiteSpace: "nowrap", flexShrink: 0 }}>{entry.count} joined</Typography>
                                                </Box>
                                            ))}
                                            {(!leaderboard || leaderboard.length === 0) && (
                                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", textAlign: "center", py: 2 }}>No invites tracked yet.</Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {currentTab === "activity" && (
                            <Box sx={{ p: 3, borderRadius: 4, bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 95%)`, border: `1px solid ${themeVar("secondary")}`, borderLeftWidth: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: themeVar("textLight"), mb: 1 }}>Space Health Overview</Typography>
                                <Typography sx={{ color: themeVar("textSecondary") }}>Use the Admin portal to track member growth and handle moderation actions.</Typography>
                            </Box>
                        )}

                        {currentTab === "channels" && (space.adminCanEditChannels ?? true) && (
                            <Box sx={{ maxWidth: 800 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>CATEGORIES & CHANNELS</Typography>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={handleOpenWelcomeSetup}
                                            style={{ color: themeVar("warning"), fontWeight: 700, textTransform: "none", border: `1px solid ${themeVar("warning")}` }}
                                        >
                                            {welcomeContentQuery ? "Edit Welcome" : "Setup Welcome"}
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => setCreatingCategory(true)}
                                            sx={{ color: themeVar("textSecondary"), fontWeight: 700, textTransform: "none", border: `1px solid ${themeVar("border")}` }}
                                        >
                                            New Category
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<MessageSquarePlus size={14} />}
                                            onClick={() => setCreatingChannel(true)}
                                            sx={{ color: themeVar("secondary"), fontWeight: 700, textTransform: "none" }}
                                        >
                                            New Channel
                                        </Button>
                                    </Box>
                                </Box>

                                {creatingCategory && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("secondary")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
                                        <Stack spacing={2.5}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textLight") }}>Create Category</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                label="Category Name"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g. text channels"
                                                autoFocus
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("secondary") } } }}
                                                InputProps={{
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("secondary") }
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                                <Button size="small" onClick={() => { setCreatingCategory(false); setNewCategoryName(""); }} sx={{ color: themeVar("textSecondary"), textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                                                <Button size="small" variant="contained" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} sx={{ bgcolor: themeVar("secondary"), color: "white", fontWeight: 900, textTransform: "uppercase" }}>Create</Button>
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {creatingChannel && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("secondary")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
                                        <Stack spacing={2.5}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textLight") }}>Create Channel</Typography>

                                            <TextField
                                                size="small"
                                                fullWidth
                                                label="Channel Name"
                                                value={newChannelName}
                                                onChange={(e) => setNewChannelName(e.target.value)}
                                                placeholder="e.g. general"
                                                autoFocus
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("secondary") } } }}
                                                InputProps={{
                                                    startAdornment: <Hash size={16} style={{ marginRight: 8, color: themeVar("secondary") }} />,
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("secondary") }
                                                    }
                                                }}
                                            />

                                            <FormControl fullWidth size="small">
                                                <InputLabel sx={{ color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("secondary") } }}>Category (Optional)</InputLabel>
                                                <Select
                                                    value={newChannelCategoryId}
                                                    label="Category (Optional)"
                                                    onChange={(e) => setNewChannelCategoryId(e.target.value as any)}
                                                    sx={{
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("secondary") },
                                                        "& .MuiSvgIcon-root": { color: themeVar("textSecondary") }
                                                    }}
                                                    MenuProps={{ PaperProps: { sx: { bgcolor: themeVar("backgroundAlt"), border: `1px solid ${themeVar("border")}` } } }}
                                                >
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {categories?.sort((a, b) => a.order - b.order).map(cat => (
                                                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                                <Button
                                                    size="small"
                                                    onClick={() => { setCreatingChannel(false); setNewChannelName(""); setNewChannelCategoryId(""); }}
                                                    sx={{ color: themeVar("textSecondary"), textTransform: "none", fontWeight: 700, "&:hover": { color: themeVar("textLight") } }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button size="small" variant="contained" onClick={handleCreateChannel} disabled={!newChannelName.trim()}
                                                    sx={{
                                                        bgcolor: themeVar("secondary"),
                                                        color: "white",
                                                        fontWeight: 900,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        px: 3,
                                                        "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
                                                    }}
                                                >Create</Button>
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                <Stack spacing={3}>
                                    {/* Uncategorized Channels */}
                                    <Box>
                                        {channels?.filter(c => !c.categoryId).length !== undefined && channels.filter(c => !c.categoryId).length > 0 && (
                                            <Typography variant="overline" sx={{ display: "block", color: themeVar("textSecondary"), fontWeight: 800, mb: 1, pl: 1 }}>Uncategorized</Typography>
                                        )}
                                        <Stack spacing={1}>
                                            {channels?.filter(c => !c.categoryId).map((channel) => (
                                                <RenderChannelItem
                                                    key={channel._id}
                                                    channel={channel}
                                                    categories={categories}
                                                    editingId={editingChannelId}
                                                    editingName={editingChannelName}
                                                    editingCategoryId={editingChannelCategoryId}
                                                    onStartEdit={(id: Id<"spaceChannels">, name: string, catId: Id<"spaceCategories"> | undefined) => { setEditingChannelId(id); setEditingChannelName(name); setEditingChannelCategoryId(catId || ""); }}
                                                    onCancelEdit={() => { setEditingChannelId(null); setEditingChannelName(""); setEditingChannelCategoryId(""); }}
                                                    onChangeName={(e: React.ChangeEvent<HTMLInputElement>) => setEditingChannelName(e.target.value)}
                                                    onChangeCategory={(e: any) => setEditingChannelCategoryId(e.target.value as any)}
                                                    onSaveEdit={handleUpdateChannel}
                                                    onDelete={() => handleDeleteChannel(channel._id, channel.name)}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>

                                    {/* Categorized Channels */}
                                    {categories?.sort((a, b) => a.order - b.order).map(category => (
                                        <Box key={category._id}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, pl: 1, pr: 1, "&:hover .cat-actions": { opacity: 1 } }}>
                                                {editingCategoryId === category._id ? (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, mr: 2 }}>
                                                        <TextField
                                                            size="small"
                                                            value={editingCategoryName}
                                                            onChange={e => setEditingCategoryName(e.target.value)}
                                                            autoFocus
                                                            InputProps={{ sx: { color: themeVar("textLight"), height: 32, bgcolor: "rgba(0,0,0,0.2)" } }}
                                                        />
                                                        <IconButton size="small" onClick={handleUpdateCategory} sx={{ color: themeVar("success") }}><Check size={16} /></IconButton>
                                                        <IconButton size="small" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }} sx={{ color: themeVar("danger") }}><X size={16} /></IconButton>
                                                    </Box>
                                                ) : (
                                                    <>
                                                        <Typography variant="overline" sx={{ color: themeVar("textSecondary"), fontWeight: 800 }}>{category.name}</Typography>
                                                        <Box className="cat-actions" sx={{ opacity: 0, transition: "opacity 0.2s", display: "flex", gap: 0.5 }}>
                                                            <IconButton size="small" onClick={() => { setEditingCategoryId(category._id); setEditingCategoryName(category.name); }} sx={{ color: themeVar("textSecondary"), p: 0.5 }}><Edit2 size={14} /></IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteCategory(category._id, category.name)} sx={{ color: themeVar("danger"), p: 0.5 }}><Trash2 size={14} /></IconButton>
                                                        </Box>
                                                    </>
                                                )}
                                            </Box>
                                            <Stack spacing={1}>
                                                {channels?.filter(c => c.categoryId === category._id).map((channel) => (
                                                    <RenderChannelItem
                                                        key={channel._id}
                                                        channel={channel}
                                                        categories={categories}
                                                        editingId={editingChannelId}
                                                        editingName={editingChannelName}
                                                        editingCategoryId={editingChannelCategoryId}
                                                        onStartEdit={(id: Id<"spaceChannels">, name: string, catId: Id<"spaceCategories"> | undefined) => { setEditingChannelId(id); setEditingChannelName(name); setEditingChannelCategoryId(catId || ""); }}
                                                        onCancelEdit={() => { setEditingChannelId(null); setEditingChannelName(""); setEditingChannelCategoryId(""); }}
                                                        onChangeName={(e: React.ChangeEvent<HTMLInputElement>) => setEditingChannelName(e.target.value)}
                                                        onChangeCategory={(e: any) => setEditingChannelCategoryId(e.target.value as any)}
                                                        onSaveEdit={handleUpdateChannel}
                                                        onDelete={() => handleDeleteChannel(channel._id, channel.name)}
                                                    />
                                                ))}
                                                {channels?.filter(c => c.categoryId === category._id).length === 0 && (
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontStyle: "italic", pl: 2, py: 1 }}>Empty category</Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    ))}

                                    {channels?.length === 0 && categories?.length === 0 && (
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4, fontStyle: "italic" }}>
                                            No categories or channels created yet.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {currentTab === "emojis" && (
                            /* Custom Emojis Management Section */
                            <Box sx={{ maxWidth: 800 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>CUSTOM EMOJIS</Typography>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: (customEmojis?.length || 0) >= 75 && (space.tier || "free") === "free" ? themeVar("danger") : themeVar("textSecondary") }}>
                                            {customEmojis?.length || 0} / {(space.tier || "free") === "free" ? "75" : "∞"} USED
                                        </Typography>
                                        {(space.tier || "free") === "free" && (
                                            <Box sx={{ width: 100, height: 4, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1, mt: 0.5, overflow: "hidden" }}>
                                                <Box sx={{
                                                    width: `${Math.min(((customEmojis?.length || 0) / 75) * 100, 100)}%`,
                                                    height: "100%",
                                                    bgcolor: (customEmojis?.length || 0) >= 70 ? themeVar("danger") : themeVar("secondary"),
                                                    transition: "width 0.3s ease"
                                                }} />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("border")}` }}>
                                    <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                                        Upload custom emojis for your space. Users can use them to react to messages.
                                        {(space.tier || "free") === "free" && " Free tier is limited to 75 emojis."}
                                    </Typography>

                                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                        <TextField
                                            size="small"
                                            label="Emoji Name (e.g. 'cool')"
                                            value={emojiName}
                                            onChange={(e) => setEmojiName(e.target.value.toLowerCase())}
                                            inputProps={{ maxLength: 20 }}
                                            sx={{
                                                flex: 1,
                                                "& .MuiInputLabel-root": { color: themeVar("textSecondary") },
                                                "& .MuiInputLabel-root.Mui-focused": { color: themeVar("secondary") },
                                                "& .MuiOutlinedInput-root": {
                                                    color: themeVar("textLight"),
                                                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                                                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                                    "&.Mui-focused fieldset": { borderColor: themeVar("secondary") },
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start" sx={{ color: themeVar("textSecondary") }}>:</InputAdornment>,
                                                endAdornment: <InputAdornment position="end" sx={{ color: themeVar("textSecondary") }}>:</InputAdornment>,
                                            }}
                                        />
                                        <Button
                                            variant="contained"
                                            component="label"
                                            disabled={!emojiName.trim() || uploadingEmoji}
                                            startIcon={<ImageIcon size={18} />}
                                            sx={{ bgcolor: themeVar("secondary"), fontWeight: 900 }}
                                        >
                                            {uploadingEmoji ? "Uploading..." : "Upload Image"}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={handleUploadEmoji}
                                            />
                                        </Button>
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), opacity: 0.7 }}>
                                        Suggested size: 64x64px. Squares work best.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 2 }}>
                                    {customEmojis?.map((emoji) => (
                                        <Tooltip key={emoji._id} title={`:${emoji.name}:`}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: "rgba(0,0,0,0.2)",
                                                    border: `1px solid ${themeVar("border")}`,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    position: "relative",
                                                    minWidth: 0,
                                                    "&:hover .delete-btn": { opacity: 1 }
                                                }}
                                            >
                                                <img src={emoji.url || ""} alt={emoji.name} style={{ width: 40, height: 40, objectFit: "contain" }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: themeVar("secondary"),
                                                        width: "100%",
                                                        textAlign: "center",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    :{emoji.name}:
                                                </Typography>

                                                <IconButton
                                                    className="delete-btn"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEmoji(emoji._id, emoji.name);
                                                    }}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 4,
                                                        right: 4,
                                                        opacity: 0,
                                                        transition: "opacity 0.2s ease",
                                                        color: themeVar("danger"),
                                                        bgcolor: "rgba(0,0,0,0.4)",
                                                        "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                                        padding: "2px"
                                                    }}
                                                >
                                                    <X size={14} />
                                                </IconButton>
                                            </Box>
                                        </Tooltip>
                                    ))}
                                    {customEmojis?.length === 0 && (
                                        <Box sx={{
                                            gridColumn: "1 / -1",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textAlign: "center",
                                            py: 8,
                                            border: `1px dashed ${themeVar("border")}`,
                                            borderRadius: 3,
                                            bgcolor: "rgba(0,0,0,0.1)"
                                        }}>
                                            <Smile size={48} style={{ color: themeVar("textSecondary"), opacity: 0.5, marginBottom: 16 }} />
                                            <Typography variant="body1" sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>No custom emojis yet.</Typography>
                                            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), mt: 1 }}>Start by uploading your first emoji above!</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {currentTab === "bans" && (
                            <Box sx={{ maxWidth: 800 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2 }}>BAN MANAGEMENT</Typography>
                                <Stack spacing={2} sx={{ mb: 4 }}>
                                    {bans?.map((ban: any) => (
                                        <Box key={ban._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)", border: `1px solid ${themeVar("border")}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={ban.user?.avatarUrl} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{ban.user?.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Banned by {ban.bannedBy?.name} on {new Date(ban.createdAt).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => unbanUser({ spaceId: space._id, userId: ban.user?.id })}
                                                sx={{ textTransform: 'none', fontWeight: 700 }}
                                            >
                                                Unban
                                            </Button>
                                        </Box>
                                    ))}
                                    {bans?.length === 0 && (
                                        <Typography sx={{ color: themeVar("textSecondary"), textAlign: 'center', py: 4 }}>No banned users.</Typography>
                                    )}
                                </Stack>

                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2 }}>ACTIVE TIMEOUTS</Typography>
                                <Stack spacing={2}>
                                    {timeouts?.map((t: any) => (
                                        <Box key={t._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)", border: `1px solid ${themeVar("border")}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={t.user?.avatarUrl} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{t.user?.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Timeout until {new Date(t.timeoutUntil).toLocaleString()}</Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => timeoutUser({ spaceId: space._id, userId: t.userId, timeoutUntil: 0 })}
                                                sx={{ textTransform: 'none', fontWeight: 700, color: themeVar("warning"), borderColor: themeVar("warning") }}
                                            >
                                                Remove Timeout
                                            </Button>
                                        </Box>
                                    ))}
                                    {timeouts?.length === 0 && (
                                        <Typography sx={{ color: themeVar("textSecondary"), textAlign: 'center', py: 4 }}>No active timeouts.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}
                    </Stack>


                    {currentTab === "activity" && (
                        /* Right Column: Global Feed */
                        <Box sx={{ bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, borderRadius: 3, border: `1px solid ${themeVar("border")}`, p: 2, height: "100%", maxHeight: 600, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Activity size={16} /> RECENT ACTIONS
                            </Typography>
                            <Box sx={{ flex: 1, overflowY: "auto" }}>
                                <Stack spacing={2}>
                                    {globalActions?.map((action: any) => (
                                        <Box key={action._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.1)", borderLeft: `3px solid ${themeVar("secondary")}` }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Avatar src={action.admin?.avatarUrl} sx={{ width: 20, height: 20 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("textLight") }}>{action.admin?.displayName}</Typography>
                                                <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>• {new Date(action.timestamp).toLocaleTimeString()}</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontSize: "0.8rem" }}>{action.details}</Typography>
                                        </Box>
                                    ))}
                                    {(!globalActions || globalActions.length === 0) && (
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4 }}>No recent actions.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Stack>

            {/* Inviter Detail View */}
            {selectedInviterId && (
                <InviterDetailView
                    spaceId={space._id}
                    inviterId={selectedInviterId}
                    onClose={() => setSelectedInviterId(null)}
                />
            )}

            {/* Generic Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                PaperProps={{
                    sx: {
                        bgcolor: themeVar("backgroundAlt"),
                        border: `1px solid ${themeVar("border")}`,
                        borderRadius: 4,
                        backgroundImage: "none",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        minWidth: 320
                    }
                }}
            >
                <DialogTitle sx={{ color: themeVar("textLight"), fontWeight: 800, pb: 1 }}>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: themeVar("textSecondary") }}>
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                        sx={{ color: themeVar("textSecondary"), textTransform: "none", fontWeight: 700 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDialog.onConfirm}
                        variant="contained"
                        sx={{
                            bgcolor: confirmDialog.isDanger ? themeVar("danger") : themeVar("secondary"),
                            color: "white",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            "&:hover": { bgcolor: confirmDialog.isDanger ? "darkred" : "darkblue" }
                        }}
                    >
                        {confirmDialog.confirmLabel || "Confirm"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={welcomeDialogOpen} onClose={() => setWelcomeDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: themeVar("backgroundAlt"), color: themeVar("textLight"), backgroundImage: "none" } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>Setup Welcome Category</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                        This will create or update the "Welcome" category. The #rules channel will be completely refreshed with the contents below.
                        The #announcements channel will be created if it doesn't exist, acting as a feed for admins.
                    </DialogContentText>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Rules</Typography>
                    {welcomeRules.map((r, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                            <TextField
                                size="small"
                                label="ID"
                                value={r.id}
                                onChange={e => { const newR = [...welcomeRules]; newR[i].id = e.target.value; setWelcomeRules(newR); }}
                                sx={{ width: 80 }}
                                InputProps={{ sx: { color: themeVar("textLight") } }}
                            />
                            <TextField
                                size="small"
                                label="Title"
                                value={r.title}
                                onChange={e => { const newR = [...welcomeRules]; newR[i].title = e.target.value; setWelcomeRules(newR); }}
                                sx={{ flex: 1 }}
                                InputProps={{ sx: { color: themeVar("textLight") } }}
                            />
                            <TextField
                                size="small"
                                label="Description"
                                value={r.description}
                                onChange={e => { const newR = [...welcomeRules]; newR[i].description = e.target.value; setWelcomeRules(newR); }}
                                sx={{ flex: 2 }}
                                InputProps={{ sx: { color: themeVar("textLight") } }}
                            />
                            <IconButton onClick={() => setWelcomeRules(welcomeRules.filter((_, idx) => idx !== i))} sx={{ color: themeVar("danger") }}>
                                <Trash2 size={16} />
                            </IconButton>
                        </Box>
                    ))}
                    <Button
                        startIcon={<Plus size={16} />}
                        onClick={() => setWelcomeRules([...welcomeRules, { id: `${welcomeRules.length + 1}`, title: "", description: "" }])}
                        sx={{ color: themeVar("secondary"), textTransform: "none", fontWeight: 700 }}
                    >
                        Add Rule
                    </Button>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setWelcomeDialogOpen(false)} sx={{ color: themeVar("textSecondary") }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            await setupWelcome({ spaceId: space._id, rulesItems: welcomeRules as any });
                            setWelcomeDialogOpen(false);
                            setWelcomeRules([{ id: "1", title: "Be Respectful", description: "Treat everyone with respect." }]);
                        }}
                        sx={{ bgcolor: themeVar("secondary"), color: "white", fontWeight: 700 }}
                    >
                        Save Welcome Category
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function RenderChannelItem({
    channel, categories, editingId, editingName, editingCategoryId,
    onStartEdit, onCancelEdit, onChangeName, onChangeCategory, onSaveEdit, onDelete
}: any) {
    if (editingId === channel._id) {
        return (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.15)", border: `1px solid ${themeVar("border")}`, display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    label="Edit Name"
                    value={editingName}
                    onChange={onChangeName}
                    autoFocus
                    InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("secondary") } } }}
                    InputProps={{
                        startAdornment: <Hash size={16} style={{ marginRight: 8, color: themeVar("secondary") }} />,
                        sx: { color: themeVar("textLight"), bgcolor: "rgba(0,0,0,0.2)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }
                    }}
                />
                <Select
                    size="small"
                    value={editingCategoryId}
                    onChange={onChangeCategory}
                    displayEmpty
                    sx={{ color: themeVar("textLight"), bgcolor: "rgba(0,0,0,0.2)", minWidth: 120, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }, "& .MuiSvgIcon-root": { color: themeVar("textSecondary") } }}
                >
                    <MenuItem value=""><em>No Category</em></MenuItem>
                    {categories?.sort((a: any, b: any) => a.order - b.order).map((cat: any) => (
                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                </Select>
                <IconButton onClick={onSaveEdit} sx={{ color: themeVar("success") }}><Check size={18} /></IconButton>
                <IconButton onClick={onCancelEdit} sx={{ color: themeVar("danger") }}><X size={18} /></IconButton>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.15)", border: `1px solid ${themeVar("border")}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Hash size={18} style={{ color: themeVar("textSecondary") }} />
                <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{channel.name}</Typography>
            </Box>
            <Box>
                <IconButton size="small" onClick={() => onStartEdit(channel._id, channel.name, channel.categoryId)} sx={{ color: themeVar("secondary"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                    <Edit2 size={16} />
                </IconButton>
                <IconButton size="small" onClick={onDelete} sx={{ color: themeVar("danger"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                    <Trash2 size={16} />
                </IconButton>
            </Box>
        </Box>
    );
}

function InviterDetailView({ spaceId, inviterId, onClose }: { spaceId: Id<"spaces">; inviterId: Id<"users">; onClose: () => void }) {
    const inviter = useQuery(api.users.onboarding.queries.getUserById, { userId: inviterId });
    const invitedMembers = useQuery(api.spaces.invites.getInvitedMembersByUser, { spaceId, inviterId });

    return (
        <Box
            sx={{
                position: "fixed",
                top: 60,
                right: 20,
                bottom: 20,
                width: 400,
                bgcolor: themeVar("backgroundAlt"),
                border: `1px solid ${themeVar("border")}`,
                borderRadius: 4,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                backdropFilter: "blur(20px)",
                animation: "slideIn 0.3s ease-out"
            }}
        >
            <Box sx={{ p: 3, borderBottom: `1px solid ${themeVar("border")}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={inviter?.avatarUrl} />
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: themeVar("textLight") }}>{inviter?.displayName}</Typography>
                        <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Recruitment History</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: themeVar("textSecondary") }}><X size={20} /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)`, border: `1px solid ${themeVar("secondary")}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("secondary"), display: "block", mb: 0.5 }}>TOTAL RECRUITED</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("textLight") }}>{invitedMembers?.length ?? 0}</Typography>
                </Box>

                <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2, display: "block" }}>MEMBERS INVITED</Typography>
                <Stack spacing={1.5}>
                    {invitedMembers?.map((member: any) => (
                        <Box key={member.userId} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)", border: `1px solid ${themeVar("border")}` }}>
                            <Avatar src={member.avatarUrl} sx={{ width: 32, height: 32 }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: themeVar("textLight") }}>{member.displayName}</Typography>
                                <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Joined {new Date(member.joinedAt).toLocaleDateString()}</Typography>
                            </Box>
                        </Box>
                    ))}
                    {invitedMembers?.length === 0 && (
                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", mt: 4 }}>
                            No members recruited yet.
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}`, minWidth: 140 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Users size={14} color={themeVar("secondary")} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), textTransform: "uppercase" }}>{label}</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("textLight") }}>{value}</Typography>
        </Box>
    );
}
