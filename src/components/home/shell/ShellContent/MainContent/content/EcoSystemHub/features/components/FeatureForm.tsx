"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { FeedbackTopic, TOPICS } from "../../feedback/config/topics";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";

interface Props {
  onSubmit: (data: { title: string; topic: FeedbackTopic; description?: string }) => void;
}

export default function FeatureForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<FeedbackTopic>("gaming");
  const [description, setDescription] = useState("");

  const leftSidebarWipLabels = useMemo(() => new Set([
    "Spaces","Hire","View","Live","Campaigns","Docs","Music","Gaming","Esports","Notes"
  ]), []);
  const isTopicWip = (label: string) => leftSidebarWipLabels.has(label);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), topic, description: description || undefined });
    setTitle("");
    setDescription("");
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
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text)' }}>Request a feature</Typography>

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
        options={TOPICS.map((t) => ({ label: t.label + (isTopicWip(t.label) ? " (WIP)" : ""), value: t.value, disabled: isTopicWip(t.label) }))}
      />

      <TextField
        label="Description"
        placeholder="Explain the problem and the proposed solution"
        size="small"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        multiline
        minRows={3}
        sx={inputSx}
      />

      <Stack direction="row" spacing={1}>
        <UiButton type="submit" variant="primary" size="sm">Submit feature</UiButton>
      </Stack>
    </Box>
  );
}
