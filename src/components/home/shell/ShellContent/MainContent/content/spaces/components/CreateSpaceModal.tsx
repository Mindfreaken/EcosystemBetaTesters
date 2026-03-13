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
import { X, Globe, Lock, Palette, Upload, Image as ImageIcon, User, Layout, RefreshCcw, Check, ChevronRight, ChevronLeft, Camera } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";
import Avatar from "@mui/material/Avatar";

const DEFAULT_AVATARS = Array.from({ length: 15 }, (_, i) => `/avatars/default/default_${String(i + 1).padStart(3, '0')}.jpg`);
const DEFAULT_COVERS = Array.from({ length: 19 }, (_, i) => `/covers/default/default_${String(i + 1).padStart(3, '0')}.png`);

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

interface CreateSpaceModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (spaceId: string) => void;
}

export default function CreateSpaceModal({ open, onClose, onSuccess }: CreateSpaceModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [step, setStep] = useState(0);
    const [brandingType, setBrandingType] = useState<'default' | 'custom'>('default');
    const [avatarUrl, setAvatarUrl] = useState(getRandomItem(DEFAULT_AVATARS));
    const [coverUrl, setCoverUrl] = useState(getRandomItem(DEFAULT_COVERS));
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const createSpace = useMutation(api.spaces.core.createSpace);
    const generateUploadUrl = useMutation(api.chat.storage.generateUploadUrl);
    const saveFileMetadata = useMutation(api.chat.storage.saveFileMetadata);
    const me = useQuery(api.users.onboarding.queries.me, {});

    const handleClose = () => {
        if (loading) return;
        setName("");
        setDescription("");
        setIsPublic(false);
        setError(null);
        setStep(0);
        setBrandingType('default');
        setAvatarUrl(getRandomItem(DEFAULT_AVATARS));
        setCoverUrl(getRandomItem(DEFAULT_COVERS));
        onClose();
    };

    const handleShuffleDefaults = () => {
        setAvatarUrl(getRandomItem(DEFAULT_AVATARS));
        setCoverUrl(getRandomItem(DEFAULT_COVERS));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (type === 'avatar') setUploadingAvatar(true);
        else setUploadingCover(true);

        try {
            if (!me) throw new Error("User not authenticated");

            const uploadUrlResult = await generateUploadUrl({ fileSize: file.size });
            if (!uploadUrlResult.success) {
                setError("Not enough storage space");
                return;
            }

            const result = await fetch(uploadUrlResult.url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Failed to upload to storage");

            const { storageId } = await result.json();
            const fileMetadata = await saveFileMetadata({
                storageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                userId: me._id,
                path: `/spaces/branding/${type}`
            });

            if (type === 'avatar') setAvatarUrl(fileMetadata.url);
            else setCoverUrl(fileMetadata.url);
        } catch (err) {
            console.error(`Upload error for ${type}:`, err);
            setError(`Failed to upload ${type}`);
        } finally {
            if (type === 'avatar') setUploadingAvatar(false);
            else setUploadingCover(false);
        }
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
                avatarUrl,
                coverUrl
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
            maxWidth={step === 0 ? "xs" : "sm"}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: 'color-mix(in oklab, var(--overlay), transparent 20%)',
                        backdropFilter: 'blur(8px)',
                    },
                },
                paper: {
                    sx: {
                        background: 'color-mix(in oklab, var(--card), transparent 5%)',
                        border: '1px solid color-mix(in oklab, var(--border), transparent 35%)',
                        boxShadow: '0 12px 48px color-mix(in oklab, var(--shadow), transparent 35%)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                },
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    px: 3,
                    py: 2.5,
                    color: themeVar("foreground"),
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: `linear-gradient(to bottom, color-mix(in oklab, ${themeVar("primary")}, transparent 95%), transparent)`,
                    borderBottom: `1px solid ${themeVar("border")}`,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: themeVar("primary"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 12px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`
                    }}>
                        <Globe size={18} color="white" strokeWidth={2.5} />
                    </Box>
                    {step === 0 ? "Create a New Space" : "Customize Your Brand"}
                </Box>
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{
                        color: themeVar("mutedForeground"),
                        bgcolor: `color-mix(in oklab, ${themeVar("mutedForeground")}, transparent 90%)`,
                        "&:hover": { color: themeVar("foreground"), background: `color-mix(in oklab, ${themeVar("mutedForeground")}, transparent 80%)` },
                    }}
                >
                    <X size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, mt: 1 }}>
                {step === 0 ? (
                    <>
                        <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mb: 4, lineHeight: 1.6 }}>
                            Spaces are dedicated homes for your community. Start with the basics—you can refine the fine details later.
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <TextField
                                fullWidth
                                label="Space Name"
                                placeholder="e.g. The Creative Hub"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                variant="outlined"
                                inputProps={{ maxLength: 32 }}
                                helperText={`${name.length}/32`}
                                FormHelperTextProps={{ sx: { textAlign: "right", color: themeVar("mutedForeground"), opacity: 0.5 } }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 3,
                                        bgcolor: `color-mix(in oklab, ${themeVar("border")}, transparent 95%)`,
                                        "& fieldset": { borderColor: themeVar("border"), borderWidth: '2px' },
                                        "&:hover fieldset": { borderColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 60%)` },
                                        "&.Mui-focused fieldset": { borderColor: themeVar("primary") },
                                    },
                                    "& .MuiInputLabel-root": { color: themeVar("mutedForeground"), fontWeight: 700 },
                                    "& .MuiInputLabel-root.Mui-focused": { color: themeVar("primary") }
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                placeholder="What's this space's mission?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                                multiline
                                rows={3}
                                variant="outlined"
                                inputProps={{ maxLength: 150 }}
                                helperText={`${description.length}/150`}
                                FormHelperTextProps={{ sx: { textAlign: "right", color: themeVar("mutedForeground"), opacity: 0.5 } }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 3,
                                        bgcolor: `color-mix(in oklab, ${themeVar("border")}, transparent 95%)`,
                                        "& fieldset": { borderColor: themeVar("border"), borderWidth: '2px' },
                                        "&:hover fieldset": { borderColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 60%)` },
                                        "&.Mui-focused fieldset": { borderColor: themeVar("primary") },
                                    },
                                    "& .MuiInputLabel-root": { color: themeVar("mutedForeground"), fontWeight: 700 },
                                    "& .MuiInputLabel-root.Mui-focused": { color: themeVar("primary") }
                                }}
                            />

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                borderRadius: 3,
                                border: `2px solid ${themeVar("border")}`,
                                bgcolor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 98%)`
                            }}>
                                <Box sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    bgcolor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 90%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Lock size={20} color={themeVar("destructive")} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                        Space security
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
                                        Spaces are invite-only. You can Create invite codes and links to share with others.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mb: 4 }}>
                            Define your visual identity. Choose a preset theme or upload high-resolution assets.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 3, height: 320 }}>
                            {/* Branding Choices */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 200 }}>
                                <Box
                                    onClick={() => setBrandingType('default')}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        border: `2px solid ${brandingType === 'default' ? themeVar("primary") : themeVar("border")}`,
                                        bgcolor: brandingType === 'default' ? `color-mix(in oklab, ${themeVar("primary")}, transparent 95%)` : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { borderColor: themeVar("primary") }
                                    }}
                                >
                                    <Palette size={20} color={brandingType === 'default' ? themeVar("primary") : themeVar("mutedForeground")} />
                                    <Typography sx={{ fontWeight: 800, mt: 1, fontSize: '0.85rem' }}>Default Presets</Typography>
                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: 'block' }}>Generic styles</Typography>
                                </Box>

                                <Box
                                    onClick={() => setBrandingType('custom')}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        border: `2px solid ${brandingType === 'custom' ? themeVar("primary") : themeVar("border")}`,
                                        bgcolor: brandingType === 'custom' ? `color-mix(in oklab, ${themeVar("primary")}, transparent 95%)` : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { borderColor: themeVar("primary") }
                                    }}
                                >
                                    <Upload size={20} color={brandingType === 'custom' ? themeVar("primary") : themeVar("mutedForeground")} />
                                    <Typography sx={{ fontWeight: 800, mt: 1, fontSize: '0.85rem' }}>Custom Branding</Typography>
                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: 'block' }}>Upload your own</Typography>
                                </Box>

                                {brandingType === 'default' && (
                                    <Button
                                        startIcon={<RefreshCcw size={14} />}
                                        onClick={handleShuffleDefaults}
                                        sx={{
                                            mt: 'auto',
                                            color: themeVar("primary"),
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            '&:hover': { bgcolor: 'transparent', opacity: 0.8 }
                                        }}
                                    >
                                        Shuffle Styles
                                    </Button>
                                )}
                            </Box>

                            {/* Preview/Upload Area */}
                            <Box sx={{
                                flex: 1,
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: `2px solid ${themeVar("border")}`,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: `color-mix(in oklab, ${themeVar("border")}, transparent 90%)`
                            }}>
                                {/* Cover Preview */}
                                <Box sx={{
                                    height: '50%',
                                    width: '100%',
                                    bgcolor: themeVar("border"),
                                    position: 'relative',
                                    backgroundImage: `url(${coverUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {brandingType === 'custom' && (
                                        <label>
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} disabled={uploadingCover} />
                                            <Box sx={{
                                                p: 1.5,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(0,0,0,0.4)',
                                                backdropFilter: 'blur(10px)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                                            }}>
                                                {uploadingCover ? <CircularProgress size={16} color="inherit" /> : <ImageIcon size={20} />}
                                            </Box>
                                        </label>
                                    )}
                                </Box>

                                {/* Avatar & Info Preview */}
                                <Box sx={{ flex: 1, p: 3, pt: 5, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)' }}>
                                        <Box sx={{ position: 'relative' }}>
                                            <Avatar
                                                src={avatarUrl}
                                                sx={{
                                                    width: 80,
                                                    height: 80,
                                                    border: `4px solid ${themeVar("background")}`,
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                            {brandingType === 'custom' && (
                                                <label>
                                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} disabled={uploadingAvatar} />
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        p: 0.8,
                                                        borderRadius: '50%',
                                                        bgcolor: themeVar("primary"),
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                        '&:hover': { filter: 'brightness(1.1)' }
                                                    }}>
                                                        {uploadingAvatar ? <CircularProgress size={12} color="inherit" /> : <Camera size={14} />}
                                                    </Box>
                                                </label>
                                            )}
                                        </Box>
                                    </Box>

                                    <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', textAlign: 'center' }}>{name || "Your Space Name"}</Typography>
                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), textAlign: 'center', mt: 1, px: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {description || "No description provided yet."}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}

                {error && (
                    <Typography variant="caption" sx={{ color: themeVar("destructive"), fontWeight: 700, mt: 3, display: 'block', textAlign: 'center' }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 4, pt: 1, gap: 2 }}>
                {step === 0 ? (
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setStep(1)}
                        disabled={!name.trim()}
                        endIcon={<ChevronRight size={18} />}
                        sx={{
                            bgcolor: themeVar("primary"),
                            color: "white",
                            fontWeight: 900,
                            borderRadius: 4,
                            py: 1.5,
                            fontSize: '1rem',
                            textTransform: 'none',
                            boxShadow: `0 8px 24px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
                            '&:hover': { bgcolor: themeVar("primary"), filter: 'brightness(1.1)' }
                        }}
                    >
                        Continue to Branding
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={() => setStep(0)}
                            startIcon={<ChevronLeft size={18} />}
                            sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: 'none' }}
                        >
                            Back
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleCreate}
                            disabled={loading || uploadingAvatar || uploadingCover}
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Check size={18} />}
                            sx={{
                                bgcolor: themeVar("primary"),
                                color: "white",
                                fontWeight: 900,
                                borderRadius: 4,
                                py: 1.5,
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: `0 8px 24px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
                                '&:hover': { bgcolor: themeVar("primary"), filter: 'brightness(1.1)' }
                            }}
                        >
                            {loading ? "Creating..." : "Launch Space"}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
