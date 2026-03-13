"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { Plus, MessageSquarePlus, Trash2, X, Check, Edit2, GripVertical, MessageSquare, Lock, Volume2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";

interface ChannelsTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
    userRole?: string;
    canManageChannels: boolean;
}


export default function ChannelsTab({ space, role, userRole, canManageChannels }: ChannelsTabProps) {
    const channels = useQuery(api.spaces.channels.getChannels, { spaceId: space._id });
    const categories = useQuery(api.spaces.channels.getCategories, { spaceId: space._id });
    const createChannel = useMutation(api.spaces.channels.createChannel);
    const updateChannel = useMutation(api.spaces.channels.updateChannel);
    const deleteChannel = useMutation(api.spaces.channels.deleteChannel);
    const updateChannelPermissions = useMutation(api.spaces.channels.updateChannelPermissions);

    const createCategory = useMutation(api.spaces.channels.createCategory);
    const updateCategory = useMutation(api.spaces.channels.updateCategory);
    const deleteCategory = useMutation(api.spaces.channels.deleteCategory);
    const reorderCategories = useMutation(api.spaces.channels.reorderCategories);
    const reorderChannels = useMutation(api.spaces.channels.reorderChannels);

    const [creatingChannel, setCreatingChannel] = React.useState(false);
    const [newChannelName, setNewChannelName] = React.useState("");
    const [newChannelCategoryId, setNewChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");
    const [newChannelIsReadOnly, setNewChannelIsReadOnly] = React.useState(false);
    const [newChannelType, setNewChannelType] = React.useState<"text" | "voice">("text");

    const [editingChannelId, setEditingChannelId] = React.useState<Id<"spaceChannels"> | null>(null);
    const [editingChannelName, setEditingChannelName] = React.useState("");
    const [editingChannelCategoryId, setEditingChannelCategoryId] = React.useState<Id<"spaceCategories"> | "">("");
    const [editingChannelIsReadOnly, setEditingChannelIsReadOnly] = React.useState(false);

    const [creatingCategory, setCreatingCategory] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState("");
    const [editingCategoryId, setEditingCategoryId] = React.useState<Id<"spaceCategories"> | null>(null);
    const [editingCategoryName, setEditingCategoryName] = React.useState("");
    const [channelToDelete, setChannelToDelete] = React.useState<{ id: Id<"spaceChannels">, name: string } | null>(null);
    const [categoryToDelete, setCategoryToDelete] = React.useState<{ id: Id<"spaceCategories">, name: string } | null>(null);

    const canEditPermissions = userRole === "owner";
    const isSpaceAdmin = userRole === "admin";
    const isMod = userRole === "moderator";
    const isOwner = userRole === "owner";

    if (!canManageChannels) {
        return <Typography sx={{ color: themeVar("mutedForeground"), p: 4 }}>You do not have permission to manage channels.</Typography>;
    }


    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            await createChannel({
                spaceId: space._id,
                name: newChannelName,
                type: newChannelType,
                categoryId: newChannelCategoryId === "" ? undefined : newChannelCategoryId as Id<"spaceCategories">,
                isReadOnly: newChannelIsReadOnly
            });
            setNewChannelName("");
            setNewChannelCategoryId("");
            setNewChannelIsReadOnly(false);
            setNewChannelType("text");
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
                categoryId: editingChannelCategoryId === "" ? undefined : editingChannelCategoryId as Id<"spaceCategories">,
                isReadOnly: editingChannelIsReadOnly
            });
            setEditingChannelId(null);
            setEditingChannelName("");
            setEditingChannelCategoryId("");
            setEditingChannelIsReadOnly(false);
        } catch (error) {
            console.error("Error updating channel:", error);
        }
    };

    const handleDeleteChannel = async () => {
        if (channelToDelete) {
            await deleteChannel({ channelId: channelToDelete.id });
            setChannelToDelete(null);
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

    const handleDeleteCategory = async () => {
        if (categoryToDelete) {
            await deleteCategory({ categoryId: categoryToDelete.id });
            setCategoryToDelete(null);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === "category") {
            const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);
            const [removed] = sortedCategories.splice(source.index, 1);
            sortedCategories.splice(destination.index, 0, removed);

            const updates = sortedCategories.map((cat, index) => ({
                id: cat._id,
                order: index
            }));
            await reorderCategories({ spaceId: space._id, categories: updates });
            return;
        }

        const sourceCatId = source.droppableId === "uncategorized" ? undefined : source.droppableId as Id<"spaceCategories">;
        const destCatId = destination.droppableId === "uncategorized" ? undefined : destination.droppableId as Id<"spaceCategories">;

        const allChannels = Array.from(channels || []);
        const channelToMove = allChannels.find(c => c._id === draggableId);
        if (!channelToMove) return;

        const sourceChannels = allChannels
            .filter(c => c.categoryId === sourceCatId)
            .sort((a, b) => (a.channelOrder || 0) - (b.channelOrder || 0));

        const movedInSource = sourceChannels.splice(source.index, 1)[0];

        if (source.droppableId === destination.droppableId) {
            sourceChannels.splice(destination.index, 0, movedInSource);
            const updates = sourceChannels.map((ch, index) => ({
                id: ch._id as Id<"spaceChannels">,
                channelOrder: index,
                categoryId: sourceCatId
            }));
            await reorderChannels({ spaceId: space._id, channels: updates });
        } else {
            const destChannels = allChannels
                .filter(c => c.categoryId === destCatId)
                .sort((a, b) => (a.channelOrder || 0) - (b.channelOrder || 0));

            destChannels.splice(destination.index, 0, movedInSource);

            const sourceUpdates = sourceChannels.map((ch, index) => ({
                id: ch._id as Id<"spaceChannels">,
                channelOrder: index,
                categoryId: sourceCatId
            }));
            const destUpdates = destChannels.map((ch, index) => ({
                id: ch._id as Id<"spaceChannels">,
                channelOrder: index,
                categoryId: destCatId
            }));

            await reorderChannels({ spaceId: space._id, channels: [...sourceUpdates, ...destUpdates] });
        }
    };

    const renderToggle = (label: string, value: boolean, onChange: () => void) => (
        <Box
            onClick={onChange}
            sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                p: 2, borderRadius: 3,
                bgcolor: "rgba(0,0,0,0.15)",
                border: `1px solid ${value ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    bgcolor: "rgba(0,0,0,0.25)",
                    borderColor: value ? themeVar("primary") : "rgba(255,255,255,0.15)",
                }
            }}
        >
            <Typography variant="body2" sx={{ color: themeVar("foreground"), fontWeight: 600 }}>{label}</Typography>
            <Box
                sx={{
                    width: 44, height: 24, borderRadius: 12,
                    bgcolor: value ? themeVar("primary") : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "background-color 0.3s ease"
                }}
            >
                <Box
                    sx={{
                        width: 18, height: 18, borderRadius: "50%",
                        bgcolor: "white",
                        position: "absolute", top: 3,
                        left: value ? 23 : 3,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 4 }}>
            {/* Left Column: Management */}
            <Box sx={{ flex: 1 }}>
                <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeVar("foreground") }}>Space Control Center</Typography>
                        <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>Manage categories and channel structure.</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Button
                            startIcon={<Plus size={16} />} onClick={() => setCreatingCategory(true)}
                            sx={{ color: themeVar("mutedForeground"), bgcolor: "rgba(255,255,255,0.05)", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                            Category
                        </Button>
                        <Button
                            variant="contained" startIcon={<MessageSquarePlus size={16} />} onClick={() => setCreatingChannel(true)}
                            sx={{
                                bgcolor: themeVar("primary"), color: "white", textTransform: "none", fontWeight: 800, px: 2,
                                "&:hover": {
                                    bgcolor: themeVar("primary"),
                                    filter: "brightness(1.1)",
                                    boxShadow: `0 4px 12px color-mix(in oklab, ${themeVar("primary")}, transparent 50%)`,
                                },
                                transition: "all 0.2s ease"
                            }}
                        >
                            New Channel
                        </Button>
                    </Box>
                </Box>

                {/* Create Category Modal */}
                <Dialog 
                    open={creatingCategory} 
                    onClose={() => { setCreatingCategory(false); setNewCategoryName(""); }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)',
                            }
                        }
                    }}
                    PaperProps={{
                        sx: {
                            bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                            backdropFilter: "blur(12px)",
                            borderRadius: "9px",
                            border: `1px solid ${themeVar("border")}`,
                            backgroundImage: "none",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            width: "100%",
                            maxWidth: 400
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        fontWeight: 900, 
                        color: themeVar("foreground"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1
                    }}>
                        Create Category
                        <IconButton size="small" onClick={() => { setCreatingCategory(false); setNewCategoryName(""); }} sx={{ color: themeVar("mutedForeground") }}>
                            <X size={18} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ py: 1 }}>
                            <TextField
                                size="small" fullWidth label="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. text channels" autoFocus
                                InputLabelProps={{ sx: { color: themeVar("mutedForeground"), "&.Mui-focused": { color: themeVar("primary") } } }}
                                InputProps={{ sx: { color: themeVar("foreground"), bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") } } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
                        <Button onClick={() => { setCreatingCategory(false); setNewCategoryName(""); }} sx={{ color: themeVar("mutedForeground"), fontWeight: 700, textTransform: "none" }}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateCategory} disabled={!newCategoryName.trim()} sx={{ bgcolor: themeVar("primary"), color: "white", fontWeight: 900, px: 3, borderRadius: 2 }}>Create</Button>
                    </DialogActions>
                </Dialog>

                {/* Create Channel Modal */}
                <Dialog 
                    open={creatingChannel} 
                    onClose={() => { setCreatingChannel(false); setNewChannelName(""); }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)',
                            }
                        }
                    }}
                    PaperProps={{
                        sx: {
                            bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                            backdropFilter: "blur(12px)",
                            borderRadius: "9px",
                            border: `1px solid ${themeVar("border")}`,
                            backgroundImage: "none",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            width: "100%",
                            maxWidth: 450
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        fontWeight: 900, 
                        color: themeVar("foreground"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1
                    }}>
                        Create Channel
                        <IconButton size="small" onClick={() => { setCreatingChannel(false); setNewChannelName(""); }} sx={{ color: themeVar("mutedForeground") }}>
                            <X size={18} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ py: 1 }}>
                            <TextField
                                size="small" fullWidth label="Channel Name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. general" autoFocus
                                InputLabelProps={{
                                    shrink: true,
                                    sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                                }}
                                InputProps={{
                                    startAdornment: newChannelType === "text" ? <MessageSquare size={16} style={{ marginRight: 8, color: themeVar("primary") }} /> : <Volume2 size={16} style={{ marginRight: 8, color: themeVar("primary") }} />,
                                    sx: {
                                        color: themeVar("foreground"),
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        borderRadius: 2,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 }
                                    }
                                }}
                            />

                            <Box sx={{ p: 0.5, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2, display: "flex", gap: 0.5 }}>
                                <Button
                                    fullWidth size="small"
                                    onClick={() => setNewChannelType("text")}
                                    variant={newChannelType === "text" ? "contained" : "text"}
                                    startIcon={<MessageSquare size={14} />}
                                    sx={{
                                        textTransform: "none", borderRadius: 1.5, fontWeight: 700,
                                        bgcolor: newChannelType === "text" ? themeVar("primary") : "transparent",
                                        color: newChannelType === "text" ? "white" : themeVar("mutedForeground"),
                                        "&:hover": { bgcolor: newChannelType === "text" ? themeVar("primary") : "rgba(255,255,255,0.05)" }
                                    }}
                                >
                                    Text
                                </Button>
                                <Button
                                    fullWidth size="small"
                                    onClick={() => setNewChannelType("voice")}
                                    variant={newChannelType === "voice" ? "contained" : "text"}
                                    startIcon={<Volume2 size={14} />}
                                    sx={{
                                        textTransform: "none", borderRadius: 1.5, fontWeight: 700,
                                        bgcolor: newChannelType === "voice" ? themeVar("primary") : "transparent",
                                        color: newChannelType === "voice" ? "white" : themeVar("mutedForeground"),
                                        "&:hover": { bgcolor: newChannelType === "voice" ? themeVar("primary") : "rgba(255,255,255,0.05)" }
                                    }}
                                >
                                    Voice
                                </Button>
                            </Box>

                            <FormControl fullWidth size="small">
                                <InputLabel shrink sx={{ color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }}>Category (Optional)</InputLabel>
                                <Select
                                    value={newChannelCategoryId} label="Category (Optional)" onChange={(e) => setNewChannelCategoryId(e.target.value as any)}
                                    sx={{
                                        color: themeVar("foreground"),
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        borderRadius: 2,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 },
                                        "& .MuiSvgIcon-root": { color: themeVar("mutedForeground") }
                                    }}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: themeVar("muted"), border: `1px solid ${themeVar("border")}`, borderRadius: 2 } } }}
                                >
                                    <MenuItem value="" sx={{ color: themeVar("foreground") }}><em>None</em></MenuItem>
                                    {categories?.sort((a, b) => a.order - b.order).map(cat => (
                                        <MenuItem key={cat._id} value={cat._id} sx={{ color: themeVar("foreground") }}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {renderToggle(newChannelType === "voice" ? "Staff Only Channel" : "Read-Only Channel (Staff Only)", newChannelIsReadOnly, () => setNewChannelIsReadOnly(!newChannelIsReadOnly))}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
                        <Button onClick={() => { setCreatingChannel(false); setNewChannelName(""); setNewChannelCategoryId(""); setNewChannelIsReadOnly(false); }} sx={{ color: themeVar("mutedForeground"), fontWeight: 700, textTransform: "none" }}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateChannel} disabled={!newChannelName.trim()} sx={{ bgcolor: themeVar("primary"), color: "white", fontWeight: 900, px: 3, borderRadius: 2 }}>Create Channel</Button>
                    </DialogActions>
                </Dialog>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="categories" type="category">
                        {(provided) => (
                            <Stack spacing={3} ref={provided.innerRef} {...provided.droppableProps}>
                                {/* Uncategorized Channels */}
                                <Box>
                                    <Droppable droppableId="uncategorized" type="channel">
                                        {(pProvided) => (
                                            <Box ref={pProvided.innerRef} {...pProvided.droppableProps}>
                                                {channels?.filter(c => !c.categoryId).length !== undefined && channels.filter(c => !c.categoryId).length > 0 && (
                                                    <Typography variant="overline" sx={{ display: "block", color: themeVar("mutedForeground"), fontWeight: 800, mb: 1, pl: 1 }}>Uncategorized</Typography>
                                                )}
                                                <Stack spacing={1}>
                                                    {channels?.filter(c => !c.categoryId)
                                                        .sort((a, b) => (a.channelOrder || 0) - (b.channelOrder || 0))
                                                        .map((channel, idx) => (
                                                            <RenderChannelItem
                                                                key={channel._id} channel={channel} categories={categories} editingId={editingChannelId} editingName={editingChannelName} editingCategoryId={editingChannelCategoryId} editingIsReadOnly={editingChannelIsReadOnly}
                                                                onStartEdit={(id: Id<"spaceChannels">, name: string, catId: Id<"spaceCategories"> | undefined, isRO: boolean | undefined) => { setEditingChannelId(id); setEditingChannelName(name); setEditingChannelCategoryId(catId || ""); setEditingChannelIsReadOnly(!!isRO); }}
                                                                onCancelEdit={() => { setEditingChannelId(null); setEditingChannelName(""); setEditingChannelCategoryId(""); setEditingChannelIsReadOnly(false); }}
                                                                onChangeName={(e: React.ChangeEvent<HTMLInputElement>) => setEditingChannelName(e.target.value)}
                                                                onChangeCategory={(e: any) => setEditingChannelCategoryId(e.target.value as any)}
                                                                onChangeIsReadOnly={(val: boolean) => setEditingChannelIsReadOnly(val)}
                                                                onSaveEdit={handleUpdateChannel} onDelete={() => setChannelToDelete({ id: channel._id, name: channel.name })} index={idx}
                                                            />
                                                        ))}
                                                    {pProvided.placeholder}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Droppable>
                                </Box>

                                {/* Categorized Channels */}
                                {(categories || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((category, index) => (
                                    <Draggable key={category._id} draggableId={category._id} index={index}>
                                        {(draggableProvided) => (
                                            <Box
                                                ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps}
                                                sx={{ bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 30%)`, p: 0, borderRadius: 3, border: `1px solid ${themeVar("border")}`, overflow: "hidden" }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`, borderBottom: `1px solid ${themeVar("border")}`, "&:hover .cat-actions": { opacity: 1 } }}>
                                                    {editingCategoryId === category._id ? (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, mr: 2 }}>
                                                            <TextField size="small" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} autoFocus InputProps={{ sx: { color: themeVar("foreground"), height: 32, bgcolor: "rgba(0,0,0,0.2)" } }} />
                                                            <IconButton size="small" onClick={handleUpdateCategory} sx={{ color: themeVar("primary") }}><Check size={16} /></IconButton>
                                                            <IconButton size="small" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }} sx={{ color: themeVar("destructive") }}><X size={16} /></IconButton>
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <GripVertical size={16} style={{ color: themeVar("mutedForeground") }} />
                                                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.68rem" }}>{category.name}</Typography>
                                                        </Box>
                                                    )}
                                                    {editingCategoryId !== category._id && (
                                                        <Box className="cat-actions" sx={{ opacity: 0.5, transition: "opacity 0.2s", display: "flex", gap: 0.5 }}>
                                                            <IconButton size="small" onClick={() => { setEditingCategoryId(category._id); setEditingCategoryName(category.name); }}><Edit2 size={14} color={themeVar("mutedForeground")} /></IconButton>
                                                            <IconButton size="small" onClick={() => setCategoryToDelete({ id: category._id, name: category.name })}><Trash2 size={14} color={themeVar("destructive")} /></IconButton>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Droppable droppableId={category._id} type="channel">
                                                    {(cProvided) => (
                                                        <Box ref={cProvided.innerRef} {...cProvided.droppableProps} sx={{ p: 1.5 }}>
                                                            <Stack spacing={1}>
                                                                {channels?.filter(c => c.categoryId === category._id)
                                                                    .sort((a, b) => (a.channelOrder || 0) - (b.channelOrder || 0))
                                                                    .map((channel, idx) => (
                                                                        <RenderChannelItem
                                                                            key={channel._id} channel={channel} categories={categories} editingId={editingChannelId} editingName={editingChannelName} editingCategoryId={editingChannelCategoryId} editingIsReadOnly={editingChannelIsReadOnly}
                                                                            onStartEdit={(id: Id<"spaceChannels">, name: string, catId: Id<"spaceCategories"> | undefined, isRO: boolean | undefined) => { setEditingChannelId(id); setEditingChannelName(name); setEditingChannelCategoryId(catId || ""); setEditingChannelIsReadOnly(!!isRO); }}
                                                                            onCancelEdit={() => { setEditingChannelId(null); setEditingChannelName(""); setEditingChannelCategoryId(""); setEditingChannelIsReadOnly(false); }}
                                                                            onChangeName={(e: React.ChangeEvent<HTMLInputElement>) => setEditingChannelName(e.target.value)}
                                                                            onChangeCategory={(e: any) => setEditingChannelCategoryId(e.target.value as any)}
                                                                            onChangeIsReadOnly={(val: boolean) => setEditingChannelIsReadOnly(val)}
                                                                            onSaveEdit={handleUpdateChannel} onDelete={() => setChannelToDelete({ id: channel._id, name: channel.name })} index={idx}
                                                                        />
                                                                    ))}
                                                                {channels?.filter(c => c.categoryId === category._id).length === 0 && (
                                                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontStyle: "italic", pl: 2, py: 1 }}>Empty category</Typography>
                                                                )}
                                                                {cProvided.placeholder}
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </Droppable>
                                            </Box>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Stack>
                        )}
                    </Droppable>
                </DragDropContext>

                {channels?.length === 0 && categories?.length === 0 && (
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), textAlign: "center", py: 4, fontStyle: "italic" }}>
                        No categories or channels created yet.
                    </Typography>
                )}
            </Box>

            {/* Right Column: Permission Controls (Owner Only) */}
            {canEditPermissions && (
                <Box sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0 }}>
                    <Box sx={{
                        borderRadius: 3,
                        bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 30%)`,
                        border: `1px solid ${themeVar("border")}`,
                        overflow: "hidden",
                        position: { lg: "sticky" },
                        top: { lg: 24 }
                    }}>
                        <Box sx={{
                            px: 2,
                            py: 1.5,
                            bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                            borderBottom: `1px solid ${themeVar("border")}`,
                        }}>
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                color: themeVar("mutedForeground"),
                                letterSpacing: "0.08em",
                                fontSize: "0.68rem",
                            }}>
                                STAFF PERMISSIONS
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                            {/* Admin Permissions */}
                            <Box>
                                <Typography variant="caption" sx={{ display: "block", color: themeVar("mutedForeground"), fontWeight: 900, mb: 1, ml: 1, fontSize: "0.6rem", letterSpacing: "0.1em" }}>ADMINS</Typography>
                                <Stack spacing={1}>
                                    {renderToggle("Can edit channels", space.adminCanEditChannels ?? true, () => updateChannelPermissions({ spaceId: space._id, adminCanEdit: !(space.adminCanEditChannels ?? true) }))}
                                    {renderToggle("Can create polls", space.adminCanCreatePolls ?? true, () => updateChannelPermissions({ spaceId: space._id, adminCanCreatePolls: !(space.adminCanCreatePolls ?? true) }))}
                                    {renderToggle("Can post in read-only", space.adminCanPostInReadOnly ?? false, () => updateChannelPermissions({ spaceId: space._id, adminCanPostInReadOnly: !(space.adminCanPostInReadOnly ?? false) }))}
                                </Stack>
                            </Box>

                            {/* Moderator Permissions */}
                            <Box>
                                <Typography variant="caption" sx={{ display: "block", color: themeVar("mutedForeground"), fontWeight: 900, mb: 1, ml: 1, fontSize: "0.6rem", letterSpacing: "0.1em" }}>MODERATORS</Typography>
                                <Stack spacing={1}>
                                    {renderToggle("Can edit channels", space.modCanEditChannels ?? false, () => updateChannelPermissions({ spaceId: space._id, modCanEdit: !(space.modCanEditChannels ?? false) }))}
                                    {renderToggle("Can create polls", space.modCanCreatePolls ?? false, () => updateChannelPermissions({ spaceId: space._id, modCanCreatePolls: !(space.modCanCreatePolls ?? false) }))}
                                    {renderToggle("Can post in read-only", space.modCanPostInReadOnly ?? false, () => updateChannelPermissions({ spaceId: space._id, modCanPostInReadOnly: !(space.modCanPostInReadOnly ?? false) }))}
                                </Stack>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}


            {/* Channel Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(channelToDelete)}
                onClose={() => setChannelToDelete(null)}
                PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none", border: `1px solid ${themeVar("border")}`, borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Channel?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
                        Are you sure you want to delete the <Box component="span" sx={{ fontWeight: 900, color: themeVar("foreground") }}>#{channelToDelete?.name}</Box> channel? This action cannot be undone and all message history will be permanently lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setChannelToDelete(null)} sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleDeleteChannel}
                        variant="contained"
                        color="error"
                        sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
                    >
                        Delete Channel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Category Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(categoryToDelete)}
                onClose={() => setCategoryToDelete(null)}
                PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none", border: `1px solid ${themeVar("border")}`, borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Category?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
                        Are you sure you want to delete the category <Box component="span" sx={{ fontWeight: 900, color: themeVar("foreground") }}>"{categoryToDelete?.name}"</Box>?
                        Channels within this category will not be deleted, but will become uncategorized.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCategoryToDelete(null)} sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleDeleteCategory}
                        variant="contained"
                        color="error"
                        sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
                    >
                        Delete Category
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export function RenderChannelItem({
    channel, categories, editingId, editingName, editingCategoryId, editingIsReadOnly,
    onStartEdit, onCancelEdit, onChangeName, onChangeCategory, onChangeIsReadOnly, onSaveEdit, onDelete,
    index
}: any) {
    if (editingId === channel._id) {
        return (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.15)", border: `1px solid ${themeVar("border")}`, display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                    size="small" fullWidth label="Edit Name" value={editingName} onChange={onChangeName} autoFocus
                    InputLabelProps={{ sx: { color: themeVar("mutedForeground"), "&.Mui-focused": { color: themeVar("primary") } } }}
                    InputProps={{ startAdornment: <MessageSquare size={16} style={{ marginRight: 8, color: themeVar("primary") }} />, sx: { color: themeVar("foreground"), bgcolor: "rgba(0,0,0,0.2)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } } }}
                />
                <Select
                    size="small" value={editingCategoryId} onChange={onChangeCategory} displayEmpty
                    sx={{ color: themeVar("foreground"), bgcolor: "rgba(0,0,0,0.2)", minWidth: 120, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }, "& .MuiSvgIcon-root": { color: themeVar("mutedForeground") } }}
                >
                    <MenuItem value=""><em>No Category</em></MenuItem>
                    {categories?.sort((a: any, b: any) => a.order - b.order).map((cat: any) => (
                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                </Select>
                <IconButton onClick={() => onChangeIsReadOnly(!editingIsReadOnly)} sx={{ color: editingIsReadOnly ? themeVar("destructive") : themeVar("mutedForeground") }} title="Toggle Read-Only">
                    <Lock size={16} />
                </IconButton>
                <IconButton onClick={onSaveEdit} sx={{ color: themeVar("primary") }}><Check size={18} /></IconButton>
                <IconButton onClick={onCancelEdit} sx={{ color: themeVar("destructive") }}><X size={18} /></IconButton>
            </Box>
        );
    }

    return (
        <Draggable draggableId={channel._id} index={index}>
            {(provided) => (
                <Box
                    ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                    sx={{
                        p: 1.5, borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.12)",
                        border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 40%)`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "grab", "&:active": { cursor: "grabbing" },
                        borderLeft: `3px solid transparent`,
                        "&:hover": {
                            bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`,
                            borderLeftColor: themeVar("primary"),
                        },
                        transition: "all 0.15s ease",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <GripVertical size={16} style={{ color: themeVar("mutedForeground") }} />
                        <Box sx={{ color: themeVar("primary"), opacity: 0.7, display: "flex" }}><MessageSquare size={16} /></Box>
                        <Typography sx={{ fontWeight: 700, color: themeVar("foreground") }}>{channel.name}</Typography>
                        {channel.isReadOnly && (
                            <Tooltip title="Read-Only (Staff Only)" arrow placement="top">
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Lock size={14} style={{ color: themeVar("mutedForeground"), marginLeft: 4 }} />
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                    <Box>
                        <IconButton size="small" onClick={() => onStartEdit(channel._id, channel.name, channel.categoryId, channel.isReadOnly)} sx={{ color: themeVar("chart4"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                            <Edit2 size={16} />
                        </IconButton>
                        <IconButton size="small" onClick={onDelete} sx={{ color: themeVar("destructive"), opacity: 0.5, "&:hover": { opacity: 1 } }}>
                            <Trash2 size={16} />
                        </IconButton>
                    </Box>
                </Box>
            )}
        </Draggable>
    );
}


