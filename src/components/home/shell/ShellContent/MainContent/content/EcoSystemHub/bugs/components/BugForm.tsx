"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { BugSeverity } from "../hooks/useBugs";
import { FeedbackTopic, TOPICS } from "../../feedback/config/topics";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";

interface Props {
  onSubmit: (data: { title: string; description: string; topic: FeedbackTopic; severity: BugSeverity }) => void;
}

export default function BugForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<FeedbackTopic>("home");
  const [severity, setSeverity] = useState<BugSeverity>("low");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), topic, severity });
    setTitle("");
    setDescription("");
    setSeverity("low");
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: 'var(--text)',
      backgroundColor: 'var(--input)',
      '& fieldset': { borderColor: 'color-mix(in oklab, var(--text), transparent 70%)' },
      '&:hover fieldset': { borderColor: 'color-mix(in oklab, var(--text), transparent 50%)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--text)' },
    },
    '& .MuiInputLabel-root': { color: 'color-mix(in oklab, var(--text), transparent 40%)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--text)' },
  } as const;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text)' }}>Report a bug</Typography>

      <TextField
        label="Title"
        size="small"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Short, descriptive title"
        fullWidth
        sx={inputSx}
      />

      <UiSelect
        label="Topic"
        size="sm"
        value={topic}
        onChange={(v) => setTopic(v as FeedbackTopic)}
        options={TOPICS.map((t) => ({ label: t.label, value: t.value }))}
      />

      <UiSelect
        label="Severity"
        size="sm"
        value={severity}
        onChange={(v) => setSeverity(v as BugSeverity)}
        options={("low,medium,high,critical".split(",") as BugSeverity[]).map((s) => ({ label: s[0].toUpperCase()+s.slice(1), value: s }))}
      />

      <TextField
        label="Description"
        placeholder="Steps to reproduce, expected vs actual behavior"
        size="small"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        multiline
        minRows={3}
        sx={inputSx}
      />

      <Stack direction="row" spacing={1}>
        <UiButton type="submit" variant="primary" size="sm">Submit bug</UiButton>
      </Stack>
    </Box>
  );
}
