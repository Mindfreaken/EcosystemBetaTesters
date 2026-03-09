"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import { Camera, Image as ImageIcon, Edit2, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";

interface GeneralTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
    userRole?: string;
}

export default function GeneralTab({ space, role, userRole }: GeneralTabProps) {
    const updateMetadata = useMutation(api.spaces.core.updateSpaceMetadata);
    const generateUploadUrl = useMutation(api.chat.storage.generateUploadUrl);
    const saveFileMetadata = useMutation(api.chat.storage.saveFileMetadata);

    const [editingDescription, setEditingDescription] = React.useState(false);
    const [newDescription, setNewDescription] = React.useState(space.description || "");
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
    const [uploadingCover, setUploadingCover] = React.useState(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const coverInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpdateDescription = async () => {
        await updateMetadata({ spaceId: space._id, description: newDescription });
        setEditingDescription(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === "avatar") setUploadingAvatar(true);
        else setUploadingCover(true);

        try {
            const uploadResult = await generateUploadUrl({ fileSize: file.size });
            if (!uploadResult.success) {
                console.error("Quota exceeded or error getting upload URL");
                return;
            }

            const result = await fetch(uploadResult.url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            const { url } = await saveFileMetadata({
                storageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                userId: space.ownerId,
                path: `/spaces/${space._id}/${type}`,
            });

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

    const handleDismissTip = async () => {
        await updateMetadata({ spaceId: space._id, hideAssistantAvatarTip: true });
    };

    // If moderator somehow accesses general tab, we might restrict edit actions, but the wrapper handles visibility mostly.
    const canEdit = role === "owner" || role === "admin";

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 800 }}>
            {/* Branding Section */}
            <Box sx={{
                borderRadius: 4,
                bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 30%)`,
                border: `1px solid ${themeVar("border")}`,
                overflow: "hidden"
            }}>
                <Box sx={{
                    px: 3,
                    py: 2,
                    bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                    borderBottom: `1px solid ${themeVar("border")}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <Typography variant="caption" sx={{
                        fontWeight: 800,
                        color: themeVar("textSecondary"),
                        letterSpacing: "0.08em",
                        fontSize: "0.75rem",
                        textTransform: "uppercase"
                    }}>
                        Space Branding
                    </Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", mb: !space.hideAssistantAvatarTip ? 3 : 0 }}>
                        {canEdit && (
                            <>
                                <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, "avatar")} />
                                <input type="file" hidden ref={coverInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} />
                            </>
                        )}

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
                            <Tooltip title={canEdit ? "Change Avatar" : "Space Avatar"}>
                                <Box
                                    sx={{ position: "relative", cursor: uploadingAvatar || !canEdit ? "default" : "pointer" }}
                                    onClick={() => canEdit && !uploadingAvatar && avatarInputRef.current?.click()}
                                >
                                    <Avatar
                                        src={space.avatarUrl}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 4,
                                            border: `2px solid ${themeVar("border")}`,
                                            bgcolor: themeVar("background"),
                                            opacity: uploadingAvatar ? 0.5 : 1,
                                            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                                            transition: "transform 0.2s ease",
                                            "&:hover": { transform: canEdit ? "scale(1.02)" : "none" }
                                        }}
                                    >
                                        <ImageIcon size={40} style={{ color: themeVar("textSecondary") }} />
                                    </Avatar>
                                    {uploadingAvatar && (
                                        <CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", mt: "-12px", ml: "-12px", color: themeVar("primary") }} />
                                    )}
                                    {canEdit && (
                                        <Box sx={{ position: "absolute", bottom: -4, right: -4, p: 0.75, bgcolor: themeVar("primary"), borderRadius: 2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}>
                                            <Camera size={14} color="white" />
                                        </Box>
                                    )}
                                </Box>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>Space Logo</Typography>
                        </Box>

                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                            <Tooltip title={canEdit ? "Change Cover" : "Space Cover"}>
                                <Box
                                    onClick={() => canEdit && !uploadingCover && coverInputRef.current?.click()}
                                    sx={{
                                        width: "100%",
                                        height: 100,
                                        borderRadius: 4,
                                        bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                                        border: `2px dashed ${themeVar("border")}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundImage: space.coverUrl ? `url(${space.coverUrl})` : "none",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        position: "relative",
                                        cursor: uploadingCover || !canEdit ? "default" : "pointer",
                                        overflow: "hidden",
                                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                                        transition: "border-color 0.2s ease",
                                        "&:hover": { borderColor: canEdit ? themeVar("primary") : themeVar("border") }
                                    }}
                                >
                                    {!space.coverUrl && !uploadingCover && <ImageIcon size={24} style={{ color: themeVar("textSecondary") }} />}
                                    {uploadingCover && <CircularProgress size={24} sx={{ color: themeVar("primary") }} />}
                                    {canEdit && !uploadingCover && (
                                        <Box sx={{ position: "absolute", bottom: 8, right: 8, px: 1.5, py: 0.75, bgcolor: "rgba(0,0,0,0.6)", borderRadius: 2, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                            <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>Update Cover Photo</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600, pl: 0.5 }}>Cover Photo</Typography>
                        </Box>
                    </Box>

                    {/* Blerb about the space assistant avatar */}
                    {!space.hideAssistantAvatarTip && (
                        <Box sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 92%)`,
                            border: `1px solid color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            position: "relative"
                        }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 85%)` }}>
                                <Avatar src={space.avatarUrl} sx={{ width: 24, height: 24, borderRadius: 1 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: themeVar("textLight"), fontSize: "0.85rem", lineHeight: 1.4, flex: 1, pr: 4 }}>
                                Your <Box component="span" sx={{ fontWeight: 700, color: themeVar("primary") }}>Space Logo</Box> also serves as the default avatar for your <Box component="span" sx={{ fontWeight: 700 }}>Space Assistant</Box>.
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={handleDismissTip}
                                sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    color: themeVar("textSecondary"),
                                    "&:hover": { color: themeVar("danger"), bgcolor: "rgba(255,0,0,0.1)" }
                                }}
                            >
                                <X size={14} />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Description Section */}
            <Box sx={{
                borderRadius: 4,
                bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 30%)`,
                border: `1px solid ${themeVar("border")}`,
                overflow: "hidden"
            }}>
                <Box sx={{
                    px: 3,
                    py: 2,
                    bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                    borderBottom: `1px solid ${themeVar("border")}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <Typography variant="caption" sx={{
                        fontWeight: 800,
                        color: themeVar("textSecondary"),
                        letterSpacing: "0.08em",
                        fontSize: "0.75rem",
                        textTransform: "uppercase"
                    }}>
                        Space Description
                    </Typography>
                    {canEdit && !editingDescription && (
                        <Button
                            size="small"
                            onClick={() => setEditingDescription(true)}
                            startIcon={<Edit2 size={14} />}
                            sx={{ color: themeVar("primary"), textTransform: "none", fontWeight: 700 }}
                        >
                            Edit
                        </Button>
                    )}
                </Box>

                <Box sx={{ p: 3 }}>
                    {editingDescription && canEdit ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Enter space description..."
                                inputProps={{ maxLength: 150 }}
                                helperText={`${newDescription.length}/150`}
                                FormHelperTextProps={{ sx: { textAlign: "right", color: "rgba(255,255,255,0.3)" } }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        color: themeVar("textLight"),
                                        bgcolor: `rgba(0,0,0,0.2)`,
                                        borderRadius: 3,
                                        "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                                        "&.Mui-focused fieldset": { borderColor: themeVar("primary") },
                                    }
                                }}
                            />
                            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                                <Button
                                    size="small"
                                    onClick={() => setEditingDescription(false)}
                                    sx={{ color: themeVar("textSecondary"), fontWeight: 700, textTransform: "none" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleUpdateDescription}
                                    sx={{
                                        bgcolor: themeVar("primary"),
                                        color: "white",
                                        fontWeight: 800,
                                        textTransform: "none",
                                        borderRadius: 2,
                                        px: 3,
                                        "&:hover": { bgcolor: themeVar("primary"), filter: "brightness(1.1)" }
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Typography sx={{
                            color: space.description ? themeVar("textLight") : themeVar("textSecondary"),
                            lineHeight: 1.6,
                            fontSize: "0.95rem",
                            fontStyle: space.description ? "normal" : "italic",
                            bgcolor: `rgba(0,0,0,0.1)`,
                            p: 2,
                            borderRadius: 3,
                            border: `1px solid rgba(255,255,255,0.05)`
                        }}>
                            {space.description || "No description set for this space."}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
