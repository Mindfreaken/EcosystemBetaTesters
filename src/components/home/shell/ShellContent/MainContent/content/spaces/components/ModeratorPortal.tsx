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
    Activity,
    UserMinus,
    Search,
    ShieldAlert,
    Users,
    X,
    Info,
    Hash,
    Edit2,
    Check,
    MessageSquarePlus,
    Trash2,
    Plus
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

interface ModeratorPortalProps {
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

export default function ModeratorPortal({ space }: ModeratorPortalProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId: space._id });
    const globalActions = useQuery(api.spaces.audit.getAdminActions, { spaceId: space._id });
    const bans = useQuery(api.spaces.moderation.getSpaceBans, { spaceId: space._id });
    const timeouts = useQuery(api.spaces.moderation.getSpaceTimeouts, { spaceId: space._id });
    const kickMember = useMutation(api.spaces.members.kickMember);
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

    const [searchQuery, setSearchQuery] = React.useState("");
    const [currentTab, setCurrentTab] = React.useState(0);
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
        if (window.confirm(`Are you sure you want to delete #${name}?`)) {
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
                        <Typography sx={{ display: "flex", alignItems: "center", gap: 1, color: themeVar("warning"), fontWeight: 700, mb: 1, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <ShieldAlert size={16} /> Moderator Hub
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("textLight") }}>Community Moderation</Typography>
                        <Typography sx={{ color: themeVar("textSecondary"), mt: 0.5 }}>Protect and serve the #{space.name} community.</Typography>
                    </Box>

                    {/* Quick Info */}
                    <Box sx={{ p: 1.5, px: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("warning")}, transparent 95%)`, border: `1px solid ${themeVar("warning")}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Info size={16} color={themeVar("warning")} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("textSecondary") }}>Logged-in as Moderator</Typography>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: themeVar("border") }} />

                <Tabs
                    value={currentTab}
                    onChange={(_, val) => setCurrentTab(val)}
                    sx={{
                        borderBottom: `1px solid ${themeVar("border")}`,
                        "& .MuiTab-root": { color: themeVar("textSecondary"), fontWeight: 700, textTransform: "none", fontSize: "0.875rem", minWidth: 100 },
                        "& .Mui-selected": { color: themeVar("warning") },
                        "& .MuiTabs-indicator": { backgroundColor: themeVar("warning") }
                    }}
                >
                    <Tab label="Activity" />
                    <Tab label="Members" />
                    <Tab label="Bans & Timeouts" />
                    {(space.modCanEditChannels ?? false) && <Tab label="Channels" />}
                </Tabs>

                <Box sx={{ display: "grid", gridTemplateColumns: currentTab === 0 ? "1fr 350px" : "1fr", gap: 4 }}>
                    <Stack spacing={4}>
                        {currentTab === 1 && (
                            /* Member Management */
                            <Box sx={{ maxWidth: 800 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>QUICK ACTIONS</Typography>
                                    <TextField
                                        size="small"
                                        placeholder="Search users to moderate..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search size={14} color={themeVar("warning")} /></InputAdornment>,
                                            sx: {
                                                fontSize: "0.875rem",
                                                height: 40,
                                                bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 30%)`,
                                                border: `1px solid ${themeVar("border")}`,
                                                color: themeVar("textLight"),
                                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                "&:hover": { bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 10%)` },
                                                "&.Mui-focused": { border: `1px solid ${themeVar("warning")}` }
                                            }
                                        }}
                                    />
                                </Box>
                                <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
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
                                                "&:hover": { borderColor: themeVar("warning") }
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar src={member.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: themeVar("textLight") }}>{member.user?.displayName || "User"}</Typography>
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>Role: {member.role}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {member.role === "member" ? (
                                                    <Tooltip title="Kick Member">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("danger"), bgcolor: "rgba(0,0,0,0.2)", "&:hover": { bgcolor: themeVar("danger"), color: "white" } }}
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to kick ${member.user?.displayName}?`)) {
                                                                    kickMember({ spaceId: space._id, targetUserId: member.userId });
                                                                }
                                                            }}
                                                        >
                                                            <UserMinus size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontStyle: "italic", opacity: 0.5 }}>ProtectedStaff</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                    {filteredMembers?.length === 0 && (
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4 }}>No community members found.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {currentTab === 0 && (
                            <Box sx={{ p: 3, borderRadius: 4, bgcolor: `color-mix(in oklab, ${themeVar("warning")}, transparent 95%)`, border: `1px solid ${themeVar("warning")}`, borderLeftWidth: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: themeVar("textLight"), mb: 1 }}>Moderator Overview</Typography>
                                <Typography sx={{ color: themeVar("textSecondary") }}>Logged in as space staff. Monitor user behavior and maintain space quality.</Typography>
                            </Box>
                        )}

                        {currentTab === 2 && (space.modCanEditChannels ?? false) && (
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
                                            sx={{ color: themeVar("warning"), fontWeight: 700, textTransform: "none" }}
                                        >
                                            New Channel
                                        </Button>
                                    </Box>
                                </Box>

                                {creatingCategory && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("warning")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
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
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("warning") } } }}
                                                InputProps={{
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("warning") }
                                                    }
                                                }}
                                            />
                                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                                <Button size="small" onClick={() => { setCreatingCategory(false); setNewCategoryName(""); }} sx={{ color: themeVar("textSecondary"), textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                                                <Button size="small" variant="contained" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} sx={{ bgcolor: themeVar("warning"), color: "black", fontWeight: 900, textTransform: "uppercase" }}>Create</Button>
                                            </Box>
                                        </Stack>
                                    </Box>
                                )}

                                {creatingChannel && (
                                    <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("background")}, white 1%)`, border: `1px solid ${themeVar("warning")}`, boxShadow: `0 4px 20px rgba(0,0,0,0.4)` }}>
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
                                                InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("warning") } } }}
                                                InputProps={{
                                                    startAdornment: <Hash size={16} style={{ marginRight: 8, color: themeVar("warning") }} />,
                                                    sx: {
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("warning") }
                                                    }
                                                }}
                                            />

                                            <FormControl fullWidth size="small">
                                                <InputLabel sx={{ color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("warning") } }}>Category (Optional)</InputLabel>
                                                <Select
                                                    value={newChannelCategoryId}
                                                    label="Category (Optional)"
                                                    onChange={(e) => setNewChannelCategoryId(e.target.value as any)}
                                                    sx={{
                                                        color: themeVar("textLight"),
                                                        bgcolor: "rgba(0,0,0,0.2)",
                                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("warning") },
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
                                                        bgcolor: themeVar("warning"),
                                                        color: "black",
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

                        {currentTab === 2 && (
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

                    {currentTab === 0 && (
                        /* Right Column: Global Feed */
                        <Box sx={{ bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, borderRadius: 3, border: `1px solid ${themeVar("border")}`, p: 2, height: "100%", maxHeight: 600, display: "flex", flexDirection: "column" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Activity size={16} /> RECENT LOGS
                            </Typography>
                            <Box sx={{ flex: 1, overflowY: "auto" }}>
                                <Stack spacing={2}>
                                    {globalActions?.map((action: any) => (
                                        <Box key={action._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.1)", borderLeft: `3px solid ${themeVar("warning")}` }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Avatar src={action.admin?.avatarUrl} sx={{ width: 20, height: 20 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("textLight") }}>{action.admin?.displayName}</Typography>
                                                <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>• {new Date(action.timestamp).toLocaleTimeString()}</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: themeVar("textSecondary"), fontSize: "0.8rem" }}>{action.details}</Typography>
                                        </Box>
                                    ))}
                                    {(!globalActions || globalActions.length === 0) && (
                                        <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4 }}>Audit logs are empty.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Stack>

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

export function RenderChannelItem({
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
                    InputLabelProps={{ sx: { color: themeVar("textSecondary"), "&.Mui-focused": { color: themeVar("warning") } } }}
                    InputProps={{
                        startAdornment: <Hash size={16} style={{ marginRight: 8, color: themeVar("warning") }} />,
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
                <IconButton size="small" onClick={() => onStartEdit(channel._id, channel.name, channel.categoryId)} sx={{ color: themeVar("warning"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                    <Edit2 size={16} />
                </IconButton>
                <IconButton size="small" onClick={onDelete} sx={{ color: themeVar("danger"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                    <Trash2 size={16} />
                </IconButton>
            </Box>
        </Box>
    );
}
