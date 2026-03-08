"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import { DEFAULT_QUESTIONS, FeedbackQuestion, FeedbackTopic, TOPICS } from "../config/topics";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";

interface Props {
  onSubmit: (data: { topic: FeedbackTopic; overall: number; comments?: string; answers?: Record<string, any> }) => void;
}

export default function FeedbackForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState<FeedbackTopic>("home");
  const [overall, setOverall] = useState<number | null>(3);
  const [comments, setComments] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questions = useMemo<FeedbackQuestion[]>(() => DEFAULT_QUESTIONS[topic] || [], [topic]);

  // Mirror LeftSidebar WIP rule for nav items: all except Home and Dailies are WIP
  // LeftSidebar nav items: Home, Spaces, Hire, View, Live, Campaigns, Docs, Music, Gaming, Dailies, Esports
  const leftSidebarWipLabels = useMemo(() => new Set([
    "Spaces",
    "Hire",
    "View",
    "Live",
    "Campaigns",
    "Docs",
    "Music",
    "Gaming",
    "Esports",
    "Notes",
  ]), []);

  const isTopicWip = (label: string) => leftSidebarWipLabels.has(label);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!overall) return;
    onSubmit({ topic, overall, comments: comments || undefined, answers });
    setComments("");
    setOverall(3);
    setAnswers({});
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: 'var(--text)',
      backgroundColor: 'var(--input)',
      '& fieldset': {
        borderColor: 'color-mix(in oklab, var(--text), transparent 70%)',
      },
      '&:hover fieldset': {
        borderColor: 'color-mix(in oklab, var(--text), transparent 50%)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--text)',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'color-mix(in oklab, var(--text), transparent 40%)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'var(--text)',
    },
    '& .MuiSelect-icon': {
      color: 'var(--text)',
    },
    '& .MuiOutlinedInput-input::placeholder': {
      color: 'color-mix(in oklab, var(--text), transparent 55%)',
    },
  } as const;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--text)" }}>
        Share your feedback
      </Typography>

      <UiSelect
        label="Topic"
        size="sm"
        value={topic}
        onChange={(v) => setTopic(v as FeedbackTopic)}
        options={TOPICS.map((t) => ({ label: t.label + (isTopicWip(t.label) ? " (WIP)" : ""), value: t.value, disabled: isTopicWip(t.label) }))}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ color: "var(--textSecondary)" }}>
          Overall opinion
        </Typography>
        <Rating
          name="overall"
          value={overall}
          onChange={(_, v) => setOverall(v)}
          sx={{
            color: 'var(--text)',
            '& .MuiRating-iconEmpty': {
              color: 'color-mix(in oklab, var(--text), transparent 50%)',
            },
          }}
        />
      </Stack>

      <TextField
        label="Comments"
        placeholder="Share your thoughts"
        size="small"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        fullWidth
        multiline
        minRows={3}
        sx={inputSx}
      />

      {/* Dynamic topic-specific questions (excluding overall/comments duplicates) */}
      {questions
        .filter((q) => q.id !== "overall" && q.id !== "comments")
        .map((q) => (
          <Box key={q.id}>
            {q.type === "rating" ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ color: "var(--textSecondary)" }}>
                  {q.label}
                </Typography>
                <Rating
                  value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : 0}
                  onChange={(_, v) => setAnswers((a) => ({ ...a, [q.id]: v ?? 0 }))}
                  sx={{
                    color: 'var(--text)',
                    '& .MuiRating-iconEmpty': {
                      color: 'color-mix(in oklab, var(--text), transparent 50%)',
                    },
                  }}
                />
              </Stack>
            ) : (
              <TextField
                size="small"
                label={q.label}
                placeholder={q.placeholder}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            )}
          </Box>
        ))}

      <Divider sx={{ my: 0.5 }} />

      <Stack direction="row" spacing={1}>
        <UiButton type="submit" variant="primary" size="sm">
          Submit feedback
        </UiButton>
      </Stack>
    </Box>
  );
}
