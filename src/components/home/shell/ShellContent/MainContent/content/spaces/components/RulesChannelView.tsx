"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import { Plus, Trash2, GripVertical, Save, X, Edit2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id, Doc } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface RulesChannelViewProps {
    spaceId: Id<"spaces">;
    canEdit: boolean;
}

export default function RulesChannelView({ spaceId, canEdit }: RulesChannelViewProps) {
    const rules = useQuery(api.spaces.rules.getRules, { spaceId });
    const addRule = useMutation(api.spaces.rules.addRule);
    const updateRule = useMutation(api.spaces.rules.updateRule);
    const deleteRule = useMutation(api.spaces.rules.deleteRule);
    const reorderRules = useMutation(api.spaces.rules.reorderRules);

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [editingId, setEditingId] = useState<Id<"spaceRules"> | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const handleAdd = async () => {
        if (!newTitle.trim()) return;
        await addRule({ spaceId, title: newTitle, description: newDescription });
        setNewTitle("");
        setNewDescription("");
        setIsAdding(false);
    };

    const handleUpdate = async (ruleId: Id<"spaceRules">) => {
        if (!editTitle.trim()) return;
        await updateRule({ ruleId, title: editTitle, description: editDescription });
        setEditingId(null);
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination || !rules) return;
        
        const items = Array.from(rules);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const newOrder = items.map((r, index) => ({
            id: r._id,
            order: index
        }));

        await reorderRules({ spaceId, rules: newOrder });
    };

    if (rules === undefined) return <Box sx={{ p: 4, textAlign: "center" }}><Typography>Loading rules...</Typography></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto", width: "100%" }}>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("foreground"), mb: 1 }}>Space Rules</Typography>
                    <Typography sx={{ color: themeVar("mutedForeground") }}>Guidelines for our community members.</Typography>
                </Box>
                {canEdit && !isAdding && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => setIsAdding(true)}
                        sx={{ bgcolor: themeVar("primary"), fontWeight: 700, borderRadius: 2 }}
                    >
                        Add Rule
                    </Button>
                )}
            </Box>

            {isAdding && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: "rgba(255,255,255,0.02)", border: `1px solid ${themeVar("border")}`, borderRadius: 3 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Rule Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. No Spamming"
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Briefly explain the rule..."
                        />
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button onClick={() => setIsAdding(false)} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
                            <Button variant="contained" onClick={handleAdd} disabled={!newTitle.trim()} sx={{ bgcolor: themeVar("primary") }}>Save Rule</Button>
                        </Box>
                    </Stack>
                </Paper>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="rules">
                    {(provided) => (
                        <Box {...provided.droppableProps} ref={provided.innerRef}>
                            <Stack spacing={2}>
                                {rules.map((rule, index) => (
                                    <Draggable key={rule._id} draggableId={rule._id} index={index} isDragDisabled={!canEdit || !!editingId}>
                                        {(provided) => (
                                            <Box
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{
                                                    ...provided.draggableProps.style,
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: 2,
                                                    p: 2,
                                                    borderRadius: 3,
                                                    bgcolor: "rgba(255,255,255,0.03)",
                                                    border: `1px solid ${editingId === rule._id ? themeVar("primary") : themeVar("border")}`,
                                                    transition: "background-color 0.2s",
                                                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                                                }}
                                            >
                                                {canEdit && (
                                                    <Box {...provided.dragHandleProps} sx={{ pt: 0.5, color: themeVar("mutedForeground"), cursor: "grab" }}>
                                                        <GripVertical size={20} />
                                                    </Box>
                                                )}
                                                
                                                <Box sx={{ flex: 1 }}>
                                                    {editingId === rule._id ? (
                                                        <Stack spacing={2}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                            />
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={2}
                                                                size="small"
                                                                value={editDescription}
                                                                onChange={(e) => setEditDescription(e.target.value)}
                                                            />
                                                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                                                <IconButton size="small" onClick={() => setEditingId(null)} sx={{ color: themeVar("mutedForeground") }}><X size={18} /></IconButton>
                                                                <IconButton size="small" onClick={() => handleUpdate(rule._id)} sx={{ color: themeVar("primary") }}><Save size={18} /></IconButton>
                                                            </Box>
                                                        </Stack>
                                                    ) : (
                                                        <>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                                                                <Typography sx={{ 
                                                                    width: 24, 
                                                                    height: 24, 
                                                                    display: "flex", 
                                                                    alignItems: "center", 
                                                                    justifyContent: "center", 
                                                                    borderRadius: "50%", 
                                                                    bgcolor: themeVar("primary"), 
                                                                    color: "white", 
                                                                    fontSize: "0.75rem", 
                                                                    fontWeight: 900 
                                                                }}>
                                                                    {index + 1}
                                                                </Typography>
                                                                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{rule.title}</Typography>
                                                            </Box>
                                                            <Typography sx={{ color: themeVar("mutedForeground"), pl: 5 }}>{rule.description}</Typography>
                                                        </>
                                                    )}
                                                </Box>

                                                {canEdit && !editingId && (
                                                    <Box sx={{ display: "flex" }}>
                                                        <IconButton size="small" onClick={() => { setEditingId(rule._id); setEditTitle(rule.title); setEditDescription(rule.description); }} sx={{ color: themeVar("mutedForeground") }}><Edit2 size={16} /></IconButton>
                                                        <IconButton size="small" onClick={() => deleteRule({ ruleId: rule._id })} sx={{ color: themeVar("destructive") }}><Trash2 size={16} /></IconButton>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Draggable>
                                ))}
                            </Stack>
                            {provided.placeholder}
                        </Box>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );
}
