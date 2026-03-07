"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import {
    Crown,
    Settings,
    Users,
    TrendingUp,
    Activity,
    Edit2,
    Camera,
    Image as ImageIcon,
    UserPlus,
    UserMinus,
    Check,
    X,
    Clock,
    User,
    Trophy,
    Link,
    Plus,
    Link2,
    Hash,
    MessageSquarePlus,
    Shield,
    ShieldOff,
    ShieldAlert,
    RefreshCw,
    Trash2,
    Lock,
    Unlock,
    Search
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";

interface OwnerPortalProps {
    space: Doc<"spaces">;
}

import { RenderChannelItem } from "./ModeratorPortal";

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

export default function OwnerPortal({ space }: OwnerPortalProps) {
    const stats = useQuery(api.spaces.analytics.getSpaceStats, { spaceId: space._id });
    const admins = useQuery(api.spaces.members.getSpaceAdmins, { spaceId: space._id });
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId: space._id });
    const actionStats = useQuery(api.spaces.audit.getAdminActionStats, { spaceId: space._id });
    const globalActions = useQuery(api.spaces.audit.getAdminActions, { spaceId: space._id });

    const updateMetadata = useMutation(api.spaces.core.updateSpaceMetadata);
    const setRole = useMutation(api.spaces.members.setMemberRole);

    const [editingName, setEditingName] = React.useState(false);
    const [newName, setNewName] = React.useState(space.name);
    const [editingDescription, setEditingDescription] = React.useState(false);
    const [newDescription, setNewDescription] = React.useState(space.description || "");
    const [editingLivekitUrl, setEditingLivekitUrl] = React.useState(false);
    const [newLivekitUrl, setNewLivekitUrl] = React.useState(space.livekitUrl || "");
    const [selectedAdminId, setSelectedAdminId] = React.useState<Id<"users"> | null>(null);
    const [selectedInviterId, setSelectedInviterId] = React.useState<Id<"users"> | null>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
    const [uploadingCover, setUploadingCover] = React.useState(false);
    const [creatingInvite, setCreatingInvite] = React.useState(false);
    const [promotingRole, setPromotingRole] = React.useState<"admin" | "moderator">("admin");
    const [currentTab, setCurrentTab] = React.useState("general");

    const invites = useQuery(api.spaces.invites.getSpaceInvites, { spaceId: space._id });
    const leaderboard = useQuery(api.spaces.invites.getInviteLeaderboard, { spaceId: space._id });
    const bans = useQuery(api.spaces.moderation.getSpaceBans, { spaceId: space._id });
    const timeouts = useQuery(api.spaces.moderation.getSpaceTimeouts, { spaceId: space._id });

    const createInvite = useMutation(api.spaces.invites.createInvite);
    const revokeInvite = useMutation(api.spaces.invites.revokeInvite);
    const toggleInvites = useMutation(api.spaces.invites.toggleInvites);
    const unbanUser = useMutation(api.spaces.moderation.unbanUser);
    const timeoutUser = useMutation(api.spaces.moderation.timeoutUser);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const coverInputRef = React.useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.chat.storage.generateUploadUrl);
    const saveFileMetadata = useMutation(api.chat.storage.saveFileMetadata);

    const channels = useQuery(api.spaces.channels.getChannels, { spaceId: space._id });
    const categories = useQuery(api.spaces.channels.getCategories, { spaceId: space._id });
    const createChannel = useMutation(api.spaces.channels.createChannel);
    const updateChannel = useMutation(api.spaces.channels.updateChannel);
    const deleteChannel = useMutation(api.spaces.channels.deleteChannel);
    const updateChannelPermissions = useMutation(api.spaces.channels.updateChannelPermissions);

    const createCategory = useMutation(api.spaces.channels.createCategory);
    const updateCategory = useMutation(api.spaces.channels.updateCategory);
    const deleteCategory = useMutation(api.spaces.channels.deleteCategory);

    const [creatingChannel, setCreatingChannel] = React.useState(false);
    const [newChannelName, setNewChannelName] = React.useState("");
    const [newChannelType, setNewChannelType] = React.useState("text");
    const [newChannelCategoryId, setNewChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");
    const [editingChannelId, setEditingChannelId] = React.useState<Id<"spaceChannels"> | null>(null);
    const [editingChannelName, setEditingChannelName] = React.useState("");
    const [editingChannelCategoryId, setEditingChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");
    const [searchQuery, setSearchQuery] = React.useState("");

    const [creatingCategory, setCreatingCategory] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState("");
    const [editingCategoryId, setEditingCategoryId] = React.useState<Id<"spaceCategories"> | null>(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");

    const [setupWelcomeOpen, setSetupWelcomeOpen] = React.useState(false);
    const [welcomeRules, setWelcomeRules] = React.useState([{ id: "1", title: "Be Respectful", description: "Treat everyone with respect." }]);
    const setupWelcomeCategory = useMutation(api.spaces.welcome.setupWelcomeCategory);
    const welcomeContentQuery = useQuery(api.spaces.welcome.getWelcomeContent, { spaceId: space._id });

    // Emojis State
    const customEmojis = useQuery(api.spaces.emojis.getSpaceCustomEmojis, { spaceId: space._id });
    const generateEmojiUploadUrl = useMutation(api.spaces.emojis.generateEmojiUploadUrl);
    const saveCustomEmoji = useMutation(api.spaces.emojis.saveCustomEmoji);
    const deleteCustomEmoji = useMutation(api.spaces.emojis.deleteCustomEmoji);
    const [emojiName, setEmojiName] = React.useState("");
    const [uploadingEmoji, setUploadingEmoji] = React.useState(false);
    const emojiFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleOpenWelcomeSetup = () => {
        if (welcomeContentQuery) {
            if (welcomeContentQuery.rulesText) {
                const parsed = parseRules(welcomeContentQuery.rulesText);
                if (parsed.length > 0) setWelcomeRules(parsed);
            }
        }
        setSetupWelcomeOpen(true);
    };

    const handleUpdateName = async () => {
        if (newName.trim() === "") return;
        await updateMetadata({ spaceId: space._id, name: newName });
        setEditingName(false);
    };

    const handleUpdateDescription = async () => {
        await updateMetadata({ spaceId: space._id, description: newDescription });
        setEditingDescription(false);
    };

    const handleUpdateLivekitUrl = async () => {
        await updateMetadata({ spaceId: space._id, livekitUrl: newLivekitUrl });
        setEditingLivekitUrl(false);
    };

    const handleUploadEmoji = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !emojiName.trim()) return;

        setUploadingEmoji(true);
        try {
            const postUrl = await generateEmojiUploadUrl();
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
            if (emojiFileInputRef.current) emojiFileInputRef.current.value = "";
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to upload emoji.");
        } finally {
            setUploadingEmoji(false);
        }
    };

    const handleDeleteEmoji = async (emojiId: Id<"spaceCustomEmojis">, name: string) => {
        if (window.confirm(`Are you sure you want to delete :${name}:? This cannot be undone.`)) {
            await deleteCustomEmoji({ emojiId });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === "avatar") setUploadingAvatar(true);
        else setUploadingCover(true);

        try {
            // 1. Get upload URL
            const uploadResult = await generateUploadUrl({ fileSize: file.size });
            if (!uploadResult.success) {
                console.error("Quota exceeded or error getting upload URL");
                return;
            }

            // 2. Upload to storage
            const result = await fetch(uploadResult.url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // 3. Save metadata & get public URL
            const { url } = await saveFileMetadata({
                storageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                userId: space.ownerId, // Typically the owner is uploading
                path: `/spaces/${space._id}/${type}`,
            });

            // 4. Update space record
            await updateMetadata({
                spaceId: space._id,
                [type === "avatar" ? "avatarUrl" : "coverUrl"]: url
            });
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
        } finally {
            if (type === "avatar") setUploadingAvatar(false);
            else setUploadingCover(false);
        }
    };

    const handleCreateInviteCode = async () => {
        setCreatingInvite(true);
        try {
            await createInvite({ spaceId: space._id });
        } finally {
            setCreatingInvite(false);
        }
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            await createChannel({
                spaceId: space._id,
                name: newChannelName,
                type: newChannelType,
                categoryId: newChannelCategoryId === "" ? undefined : newChannelCategoryId as Id<"spaceCategories">
            });
            setNewChannelName("");
            setNewChannelCategoryId("");
            setCreatingChannel(false);
        } catch (error) {
            console.error("Error creating channel:", error);
        }
    };

    const handleUpdateChannel = async () => {
        if (!editingChannelId || !editingChannelName.trim()) return;
        try {
            await updateChannel({
                channelId: editingChannelId,
                name: editingChannelName,
                categoryId: editingChannelCategoryId === "" ? undefined : editingChannelCategoryId as Id<"spaceCategories">
            });
            setEditingChannelId(null);
            setEditingChannelName("");
            setEditingChannelCategoryId("");
        } catch (error) {
            console.error("Error updating channel:", error);
        }
    };

    const handleDeleteChannel = async (channelId: Id<"spaceChannels">, name: string) => {
        if (window.confirm(`Are you sure you want to delete #${name}? All messages will be lost.`)) {
            await deleteChannel({ channelId });
        }
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
        if (window.confirm(`Are you sure you want to delete category "${name}"? Channels within this category will become uncategorized.`)) {
            await deleteCategory({ categoryId });
        }
    };

    return (
        <Box sx={{ flex: 1, overflowY: "auto", p: 4, bgcolor: themeVar("background") }}>
            <Stack spacing={4}>
                {/* Header Section */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <Typography sx={{ display: "flex", alignItems: "center", gap: 1, color: themeVar("primary"), fontWeight: 700, mb: 1, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <Crown size={16} /> Owner Command Center
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {editingName ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <TextField
                                        size="small"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                color: themeVar("textLight"),
                                                fontWeight: 800,
                                                fontSize: "1.5rem",
                                            }
                                        }}
                                    />
                                    <IconButton onClick={handleUpdateName} sx={{ color: themeVar("success") }}><Check size={20} /></IconButton>
                                    <IconButton onClick={() => setEditingName(false)} sx={{ color: themeVar("danger") }}><X size={20} /></IconButton>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, group: "true" }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("textLight") }}>{space.name}</Typography>
                                    <IconButton size="small" onClick={() => setEditingName(true)} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
                                        <Edit2 size={16} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        <Typography sx={{ color: themeVar("textSecondary"), mt: 0.5 }}>Overview and management for your space.</Typography>
                    </Box>

                    {/* Quick Stats */}
                    <Stack direction="row" spacing={3}>
                        <StatCard icon={<TrendingUp size={18} color={themeVar("primary")} />} label="Daily Users" value={stats?.dailyActive ?? "..."} />
                        <StatCard icon={<TrendingUp size={18} color={themeVar("secondary")} />} label="Monthly Users" value={stats?.monthlyActive ?? "..."} />
                    </Stack>
                </Box>

                <Tabs
                    value={currentTab}
                    onChange={(_, val) => setCurrentTab(val)}
                    sx={{
                        borderBottom: `1px solid ${themeVar("border")}`,
                        "& .MuiTab-root": { color: themeVar("textSecondary"), fontWeight: 700, textTransform: "none", fontSize: "0.875rem", minWidth: 100 },
                        "& .Mui-selected": { color: themeVar("primary") },
                        "& .MuiTabs-indicator": { backgroundColor: themeVar("primary") }
                    }}
                >
                    <Tab value="general" label="General" />
                    <Tab value="activity" label="Activity" />
                    <Tab value="channels" label="Channels" />
                    <Tab value="members" label="Members" />
                    <Tab value="invites" label="Invites" />
                    <Tab value="bans" label="Bans & Timeouts" />
                    <Tab value="emojis" label="Emojis" />
                </Tabs>

                <Box sx={{ display: "grid", gridTemplateColumns: (currentTab === "general" || currentTab === "activity") ? "1fr 350px" : "1fr", gap: 4 }}>
                    <Stack spacing={4}>
                        {currentTab === "general" && (
                            <>
                                {/* Branding Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2 }}>SPACE BRANDING</Typography>
                                    <Box sx={{ display: "flex", gap: 3 }}>
                                        <input
                                            type="file"
                                            hidden
                                            ref={avatarInputRef}
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "avatar")}
                                        />
                                        <input
                                            type="file"
                                            hidden
                                            ref={coverInputRef}
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "cover")}
                                        />
                                        <Tooltip title="Change Avatar">
                                            <Box
                                                sx={{ position: "relative", cursor: uploadingAvatar ? "default" : "pointer" }}
                                                onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                                            >
                                                <Box sx={{ position: "relative" }}>
                                                    <Avatar
                                                        src={space.avatarUrl}
                                                        sx={{
                                                            width: 100,
                                                            height: 100,
                                                            borderRadius: 3,
                                                            border: `2px solid ${themeVar("border")}`,
                                                            opacity: uploadingAvatar ? 0.5 : 1
                                                        }}
                                                    >
                                                        <ImageIcon size={40} />
                                                    </Avatar>
                                                    {uploadingAvatar && (
                                                        <CircularProgress
                                                            size={24}
                                                            sx={{
                                                                position: "absolute",
                                                                top: "50%",
                                                                left: "50%",
                                                                mt: "-12px",
                                                                ml: "-12px",
                                                                color: themeVar("primary")
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                <Box sx={{ position: "absolute", bottom: -8, right: -8, p: 0.5, bgcolor: themeVar("primary"), borderRadius: "50%" }}>
                                                    <Camera size={14} color="white" />
                                                </Box>
                                            </Box>
                                        </Tooltip>
                                        <Tooltip title="Change Cover">
                                            <Box
                                                onClick={() => !uploadingCover && coverInputRef.current?.click()}
                                                sx={{
                                                    flex: 1,
                                                    height: 100,
                                                    borderRadius: 3,
                                                    bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 20%)`,
                                                    border: `2px dashed ${themeVar("border")}`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundImage: space.coverUrl ? `url(${space.coverUrl})` : "none",
                                                    backgroundSize: "cover",
                                                    position: "relative",
                                                    cursor: uploadingCover ? "default" : "pointer",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                {!space.coverUrl && !uploadingCover && <ImageIcon size={24} style={{ color: themeVar("textSecondary") }} />}
                                                {uploadingCover && <CircularProgress size={24} sx={{ color: themeVar("primary") }} />}
                                                {!uploadingCover && (
                                                    <Box sx={{ position: "absolute", bottom: 8, right: 8, p: 1, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 1.5, backdropFilter: "blur(4px)" }}>
                                                        <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>Update Cover Photo</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* Description Section */}
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>SPACE DESCRIPTION</Typography>
                                        {!editingDescription && (
                                            <IconButton size="small" onClick={() => setEditingDescription(true)} sx={{ color: themeVar("primary") }}>
                                                <Edit2 size={14} />
                                            </IconButton>
                                        )}
                                    </Box>
                                    {editingDescription ? (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            <TextField
                                                multiline
                                                rows={3}
                                                fullWidth
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                                placeholder="Enter space description..."
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        color: themeVar("textLight"),
                                                        bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`,
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                                <Button
                                                    size="small"
                                                    onClick={() => setEditingDescription(false)}
                                                    sx={{ color: themeVar("textSecondary") }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={handleUpdateDescription}
                                                    sx={{ bgcolor: themeVar("primary") }}
                                                >
                                                    Save Description
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography sx={{ color: space.description ? themeVar("textLight") : themeVar("textSecondary"), fontStyle: space.description ? "normal" : "italic" }}>
                                            {space.description || "No description set for this space."}
                                        </Typography>
                                    )}
                                </Box>
                            </>
                        )}

                        {currentTab === "activity" && (
                            <Box sx={{ p: 3, borderRadius: 4, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 95%)`, border: `1px solid ${themeVar("primary")}`, borderLeftWidth: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: themeVar("textLight"), mb: 1 }}>Space Overview & Health</Typography>
                                <Typography sx={{ color: themeVar("textSecondary") }}>Use this command center to track member growth, configuration changes, and moderation actions across your space.</Typography>
                            </Box>
                        )}

                        {currentTab === "channels" && (
                            /* Channel Management Section */
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
                                            sx={{ color: themeVar("primary"), fontWeight: 700, textTransform: "none" }}
                                        >
                                            New Channel
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Permission Controls */}
                                <Box sx={{ p: 2, mb: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), display: "block", mb: 2 }}>CHANNEL PERMISSIONS</Typography>
                                    <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontWeight: 600 }}>Admins can edit channels</Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updateChannelPermissions({ spaceId: space._id, adminCanEdit: !(space.adminCanEditChannels ?? true) })}
                                                sx={{
                                                    minWidth: 60,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    fontSize: "0.7rem",
                                                    fontWeight: 900,
                                                    color: (space.adminCanEditChannels ?? true) ? themeVar("success") : themeVar("danger"),
                                                    borderColor: (space.adminCanEditChannels ?? true) ? themeVar("success") : themeVar("danger"),
                                                    "&:hover": { borderColor: (space.adminCanEditChannels ?? true) ? themeVar("success") : themeVar("danger"), bgcolor: "rgba(255,255,255,0.05)" }
                                                }}
                                            >
                                                {(space.adminCanEditChannels ?? true) ? "ON" : "OFF"}
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontWeight: 600 }}>Mods can edit channels</Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updateChannelPermissions({ spaceId: space._id, modCanEdit: !(space.modCanEditChannels ?? false) })}
                                                sx={{
                                                    minWidth: 60,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    fontSize: "0.7rem",
                                                    fontWeight: 900,
                                                    color: (space.modCanEditChannels ?? false) ? themeVar("success") : themeVar("danger"),
                                                    borderColor: (space.modCanEditChannels ?? false) ? themeVar("success") : themeVar("danger"),
                                                    "&:hover": { borderColor: (space.modCanEditChannels ?? false) ? themeVar("success") : themeVar("danger"), bgcolor: "rgba(255,255,255,0.05)" }
                                                }}
                                            >
                                                {(space.modCanEditChannels ?? false) ? "ON" : "OFF"}
                                            </Button>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={4}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontWeight: 600 }}>Admins can post in read-only</Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updateChannelPermissions({ spaceId: space._id, adminCanPostInReadOnly: !(space.adminCanPostInReadOnly ?? false) })}
                                                sx={{
                                                    minWidth: 60,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    fontSize: "0.7rem",
                                                    fontWeight: 900,
                                                    color: (space.adminCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"),
                                                    borderColor: (space.adminCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"),
                                                    "&:hover": { borderColor: (space.adminCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"), bgcolor: "rgba(255,255,255,0.05)" }
                                                }}
                                            >
                                                {(space.adminCanPostInReadOnly ?? false) ? "ON" : "OFF"}
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontWeight: 600 }}>Mods can post in read-only</Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => updateChannelPermissions({ spaceId: space._id, modCanPostInReadOnly: !(space.modCanPostInReadOnly ?? false) })}
                                                sx={{
                                                    minWidth: 60,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    fontSize: "0.7rem",
                                                    fontWeight: 900,
                                                    color: (space.modCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"),
                                                    borderColor: (space.modCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"),
                                                    "&:hover": { borderColor: (space.modCanPostInReadOnly ?? false) ? themeVar("success") : themeVar("danger"), bgcolor: "rgba(255,255,255,0.05)" }
                                                }}
                                            >
                                                {(space.modCanPostInReadOnly ?? false) ? "ON" : "OFF"}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Box>

                                {creatingCategory && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("primary")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
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
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("primary") } } }}
                                                InputProps={{
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                                <Button size="small" onClick={() => { setCreatingCategory(false); setNewCategoryName(""); }} sx={{ color: themeVar("textSecondary"), textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                                                <Button size="small" variant="contained" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} sx={{ bgcolor: themeVar("primary"), color: "white", fontWeight: 900, textTransform: "uppercase" }}>Create</Button>
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {creatingChannel && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("primary")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
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
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("primary") } } }}
                                                InputProps={{
                                                    startAdornment: <Hash size={16} style={{ marginRight: 8, color: themeVar("primary") }} />,
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                                                    }
                                                }}
                                            />

                                            <FormControl fullWidth size="small">
                                                <InputLabel sx={{ color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("primary") } }}>Channel Type</InputLabel>
                                                <Select
                                                    value={newChannelType}
                                                    label="Channel Type"
                                                    onChange={(e) => setNewChannelType(e.target.value as string)}
                                                    sx={{
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") },
                                                        "& .MuiSvgIcon-root": { color: themeVar("textSecondary") }
                                                    }}
                                                    MenuProps={{ PaperProps: { sx: { bgcolor: themeVar("backgroundAlt"), border: `1px solid ${themeVar("border")}` } } }}
                                                >
                                                    <MenuItem value="text">Text Channel</MenuItem>
                                                    <MenuItem value="voice">Voice Channel</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <FormControl fullWidth size="small">
                                                <InputLabel sx={{ color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("primary") } }}>Category (Optional)</InputLabel>
                                                <Select
                                                    value={newChannelCategoryId}
                                                    label="Category (Optional)"
                                                    onChange={(e) => setNewChannelCategoryId(e.target.value as any)}
                                                    sx={{
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") },
                                                        "& .MuiSvgIcon-root": { color: themeVar("textSecondary") }
                                                    }}
                                                    MenuProps={{ PaperProps: { sx: { bgcolor: themeVar("backgroundAlt"), border: `1px solid ${themeVar("border")}` } } }}
                                                >
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {categories?.sort((a: any, b: any) => a.order - b.order).map((cat: any) => (
                                                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                                <Button
                                                    size="small"
                                                    onClick={() => { setCreatingChannel(false); setNewChannelName(""); setNewChannelCategoryId(""); }}
                                                    sx={{
                                                        color: themeVar("textSecondary"),
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        "&:hover": { color: themeVar("textLight") }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={handleCreateChannel}
                                                    disabled={!newChannelName.trim()}
                                                    sx={{
                                                        bgcolor: themeVar("primary"),
                                                        color: "white",
                                                        fontWeight: 900,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        px: 3,
                                                        "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
                                                    }}
                                                >
                                                    Create Channel
                                                </Button>
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
                                    {categories?.sort((a: any, b: any) => a.order - b.order).map((category: any) => (
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
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), opacity: 1, textAlign: "center", py: 4, fontStyle: "italic" }}>
                                            No categories or channels created yet.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {currentTab === "members" && (
                            /* Member Management Section */
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
                                <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
                                    {members?.filter((m: any) =>
                                        m.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        m.user?._id.toString().includes(searchQuery)
                                    ).map((member: any) => (
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
                                                "&:hover": { borderColor: themeVar("primary") }
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
                                                        bgcolor: member.role === "owner" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : member.role === "admin" ? "rgba(0,120,255,0.1)" : member.role === "moderator" ? "rgba(255,165,0,0.1)" : "rgba(0,0,0,0.2)",
                                                        border: `1px solid ${member.role === "owner" ? themeVar("primary") : member.role === "admin" ? "rgba(0,120,255,0.3)" : member.role === "moderator" ? "rgba(255,165,0,0.3)" : themeVar("border")}`,
                                                        mr: 1
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: member.role === "owner" ? themeVar("primary") : member.role === "admin" ? "#00aaff" : member.role === "moderator" ? "#ffaa00" : themeVar("textSecondary") }}>
                                                        {member.role.toUpperCase()}
                                                    </Typography>
                                                </Box>

                                                {member.userId !== space.ownerId && (
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {member.role === "member" && (
                                                            <>
                                                                <Tooltip title="Promote to Moderator">
                                                                    <IconButton size="small" sx={{ color: themeVar("warning") }} onClick={() => setRole({ spaceId: space._id, userId: member.userId, role: "moderator" })}>
                                                                        <Shield size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Promote to Admin">
                                                                    <IconButton size="small" sx={{ color: themeVar("primary") }} onClick={() => setRole({ spaceId: space._id, userId: member.userId, role: "admin" })}>
                                                                        <Activity size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {(member.role === "admin" || member.role === "moderator") && (
                                                            <Tooltip title="Demote to Member">
                                                                <IconButton size="small" sx={{ color: themeVar("textSecondary") }} onClick={() => setRole({ spaceId: space._id, userId: member.userId, role: "member" })}>
                                                                    <UserMinus size={16} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Kick Member">
                                                            <IconButton size="small" sx={{ color: themeVar("danger") }} onClick={() => { if (window.confirm(`Kick ${member.user?.displayName}?`)) setRole({ spaceId: space._id, userId: member.userId, role: "none" }); }}>
                                                                <UserMinus size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {currentTab === "invites" && (
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                {/* Admin Management Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2 }}>ADMIN MANAGEMENT</Typography>
                                    <Stack spacing={1}>
                                        {admins?.map((admin: any) => (
                                            <Box
                                                key={admin._id}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: admin.userId === selectedAdminId ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`,
                                                    border: `1px solid ${admin.userId === selectedAdminId ? themeVar("primary") : themeVar("border")}`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": { borderColor: themeVar("primary") }
                                                }}
                                                onClick={() => setSelectedAdminId(admin.userId)}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                    <Avatar src={admin.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{admin.user?.displayName || "User"}</Typography>
                                                        <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            {admin.role === "owner" ? <Crown size={12} /> : admin.role === "admin" ? <Activity size={12} /> : <ShieldAlert size={12} />}
                                                            {admin.role.toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                    <Box sx={{ textAlign: "right" }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("textLight") }}>
                                                            {actionStats?.find((s: any) => s.admin?._id === admin.userId)?.total ?? 0}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Actions</Typography>
                                                    </Box>
                                                    {admin.role !== "owner" && (
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("danger") }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRole({ spaceId: space._id, userId: admin.userId, role: "member" });
                                                            }}
                                                        >
                                                            <UserMinus size={18} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>

                                {/* Invite Management Section */}
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 0.5 }}>INVITE MANAGEMENT</Typography>
                                            <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Control how people join your space.</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={space.allowInvites === false ? <Unlock size={14} /> : <Lock size={14} />}
                                            onClick={() => toggleInvites({ spaceId: space._id, allowInvites: !(space.allowInvites ?? true) })}
                                            sx={{
                                                color: space.allowInvites === false ? themeVar("success") : themeVar("danger"),
                                                borderColor: space.allowInvites === false ? themeVar("success") : themeVar("danger"),
                                                fontWeight: 800,
                                                textTransform: "none",
                                                "&:hover": { borderColor: space.allowInvites === false ? themeVar("success") : themeVar("danger"), opacity: 0.8 }
                                            }}
                                        >
                                            {space.allowInvites === false ? "Enable All Invites" : "Block All Invites"}
                                        </Button>
                                    </Box>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                                                    sx={{ color: themeVar("primary") }}
                                                >
                                                    <Plus size={18} />
                                                </IconButton>
                                            </Box>
                                            <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
                                                {invites?.map((invite: any) => (
                                                    <Box key={invite._id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}` }}>
                                                        <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                                                            <Typography sx={{ fontWeight: 900, color: themeVar("primary"), letterSpacing: "0.1em", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{invite.code}</Typography>
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
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("primary"), whiteSpace: "nowrap", flexShrink: 0 }}>{entry.count} joined</Typography>
                                                    </Box>
                                                ))}
                                                {(!leaderboard || leaderboard.length === 0) && (
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", textAlign: "center", py: 2 }}>No invites tracked yet.</Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
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
                                    </Box>
                                </Box>

                                <Box sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("border")}` }}>
                                    <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                                        Upload custom emojis for your space. Users can use them to react to messages.
                                    </Typography>

                                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                        <TextField
                                            size="small"
                                            label="Emoji Name"
                                            value={emojiName}
                                            onChange={(e) => setEmojiName(e.target.value.toLowerCase())}
                                            inputProps={{ maxLength: 20 }}
                                            sx={{
                                                flex: 1,
                                                "& .MuiInputLabel-root": { color: themeVar("textSecondary") },
                                                "& .MuiOutlinedInput-root": { color: themeVar("textLight") }
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
                                            sx={{ bgcolor: themeVar("primary"), fontWeight: 900 }}
                                        >
                                            {uploadingEmoji ? "Uploading..." : "Upload Image"}
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                ref={emojiFileInputRef}
                                                onChange={handleUploadEmoji}
                                            />
                                        </Button>
                                    </Stack>
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
                                                    "&:hover .delete-btn": { opacity: 1 }
                                                }}
                                            >
                                                <img src={emoji.url || ""} alt={emoji.name} style={{ width: 40, height: 40, objectFit: "contain" }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: themeVar("primary"),
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
                                                    onClick={() => handleDeleteEmoji(emoji._id, emoji.name)}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 2,
                                                        right: 2,
                                                        opacity: 0,
                                                        transition: "opacity 0.2s",
                                                        color: themeVar("danger"),
                                                        bgcolor: "rgba(0,0,0,0.5)",
                                                        "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </IconButton>
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {currentTab === "bans" && (
                            <Box>
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

                    {(currentTab === "general" || currentTab === "activity") && (
                        /* Right Column: Global Feed & Admin Detail */
                        <Stack spacing={4}>
                            <Box sx={{ bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, borderRadius: 3, border: `1px solid ${themeVar("border")}`, p: 2, height: "100%", maxHeight: 450, display: "flex", flexDirection: "column" }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Activity size={16} /> RECENT ACTIONS
                                </Typography>
                                <Box sx={{ flex: 1, overflowY: "auto" }}>
                                    <Stack spacing={2}>
                                        {globalActions?.map((action: any) => (
                                            <Box key={action._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.1)", borderLeft: `3px solid ${themeVar("primary")}` }}>
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

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Shield size={18} />}
                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                    sx={{
                                        flex: 1,
                                        borderColor: themeVar("border"),
                                        color: themeVar("textLight"),
                                        fontWeight: 700,
                                        textTransform: "none",
                                        py: 1.5,
                                        borderRadius: 3,
                                        "&:hover": { borderColor: themeVar("primary"), bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 95%)` }
                                    }}
                                >
                                    Elevate Admin
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<ShieldAlert size={18} />}
                                    onClick={(e) => {
                                        setAnchorEl(e.currentTarget);
                                        setPromotingRole("moderator");
                                    }}
                                    sx={{
                                        flex: 1,
                                        borderColor: themeVar("border"),
                                        color: themeVar("textLight"),
                                        fontWeight: 700,
                                        textTransform: "none",
                                        py: 1.5,
                                        borderRadius: 3,
                                        "&:hover": { borderColor: themeVar("warning"), bgcolor: `color-mix(in oklab, ${themeVar("warning")}, transparent 95%)` }
                                    }}
                                >
                                    Appoint Mod
                                </Button>
                            </Stack>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={() => {
                                    setAnchorEl(null);
                                    setPromotingRole("admin");
                                }}
                                PaperProps={{
                                    sx: {
                                        bgcolor: themeVar("backgroundAlt"),
                                        border: `1px solid ${themeVar("border")}`,
                                        borderRadius: 3,
                                        maxHeight: 300,
                                        width: 300,
                                        mt: 1,
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                                    }
                                }}
                            >
                                <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${themeVar("border")}` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>SELECT MEMBER TO PROMOTE</Typography>
                                </Box>
                                {members?.filter(m => m.role === "member").map((member: any) => (
                                    <MenuItem
                                        key={member._id}
                                        onClick={() => {
                                            setRole({ spaceId: space._id, userId: member.userId, role: promotingRole });
                                            setAnchorEl(null);
                                            setPromotingRole("admin");
                                        }}
                                        sx={{
                                            gap: 2,
                                            py: 1.5,
                                            "&:hover": { bgcolor: `color-mix(in oklab, ${promotingRole === "admin" ? themeVar("primary") : themeVar("warning")}, transparent 90%)` }
                                        }}
                                    >
                                        <Avatar src={member.user?.avatarUrl} sx={{ width: 32, height: 32 }} />
                                        <Typography sx={{ color: themeVar("textLight"), fontWeight: 600 }}>{member.user?.displayName}</Typography>
                                    </MenuItem>
                                ))}
                                {members?.filter(m => m.role === "member").length === 0 && (
                                    <Box sx={{ px: 2, py: 2, textAlign: "center" }}>
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary") }}>No members available to promote.</Typography>
                                    </Box>
                                )}
                            </Menu>
                        </Stack>
                    )}
                </Box>
            </Stack>

            {/* Admin Detail View */}
            {selectedAdminId && (
                <AdminDetailView
                    spaceId={space._id}
                    adminId={selectedAdminId}
                    onClose={() => setSelectedAdminId(null)}
                />
            )}

            {/* Inviter Detail View */}
            {selectedInviterId && (
                <InviterDetailView
                    spaceId={space._id}
                    inviterId={selectedInviterId}
                    onClose={() => setSelectedInviterId(null)}
                />
            )}
            {/* Setup Welcome Category Dialog */}
            <Dialog open={setupWelcomeOpen} onClose={() => setSetupWelcomeOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: themeVar("backgroundAlt"), color: themeVar("textLight"), backgroundImage: "none" } }}>
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
                    <Button onClick={() => setSetupWelcomeOpen(false)} sx={{ color: themeVar("textSecondary") }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            await setupWelcomeCategory({ spaceId: space._id, rulesItems: welcomeRules as any });
                            setSetupWelcomeOpen(false);
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
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, border: `1px solid ${themeVar("primary")}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("primary"), display: "block", mb: 0.5 }}>TOTAL RECRUITED</Typography>
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

function AdminDetailView({ spaceId, adminId, onClose }: { spaceId: Id<"spaces">; adminId: Id<"users">; onClose: () => void }) {
    const admin = useQuery(api.users.onboarding.queries.getUserById, { userId: adminId });
    const actions = useQuery(api.spaces.audit.getActionsByAdmin, { spaceId, adminId });

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
            <style>
                {`
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}
            </style>
            <Box sx={{ p: 3, borderBottom: `1px solid ${themeVar("border")}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={admin?.avatarUrl} />
                    <Box>
                        <Typography sx={{ fontWeight: 800, color: themeVar("textLight") }}>{admin?.displayName}</Typography>
                        <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Admin Action History</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: themeVar("textSecondary") }}><X size={20} /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
                <Stack spacing={2}>
                    {actions?.map((action: any) => (
                        <Box key={action._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)", border: `1px solid ${themeVar("border")}` }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Clock size={12} style={{ color: themeVar("primary") }} />
                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>
                                    {new Date(action.timestamp).toLocaleDateString()} at {new Date(action.timestamp).toLocaleTimeString()}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontWeight: 500 }}>{action.details}</Typography>
                            <Typography variant="caption" sx={{ color: themeVar("primary"), mt: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 800 }}>
                                {action.actionType.replace("_", " ")}
                            </Typography>
                        </Box>
                    ))}
                    {actions?.length === 0 && (
                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", mt: 4 }}>
                            No actions recorded for this admin.
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}`, minWidth: 140 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {icon}
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("textSecondary"), textTransform: "uppercase" }}>{label}</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("textLight") }}>{value}</Typography>
        </Box>
    );
}
