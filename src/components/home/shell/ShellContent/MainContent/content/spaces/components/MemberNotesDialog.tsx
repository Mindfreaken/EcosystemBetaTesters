"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";
import { Trash2, FileText, X } from "lucide-react";

interface MemberNotesDialogProps {
    open: boolean;
    onClose: () => void;
    spaceId: Id<"spaces">;
    userId: Id<"users">;
    username: string;
    avatarUrl?: string;
    myRole: string; // the role of the person viewing the notes
}

export default function MemberNotesDialog({ open, onClose, spaceId, userId, username, avatarUrl, myRole }: MemberNotesDialogProps) {
    const [newNote, setNewNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const notes = useQuery(api.spaces.notes.getNotes, { spaceId, userId });
    const addNoteMut = useMutation(api.spaces.notes.addNote);
    const deleteNoteMut = useMutation(api.spaces.notes.deleteNote);
    const me = useQuery(api.users.onboarding.queries.me, {});

    const handleAddNote = async () => {
        if (!newNote.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addNoteMut({ spaceId, userId, note: newNote.trim() });
            setNewNote("");
        } catch (e: any) {
            console.error("Failed to add note", e);
            alert(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId: Id<"spaceMemberNotes">) => {
        try {
            await deleteNoteMut({ spaceId, noteId });
        } catch (e: any) {
            console.error("Failed to delete note", e);
            alert(e.message);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !isSubmitting && onClose()}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: themeVar("backgroundAlt"),
                    color: themeVar("textLight"),
                    backgroundImage: 'none',
                    border: `1px solid ${themeVar("border")}`,
                    borderRadius: 4,
                    minHeight: 400,
                    maxHeight: '80vh'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${themeVar("border")}`,
                pb: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: themeVar("background") }}>
                        {username?.[0] || "?"}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>{username}</Typography>
                        <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mt: 0.5 }}>Staff Notes</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: themeVar("textSecondary") }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 3,
                    bgcolor: "rgba(0,0,0,0.1)",
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {notes === undefined ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress size={24} sx={{ color: themeVar("primary") }} />
                        </Box>
                    ) : notes.length === 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, opacity: 0.5 }}>
                            <FileText size={32} style={{ marginBottom: 8 }} />
                            <Typography>No notes for this user.</Typography>
                        </Box>
                    ) : (
                        notes.map((note) => {
                            const canDelete = myRole === "owner" || myRole === "admin" || (myRole === "moderator" && note.authorId === me?._id);

                            return (
                                <Box key={note._id} sx={{
                                    bgcolor: themeVar("backgroundAlt"),
                                    p: 2,
                                    borderRadius: 3,
                                    border: `1px solid ${themeVar("border")}`,
                                    position: "relative"
                                }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Avatar src={note.author.avatarUrl} sx={{ width: 20, height: 20 }}>
                                            {note.author.displayName[0]}
                                        </Avatar>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("textLight") }}>
                                            {note.author.displayName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("textSecondary"), ml: 'auto' }}>
                                            {new Date(note.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric',
                                                hour: 'numeric', minute: '2-digit'
                                            })}
                                        </Typography>
                                        {canDelete && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteNote(note._id)}
                                                sx={{
                                                    p: 0.25,
                                                    ml: 0.5,
                                                    color: themeVar("textSecondary"),
                                                    "&:hover": { color: themeVar("danger") }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: themeVar("textLight") }}>
                                        {note.note}
                                    </Typography>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: `1px solid ${themeVar("border")}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                    fullWidth
                    placeholder="Add a new note..."
                    multiline
                    maxRows={4}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNote();
                        }
                    }}
                    variant="outlined"
                    size="small"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: themeVar("background"),
                            borderRadius: 2,
                            color: themeVar("textLight"),
                            "& fieldset": { borderColor: themeVar("border") },
                            "&:hover fieldset": { borderColor: themeVar("primary") },
                            "&.Mui-focused fieldset": { borderColor: themeVar("primary") }
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <Button
                        variant="contained"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isSubmitting}
                        sx={{
                            fontWeight: 700,
                            borderRadius: 2,
                            textTransform: 'none',
                            bgcolor: themeVar("primary")
                        }}
                    >
                        {isSubmitting ? "Adding..." : "Add Note"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
