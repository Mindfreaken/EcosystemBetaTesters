"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import UiButton from "@/components/ui/UiButton";
import { themeVar } from "@/theme/registry";
import { X, Zap, Loader2 } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

interface JoinSpaceModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (spaceId: string) => void;
}

export default function JoinSpaceModal({ open, onClose, onSuccess }: JoinSpaceModalProps) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const joinSpace = useMutation(api.spaces.invites.joinSpaceByCode);

    const handleJoin = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError("");
        try {
            const spaceId = await joinSpace({ code: code.trim().toUpperCase() });
            onSuccess(spaceId);
            onClose();
            setCode("");
        } catch (err: any) {
            setError(err.message || "Failed to join space. Check your code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: themeVar("card"),
                borderRadius: 4,
                boxShadow: `0 20px 60px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`,
                p: 4,
                border: `1px solid ${themeVar("border")}`,
                outline: "none"
            }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)`, color: themeVar("secondary") }}>
                            <Zap size={20} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("foreground") }}>Join a Space</Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: themeVar("mutedForeground") }}><X size={20} /></IconButton>
                </Box>

                <Typography sx={{ color: themeVar("mutedForeground"), mb: 4, fontSize: "0.95rem" }}>
                    Enter the invite code you received to instantly join a private space.
                </Typography>

                <TextField
                    fullWidth
                    placeholder="Enter Invite Code (e.g. AB12CD34)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    error={!!error}
                    helperText={error}
                    autoFocus
                    InputProps={{
                        sx: {
                            bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            color: themeVar("foreground"),
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("border") },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                        }
                    }}
                />

                <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                    <UiButton
                        variant="secondary"
                        fullWidth
                        onClick={onClose}
                        className="font-bold"
                    >
                        Cancel
                    </UiButton>
                    <UiButton
                        variant="primary"
                        fullWidth
                        onClick={handleJoin}
                        disabled={loading || !code.trim()}
                        className="font-extrabold"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Join Space"}
                    </UiButton>
                </Box>
            </Box>
        </Modal>
    );
}


