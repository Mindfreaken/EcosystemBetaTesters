"use client";

import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { X, Globe, Lock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";

interface CreateSpaceModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (spaceId: string) => void;
}

export default function CreateSpaceModal({ open, onClose, onSuccess }: CreateSpaceModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSpace = useMutation(api.spaces.core.createSpace);

    const handleClose = () => {
        if (loading) return;
        setName("");
        setDescription("");
        setIsPublic(true);
        setError(null);
        onClose();
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const spaceId = await createSpace({
                name: name.trim(),
                description: description.trim() || undefined,
                isPublic,
            });
            onSuccess(spaceId);
            handleClose();
        } catch (err: any) {
            setError(err.message || "Failed to create space");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'color-mix(in oklab, var(--overlay), transparent 20%)',
                        backdropFilter: 'blur(4px)',
                    },
                },
                paper: {
                    sx: {
                        background: 'color-mix(in oklab, var(--card), transparent 5%)',
                        border: '1px solid color-mix(in oklab, var(--border), transparent 35%)',
                        boxShadow: '0 8px 32px color-mix(in oklab, var(--shadow), transparent 30%)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2.5,
                    color: themeVar("textLight"),
                    fontWeight: 800,
                    fontSize: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${themeVar("border")}`,
                }}
            >
                Create a New Space
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{
                        color: themeVar("textSecondary"),
                        "&:hover": { color: themeVar("textLight"), background: "transparent" },
                    }}
                >
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, mt: 1 }}>
                <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                    Spaces are dedicated homes for your community. You can configure everything from permissions to custom themes later.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Space Name"
                        placeholder="Enter a cool name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        inputProps={{ maxLength: 32 }}
                        helperText={`${name.length}/32`}
                        FormHelperTextProps={{ sx: { textAlign: "right", color: "rgba(255,255,255,0.3)" } }}
                        InputProps={{
                            sx: {
                                bgcolor: "rgba(0,0,0,0.2)",
                                color: themeVar("textLight"),
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                            }
                        }}
                        InputLabelProps={{
                            sx: {
                                color: "rgba(255,255,255,0.7)",
                                "&.Mui-focused": { color: themeVar("primary") }
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        placeholder="What's this space about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        multiline
                        rows={3}
                        variant="outlined"
                        size="small"
                        inputProps={{ maxLength: 150 }}
                        helperText={`${description.length}/150`}
                        FormHelperTextProps={{ sx: { textAlign: "right", color: "rgba(255,255,255,0.3)" } }}
                        InputProps={{
                            sx: {
                                bgcolor: "rgba(0,0,0,0.2)",
                                color: themeVar("textLight"),
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                            }
                        }}
                        InputLabelProps={{
                            sx: {
                                color: "rgba(255,255,255,0.7)",
                                "&.Mui-focused": { color: themeVar("primary") }
                            }
                        }}
                    />

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                            border: `1px solid ${themeVar("border")}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {isPublic ? (
                                <Globe size={18} style={{ color: themeVar("primary") }} />
                            ) : (
                                <Lock size={18} style={{ color: themeVar("warning") }} />
                            )}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeVar("textLight") }}>
                                    {isPublic ? "Public Space" : "Private Space"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: themeVar("textSecondary") }}>
                                    {isPublic ? "Anyone can find and join" : "Invite links only"}
                                </Typography>
                            </Box>
                        </Box>
                        <Switch
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            disabled={loading}
                            color="primary"
                        />
                    </Box>

                    {error && (
                        <Typography variant="caption" sx={{ color: themeVar("warning"), fontWeight: 600, textAlign: "center" }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                        color: themeVar("textSecondary"),
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": { color: themeVar("textLight"), bgcolor: "transparent" },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading || !name.trim()}
                    sx={{
                        bgcolor: themeVar("primary"),
                        color: "#fff",
                        fontWeight: 700,
                        textTransform: "none",
                        px: 4,
                        py: 1,
                        borderRadius: "8px",
                        boxShadow: `0 4px 14px color-mix(in oklab, ${themeVar("primary")}, transparent 60%)`,
                        "&:hover": {
                            bgcolor: `color-mix(in oklab, ${themeVar("primary")}, white 10%)`,
                            boxShadow: `0 6px 20px color-mix(in oklab, ${themeVar("primary")}, transparent 50%)`,
                        },
                        "&:disabled": {
                            bgcolor: themeVar("border"),
                            color: themeVar("textSecondary"),
                        }
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Create Space"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
