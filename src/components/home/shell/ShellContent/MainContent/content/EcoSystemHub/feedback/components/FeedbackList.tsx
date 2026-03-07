"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { ThumbsUp } from "lucide-react";
import { useFeedback } from "../hooks/useFeedback";
import { TOPICS, FeedbackTopic } from "../config/topics";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";
import { MuiCard } from "@/components/ui/MuiCard";

export default function FeedbackList() {
  const [topic, setTopic] = React.useState<FeedbackTopic | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"new" | "acknowledged" | "needs_info" | "resolved" | "closed" | "all">("all");
  const { items, vote } = useFeedback(topic, statusFilter === "all" ? undefined : statusFilter);
  const { user } = useUser();
  const isMaintainer = useQuery(api.community.feedback.isFeedbackMaintainer, {});
  const me = useQuery(api.users.onboarding.queries.me, {});
  const updateTopicMut = useMutation(api.community.feedback.updateTopic as any);
  const deleteFeedback = useMutation(api.community.feedback.deleteFeedback as any);
  const updateStatus = useMutation(api.community.feedback.updateStatus as any);

  const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? v;

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', gap: 8, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 240, width: '100%' }}>
          <UiSelect
            label="Filter by topic"
            size="sm"
            value={topic}
            onChange={(v) => setTopic(v as any)}
            options={[{ label: 'All topics', value: 'all' }, ...TOPICS.map((t) => ({ label: t.label, value: t.value }))]}
          />
        </div>

        <div style={{ maxWidth: 220, width: '100%' }}>
          <UiSelect
            label="Filter by status"
            size="sm"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={[{ label: 'All statuses', value: 'all' }, ...(["new","acknowledged","needs_info","resolved","closed"] as const).map((s) => ({ label: s.replace('_',' '), value: s }))]}
          />
        </div>
      </Box>
      {items.length === 0 ? (
        <MuiCard variant="interactive">
          <Box sx={{ p: 1, border: "1px dashed color-mix(in oklab, var(--text), transparent 80%)", borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
              No feedback yet. Be the first to share!
            </Typography>
          </Box>
        </MuiCard>
      ) : (
      items.map((fb) => (
        <MuiCard key={fb._id} variant="interactive">
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={topicLabel(fb.topic)} size="small" sx={{ color: 'var(--text)', borderColor: 'color-mix(in oklab, var(--text), transparent 70%)' }} variant="outlined" />
                <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                  Overall: {fb.overall}/5
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <UiButton
                  size="sm"
                  variant="outline"
                  onClick={() => vote(fb._id)}
                  startIcon={<ThumbsUp size={14} />}
                  disabled={Boolean(user?.id && fb.clerkUserId && user.id === fb.clerkUserId)}
                  className="disabled:opacity-50"
                >
                  {fb.votes}
                </UiButton>
                {(isMaintainer || (me?._id && fb.userId && String(me._id) === String(fb.userId))) && (
                  <UiButton size="sm" variant="danger" onClick={() => { void deleteFeedback({ id: fb._id } as any); }}>Delete</UiButton>
                )}
              </Stack>
            </Stack>
            {fb.comments && (
              <Typography variant="body2" sx={{ color: "var(--text)" }}>
                {fb.comments}
              </Typography>
            )}
            {isMaintainer ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <div style={{ minWidth: 180 }}>
                  <UiSelect
                    label="Status"
                    size="sm"
                    value={fb.status ?? 'new'}
                    onChange={(v) => { void updateStatus({ id: fb._id, status: v } as any); }}
                    options={["new","acknowledged","needs_info","resolved","closed"].map((s) => ({ label: s.replace('_',' '), value: s }))}
                  />
                </div>
                <div style={{ minWidth: 180 }}>
                  <UiSelect
                    label="Topic"
                    size="sm"
                    value={fb.topic}
                    onChange={(v) => { void updateTopicMut({ id: fb._id, topic: v } as any); }}
                    options={TOPICS.map((t) => ({ label: t.label, value: t.value }))}
                  />
                </div>
              </Stack>
            ) : null}
            <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>
              {new Date(fb.createdAt).toLocaleString()}
            </Typography>
          </Stack>
        </MuiCard>
      ))
      )}
    </Stack>
  );
}
