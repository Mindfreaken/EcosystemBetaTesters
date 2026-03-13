"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import { Plus, Trash2, Smile } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

interface EmojisTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
}

export default function EmojisTab({ space, role }: EmojisTabProps) {
    const { toast } = useToast();
    const customEmojis = useQuery(api.spaces.emojis.getSpaceCustomEmojis, { spaceId: space._id });
    const generateUploadUrl = useMutation(api.spaces.emojis.generateEmojiUploadUrl);
    const saveCustomEmoji = useMutation(api.spaces.emojis.saveCustomEmoji);
    const deleteCustomEmoji = useMutation(api.spaces.emojis.deleteCustomEmoji);

    const [emojiName, setEmojiName] = React.useState("");
    const [uploadingEmoji, setUploadingEmoji] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [confirmDialog, setConfirmDialog] = React.useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmLabel?: string;
        isDanger?: boolean;
    }>({
        open: false, title: "", message: "", onConfirm: () => { }
    });

    const handleUploadEmoji = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !emojiName.trim()) return;

        setUploadingEmoji(true);
        try {
            const postUrl = await generateUploadUrl();
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
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast({
                title: "Emoji Uploaded",
                description: `:${emojiName}: is now available in this space.`,
            });
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Upload Failed",
                description: err.message || "Failed to upload emoji.",
                variant: "destructive",
            });
        } finally {
            setUploadingEmoji(false);
        }
    };

    const handleDeleteEmoji = async (emojiId: Id<"spaceCustomEmojis">, name: string) => {
        setConfirmDialog({
            open: true,
            title: "Delete Emoji",
            message: `Are you sure you want to delete :${name}:? This cannot be undone.`,
            confirmLabel: "Delete Emoji",
            isDanger: true,
            onConfirm: async () => {
                await deleteCustomEmoji({ emojiId });
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const canEditEmojis = role === "owner" || role === "admin";

    if (!canEditEmojis) {
        return <Typography sx={{ color: themeVar("mutedForeground"), p: 4 }}>You do not have permission to manage custom emojis.</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mb: 4 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                        <Smile size={16} /> CUSTOM EMOJIS
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
                        Upload custom emojis for members to use in this space. Max size 256KB.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        label="Emoji Name (no colons)"
                        value={emojiName}
                        onChange={(e) => setEmojiName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                        placeholder="e.g. pog"
                        InputLabelProps={{ sx: { color: themeVar("mutedForeground"), "&.Mui-focused": { color: themeVar("primary") } } }}
                        InputProps={{
                            sx: { color: themeVar("foreground"), bgcolor: "rgba(0,0,0,0.2)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") } }
                        }}
                        sx={{ width: 200 }}
                    />
                    <Button
                        variant="contained"
                        component="label"
                        disabled={!emojiName.trim() || uploadingEmoji}
                        startIcon={<Plus size={16} />}
                        sx={{ bgcolor: themeVar("primary"), "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" } }}
                    >
                        {uploadingEmoji ? "Uploading..." : "Upload Image"}
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleUploadEmoji}
                        />
                    </Button>
                </Stack>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
                {customEmojis?.map(emoji => (
                    <Box key={emoji._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, position: "relative", "&:hover .delete-btn": { opacity: 1 } }}>
                        <Box
                            component="img"
                            src={emoji.url!}
                            alt={emoji.name}
                            sx={{ width: 48, height: 48, objectFit: "contain" }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("mutedForeground") }}>:{emoji.name}:</Typography>

                        <IconButton
                            className="delete-btn"
                            size="small"
                            onClick={() => handleDeleteEmoji(emoji._id, emoji.name)}
                            sx={{ position: "absolute", top: 4, right: 4, opacity: 0, transition: "opacity 0.2s", color: themeVar("destructive"), bgcolor: "rgba(0,0,0,0.5)", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}
                        >
                            <Trash2 size={12} />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            {customEmojis?.length === 0 && (
                <Typography variant="body2" sx={{ textAlign: "center", color: themeVar("mutedForeground"), py: 4, fontStyle: "italic" }}>
                    No custom emojis uploaded yet.
                </Typography>
            )}

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))} PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none" } }}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
                    <Button variant="contained" onClick={confirmDialog.onConfirm} sx={{ bgcolor: confirmDialog.isDanger ? themeVar("destructive") : themeVar("primary"), color: "white" }}>{confirmDialog.confirmLabel}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


