"use client";

import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { ThumbsUp } from "lucide-react";
import { useFeatures } from "../hooks/useFeatures";
import { TOPICS, FeedbackTopic } from "../../feedback/config/topics";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";

export default function FeatureList() {
  const [topic, setTopic] = React.useState<FeedbackTopic | "all">("gaming");
  const [statusFilter, setStatusFilter] = React.useState<"open" | "planned" | "in_progress" | "done" | "tabled" | "all">("all");
  const { items, vote } = useFeatures(topic, statusFilter === "all" ? undefined : statusFilter);
  const { user } = useUser();
  const isMaintainer = useQuery(api.community.features.isFeatureMaintainer, {});
  const me = useQuery(api.users.onboarding.queries.me, {});
  const updateStatus = useMutation(api.community.features.updateStatus as any);
  const updateTopicMut = useMutation(api.community.features.updateTopic as any);
  const deleteFeature = useMutation(api.community.features.deleteFeature as any);

  const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? v;

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', gap: 8, alignItems: 'center', mb: 0.5 }}>
        <div style={{ maxWidth: 240, width: '100%' }}>
          <UiSelect
            label="Filter by topic"
            size="sm"
            value={topic}
            onChange={(v) => setTopic(v as any)}
            options={[{ label: 'All topics', value: 'all' }, ...TOPICS.map((t) => ({ label: t.label, value: t.value }))]}
          />
        </div>

        <div style={{ maxWidth: 200, width: '100%' }}>
          <UiSelect
            label="Filter by status"
            size="sm"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={[{ label: 'All statuses', value: 'all' }, ...(["open","planned","in_progress","done","tabled"] as const).map((s) => ({ label: s.replace('_',' '), value: s }))]}
          />
        </div>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ p: 1, border: "1px dashed color-mix(in oklab, var(--text), transparent 80%)", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
            No features yet. Be the first to request one!
          </Typography>
        </Box>
      ) : (
        items.map((f) => (
          <Card key={f._id} elevation={0} sx={{ backgroundColor: 'var(--card)', borderRadius: 2, border: '1px solid color-mix(in oklab, var(--text) 20%, var(--card) 80%)' }}>
            <CardContent>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={topicLabel(f.topic)} size="small" sx={{ color: 'var(--text)', borderColor: 'color-mix(in oklab, var(--text), transparent 70%)' }} variant="outlined" />
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{f.title}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UiButton
                      size="sm"
                      variant="outline"
                      onClick={() => vote(f._id)}
                      startIcon={<ThumbsUp size={14} />}
                      disabled={Boolean(user?.id && f.clerkUserId && user.id === f.clerkUserId)}
                      className="disabled:opacity-50"
                    >
                      {f.votes}
                    </UiButton>
                    {(isMaintainer || (me?._id && f.userId && String(me._id) === String(f.userId))) && (
                      <UiButton size="sm" variant="danger" onClick={() => { void deleteFeature({ id: f._id } as any); }}>Delete</UiButton>
                    )}
                  </Stack>
                </Stack>
                {f.description && (
                  <Typography variant="body2" sx={{ color: 'var(--text)' }}>{f.description}</Typography>
                )}
                {isMaintainer ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <div style={{ minWidth: 160 }}>
                      <UiSelect
                        label="Status"
                        size="sm"
                        value={f.status ?? 'open'}
                        onChange={(v) => { void updateStatus({ id: f._id, status: v } as any); }}
                        options={["open","planned","in_progress","done","tabled"].map((s) => ({ label: s.replace('_',' '), value: s }))}
                      />
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <UiSelect
                        label="Topic"
                        size="sm"
                        value={f.topic}
                        onChange={(v) => { void updateTopicMut({ id: f._id, topic: v } as any); }}
                        options={TOPICS.map((t) => ({ label: t.label, value: t.value }))}
                      />
                    </div>
                  </Stack>
                ) : null}
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{new Date(f.createdAt).toLocaleString()}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
