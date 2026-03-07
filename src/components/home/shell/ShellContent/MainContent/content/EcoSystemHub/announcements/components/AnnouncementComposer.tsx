"use client";

import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { UiButton } from "@/components/ui/UiButton";

export interface AnnouncementComposerProps {
  onPost: (post: { title: string; content: string }) => void;
}

export default function AnnouncementComposer({ onPost }: AnnouncementComposerProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const max = 560;
  const remaining = max - content.length;
  const canPost = content.trim().length > 0 && content.length <= max;

  return (
    <Box
      sx={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--card-border)",
        boxShadow: "0 8px 24px color-mix(in oklab, var(--foreground) 10%, transparent)",
        borderRadius: 2,
        p: 2,
        display: "grid",
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 700 }}>
        Post an announcement
      </Typography>
      <TextField
        size="small"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        inputProps={{ maxLength: 120 }}
        sx={{
          "& .MuiOutlinedInput-root": {
            color: "var(--textPrimary)",
            "& fieldset": { borderColor: "var(--card-border)" },
            boxShadow: "0 2px 10px color-mix(in oklab, var(--foreground) 6%, transparent)",
            transition: "box-shadow .2s ease, border-color .2s ease",
            "&:hover": { boxShadow: "0 6px 16px color-mix(in oklab, var(--foreground) 10%, transparent)" },
            "&:hover fieldset": { borderColor: "color-mix(in oklab, var(--primary), var(--card-border))" },
            "&.Mui-focused": { boxShadow: "0 10px 24px color-mix(in oklab, var(--primary) 12%, transparent)" },
            "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
          },
          "& .MuiInputBase-input::placeholder": { color: "var(--textSecondary)", opacity: 1 },
        }}
      />
      <TextField
        multiline
        minRows={3}
        placeholder="What's the announcement? Include links, details, or notes..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        inputProps={{ maxLength: max }}
        sx={{
          "& .MuiOutlinedInput-root": {
            color: "var(--textPrimary)",
            "& fieldset": { borderColor: "var(--card-border)" },
            boxShadow: "0 2px 10px color-mix(in oklab, var(--foreground) 6%, transparent)",
            transition: "box-shadow .2s ease, border-color .2s ease",
            "&:hover": { boxShadow: "0 6px 16px color-mix(in oklab, var(--foreground) 10%, transparent)" },
            "&:hover fieldset": { borderColor: "color-mix(in oklab, var(--primary), var(--card-border))" },
            "&.Mui-focused": { boxShadow: "0 10px 24px color-mix(in oklab, var(--primary) 12%, transparent)" },
            "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
          },
          "& .MuiInputBase-input::placeholder": { color: "var(--textSecondary)", opacity: 1 },
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: remaining < 0 ? "#f87171" : "var(--textSecondary)" }}>
          {remaining} characters left
        </Typography>
        <UiButton
          variant="primary"
          size="sm"
          disabled={!canPost}
          onClick={() => {
            onPost({ title: title.trim(), content: content.trim() });
            setContent("");
          }}
        >
          Post
        </UiButton>
      </Box>
    </Box>
  );
}
