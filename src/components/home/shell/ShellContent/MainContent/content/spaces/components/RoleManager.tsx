"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";
import { Plus, Trash2, Edit2, Check, X, Palette, Zap, Sparkles, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import RoleTag from "./RoleTag";

interface RoleManagerProps {
    open: boolean;
    onClose: () => void;
    spaceId: Id<"spaces">;
}

export default function RoleManager({ open, onClose, spaceId }: RoleManagerProps) {
    const roles = useQuery(api.spaces.roles.getSpaceRoles, { spaceId });
    const createRole = useMutation(api.spaces.roles.createRole);
    const updateRole = useMutation(api.spaces.roles.updateRole);
    const deleteRole = useMutation(api.spaces.roles.deleteRole);
    const reorderRoles = useMutation(api.spaces.roles.reorderRoles);
    const ensureSystemRoles = useMutation(api.spaces.roles.ensureSystemRoles);

    React.useEffect(() => {
        if (open) {
            ensureSystemRoles({ spaceId });
        }
    }, [open, spaceId, ensureSystemRoles]);

    const [editingRole, setEditingRole] = React.useState<any>(null);
    const [isCreating, setIsCreating] = React.useState(false);

    const initialRoleState = {
        name: "New Role",
        color: "#ffffff",
        style: "solid",
        isHoisted: false,
        order: roles ? roles.length : 0,
        gradientConfig: {
            color1: "#ff0000",
            color2: "#0000ff",
            angle: 45,
            isAnimated: true
        }
    };

    const [roleForm, setRoleForm] = React.useState(initialRoleState);

    const handleSave = async () => {
        if (isCreating) {
            await createRole({ spaceId, ...roleForm });
        } else if (editingRole) {
            await updateRole({ id: editingRole._id, ...roleForm });
        }
        setIsCreating(false);
        setEditingRole(null);
    };

    const startEditing = (role: any) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            color: role.color,
            style: role.style,
            isHoisted: role.isHoisted,
            order: role.order,
            gradientConfig: role.gradientConfig || initialRoleState.gradientConfig
        });
        setIsCreating(false);
    };

    const startCreating = () => {
        setIsCreating(true);
        setRoleForm({ ...initialRoleState, order: roles ? roles.length : 0 });
        setEditingRole(null);
    };

    const systemRoles = roles?.filter(r => r.isSystem).sort((a, b) => a.order - b.order) || [];
    const customRoles = roles?.filter(r => !r.isSystem).sort((a, b) => a.order - b.order) || [];

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || !roles) return;
        
        const items = Array.from(customRoles);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updates = items.map((role, index) => ({
            id: role._id,
            order: index + 3 // Start after Owner, Admin, Mod
        }));

        await reorderRoles({ spaceId, roles: updates });
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
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
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
                    overflow: "hidden"
                }
            }}
        >
            <DialogTitle 
                sx={{ 
                    fontWeight: 900, 
                    color: themeVar("foreground"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 1,
                    px: 3,
                    pt: 2.5
                }}
            >
                Space Roles
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: themeVar("mutedForeground"),
                        "&:hover": { color: themeVar("foreground"), background: "transparent" },
                    }}
                >
                    <X size={18} />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.1)", p: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 450 }}>
                    {/* Role List */}
                    <Box sx={{ borderRight: `1px solid rgba(255,255,255,0.1)`, p: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            startIcon={<Plus size={16} />}
                            onClick={startCreating}
                            sx={{ 
                                mb: 2, 
                                bgcolor: themeVar("primary"), 
                                color: "white", 
                                fontWeight: 800,
                                borderRadius: 2,
                                textTransform: "none",
                                "&:hover": { bgcolor: themeVar("primary"), filter: "brightness(1.1)" }
                            }}
                        >
                            Create Role
                        </Button>
                        <Stack spacing={1} sx={{ mb: 2 }}>
                            {systemRoles.map((role) => (
                                <Box 
                                    key={role._id}
                                    onClick={() => startEditing(role)}
                                    sx={{ 
                                        p: 1.5, 
                                        borderRadius: 2, 
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.5,
                                        bgcolor: (editingRole?._id === role._id) ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "transparent",
                                        border: `1px solid ${(editingRole?._id === role._id) ? themeVar("primary") : "transparent"}`,
                                        transition: "all 0.2s ease",
                                        "&:hover": { bgcolor: (editingRole?._id === role._id) ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "rgba(255,255,255,0.05)" }
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                        <RoleTag role={role} />
                                    </Box>
                                    <Typography variant="caption" sx={{ fontSize: "0.6rem", fontWeight: 900, color: themeVar("mutedForeground"), letterSpacing: "0.1em", mt: 0.5 }}>
                                        SYSTEM ROLE
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="custom-roles">
                                {(provided) => (
                                    <Stack spacing={1} {...provided.droppableProps} ref={provided.innerRef}>
                                        {customRoles.map((role, index) => (
                                            <Draggable key={role._id} draggableId={role._id} index={index}>
                                                {(draggableProvided) => (
                                                    <Box 
                                                        ref={draggableProvided.innerRef}
                                                        {...draggableProvided.draggableProps}
                                                        {...draggableProvided.dragHandleProps}
                                                        onClick={() => startEditing(role)}
                                                        sx={{ 
                                                            p: 1.5, 
                                                            borderRadius: 2, 
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            bgcolor: (editingRole?._id === role._id) ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "transparent",
                                                            border: `1px solid ${(editingRole?._id === role._id) ? themeVar("primary") : "transparent"}`,
                                                            transition: "all 0.2s ease",
                                                            "&:hover": { bgcolor: (editingRole?._id === role._id) ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "rgba(255,255,255,0.05)" }
                                                        }}
                                                    >
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <GripVertical size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                                                            <RoleTag role={role} />
                                                        </Box>
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteRole({ id: role._id }); }} sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: themeVar("destructive") } }}>
                                                            <Trash2 size={14} />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Stack>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Box>

                    {/* Editor */}
                    <Box sx={{ p: 3, overflowY: "auto", maxHeight: 550 }}>
                        {(editingRole || isCreating) ? (
                            <Stack spacing={3}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    label="Role Name"
                                    value={roleForm.name} 
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    InputLabelProps={{
                                        shrink: true,
                                        sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                                    }}
                                    InputProps={{
                                        sx: {
                                            color: themeVar("foreground"),
                                            bgcolor: "rgba(0,0,0,0.3)",
                                            borderRadius: 2,
                                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 }
                                        }
                                    }}
                                />

                                 <Box>
                                    <Typography variant="overline" sx={{ fontWeight: 900, color: themeVar("mutedForeground"), mb: 1, display: "block", ml: 0.5 }}>STYLE</Typography>
                                    <Stack direction="row" spacing={1.5}>
                                        {[
                                            { id: "solid", label: "Solid Color", icon: <Palette size={16} /> },
                                            { id: "gradient", label: "Animated Gradient", icon: <Sparkles size={16} /> }
                                        ].map((s) => (
                                            <Button
                                                key={s.id}
                                                variant="contained"
                                                startIcon={s.icon}
                                                onClick={() => setRoleForm({ ...roleForm, style: s.id as any })}
                                                sx={{ 
                                                    flex: 1,
                                                    textTransform: "none",
                                                    fontWeight: 800,
                                                    bgcolor: roleForm.style === s.id ? themeVar("primary") : "rgba(255,255,255,0.05)",
                                                    color: roleForm.style === s.id ? "white" : themeVar("mutedForeground"),
                                                    borderRadius: 2,
                                                    border: `1px solid ${roleForm.style === s.id ? themeVar("primary") : "rgba(255,255,255,0.1)"}`,
                                                    "&:hover": {
                                                        bgcolor: roleForm.style === s.id ? themeVar("primary") : "rgba(255,255,255,0.1)",
                                                        filter: "brightness(1.1)"
                                                    }
                                                }}
                                            >
                                                {s.label}
                                            </Button>
                                        ))}
                                    </Stack>
                                </Box>

                                {roleForm.style === "solid" && (
                                    <Box>
                                        <Typography variant="overline" sx={{ fontWeight: 900, color: themeVar("mutedForeground"), mb: 1, display: "block", ml: 0.5 }}>ROLE COLOR</Typography>
                                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                            <Box 
                                                component="input"
                                                type="color" 
                                                value={roleForm.color} 
                                                onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                                                sx={{ width: 60, height: 40, border: "none", borderRadius: 1.5, cursor: "pointer", bgcolor: "transparent" }}
                                            />
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("foreground"), fontFamily: "monospace" }}>{roleForm.color.toUpperCase()}</Typography>
                                        </Box>
                                    </Box>
                                )}

                                {roleForm.style === "gradient" && (
                                    <Stack spacing={2.5}>
                                        <Box>
                                            <Typography variant="overline" sx={{ fontWeight: 900, color: themeVar("mutedForeground"), mb: 1, display: "block", ml: 0.5 }}>GRADIENT COLORS</Typography>
                                            <Stack direction="row" spacing={2}>
                                                <Box component="input" type="color" value={roleForm.gradientConfig.color1} onChange={(e) => setRoleForm({ ...roleForm, gradientConfig: { ...roleForm.gradientConfig, color1: e.target.value } })} sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, bgcolor: "transparent" }} />
                                                <Box component="input" type="color" value={roleForm.gradientConfig.color2} onChange={(e) => setRoleForm({ ...roleForm, gradientConfig: { ...roleForm.gradientConfig, color2: e.target.value } })} sx={{ width: 44, height: 44, border: "none", borderRadius: 1.5, bgcolor: "transparent" }} />
                                            </Stack>
                                        </Box>
                                        {renderToggle("Animate Gradient", roleForm.gradientConfig.isAnimated, () => setRoleForm({ ...roleForm, gradientConfig: { ...roleForm.gradientConfig, isAnimated: !roleForm.gradientConfig.isAnimated } }))}
                                    </Stack>
                                )}

                                {renderToggle("Display separately (Hoist)", roleForm.isHoisted, () => setRoleForm({ ...roleForm, isHoisted: !roleForm.isHoisted }))}

                                {editingRole && (
                                    <RoleMemberAssignment spaceId={spaceId} roleId={editingRole._id} isSystem={!!editingRole.isSystem} />
                                )}

                                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                                    <Button 
                                        fullWidth
                                        variant="contained" 
                                        onClick={handleSave} 
                                        sx={{ 
                                            bgcolor: themeVar("primary"),
                                            color: "white",
                                            fontWeight: 900,
                                            borderRadius: 2,
                                            py: 1.25,
                                            textTransform: "none",
                                            "&:hover": { bgcolor: themeVar("primary"), filter: "brightness(1.1)" }
                                        }}
                                    >
                                        Save Role Settings
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: themeVar("mutedForeground"), textAlign: "center", opacity: 0.5 }}>
                                <Box>
                                    <Palette size={48} style={{ marginBottom: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Select a role to customize its appearance and members.</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3, bgcolor: "rgba(0,0,0,0.1)" }}>
                <Button 
                    onClick={onClose} 
                    sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "none" }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

import "../styles/RoleEffects.css";

function RoleMemberAssignment({ spaceId, roleId, isSystem }: { spaceId: Id<"spaces">, roleId: Id<"spaceRoles">, isSystem: boolean }) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId });
    const batchUpdateUsers = useMutation(api.spaces.roles.batchUpdateRoleMembers);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [pendingAdds, setPendingAdds] = React.useState<Set<Id<"users">>>(new Set());
    const [pendingRemoves, setPendingRemoves] = React.useState<Set<Id<"users">>>(new Set());
    const [isSaving, setIsSaving] = React.useState(false);
    const [shake, setShake] = React.useState(false);

    const filteredMembers = members?.filter(m => 
        m.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (userId: Id<"users">, currentlyHasRole: boolean) => {
        if (isSystem) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        if (currentlyHasRole) {
            setPendingRemoves(prev => {
                const next = new Set(prev);
                if (next.has(userId)) next.delete(userId);
                else next.add(userId);
                return next;
            });
        } else {
            setPendingAdds(prev => {
                const next = new Set(prev);
                if (next.has(userId)) next.delete(userId);
                else next.add(userId);
                return next;
            });
        }
    };

    const handleApplyChanges = async () => {
        setIsSaving(true);
        try {
            await batchUpdateUsers({
                spaceId,
                roleId,
                userIdsToAdd: Array.from(pendingAdds),
                userIdsToRemove: Array.from(pendingRemoves),
            });
            setPendingAdds(new Set());
            setPendingRemoves(new Set());
        } finally {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 2000);
        }
    };

    if (!members) return null;

    const hasChanges = pendingAdds.size > 0 || pendingRemoves.size > 0;

    return (
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, color: themeVar("mutedForeground") }}>ROLE MEMBERS</Typography>
                {hasChanges && (
                    <Button 
                        size="small" 
                        variant="contained" 
                        onClick={handleApplyChanges}
                        disabled={isSaving}
                        sx={{ bgcolor: themeVar("primary"), color: "white", fontWeight: 800, borderRadius: 1.5, py: 0.5, textTransform: "none", fontSize: "0.7rem" }}
                    >
                        {isSaving ? "Syncing..." : "Update Members"}
                    </Button>
                )}
            </Box>

            <TextField
                fullWidth
                size="small"
                placeholder="Search community members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    sx: {
                        bgcolor: "rgba(0,0,0,0.2)",
                        borderRadius: 2,
                        fontSize: "0.8rem",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.05)" }
                    }
                }}
                sx={{ mb: 2 }}
            />
            <Box sx={{ maxHeight: 200, overflowY: "auto", pr: 1, 
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }
            }}>
                <Stack spacing={1}>
                    {filteredMembers?.map(m => {
                        const originalHasRole = m.roles?.some(r => r?._id === roleId);
                        const willHaveRole = (originalHasRole && !pendingRemoves.has(m.userId)) || (!originalHasRole && pendingAdds.has(m.userId));
                        const isPending = pendingAdds.has(m.userId) || pendingRemoves.has(m.userId);

                        return (
                            <Box 
                                key={m._id}
                                onClick={() => handleToggle(m.userId, !!originalHasRole)}
                                sx={{ 
                                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                                    p: 1.25, borderRadius: 1.5,
                                    bgcolor: willHaveRole ? "rgba(255,255,255,0.03)" : "transparent",
                                    cursor: isSystem ? "not-allowed" : "pointer",
                                    border: `1px solid ${isPending ? themeVar("primary") : "transparent"}`,
                                    transition: "all 0.2s ease",
                                    animation: (isSystem && shake) ? "shake 0.4s ease-in-out" : "none",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Avatar src={m.user?.avatarUrl} sx={{ width: 24, height: 24 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: themeVar("foreground") }}>{m.user?.displayName}</Typography>
                                </Box>
                                <Box sx={{ 
                                    width: 20, height: 20, borderRadius: "50%", 
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    bgcolor: willHaveRole ? themeVar("primary") : "rgba(255,255,255,0.1)",
                                    color: "white",
                                    transition: "all 0.2s ease"
                                }}>
                                    {willHaveRole && <Check size={14} strokeWidth={3} />}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
            `}</style>
        </Box>
    );
}
