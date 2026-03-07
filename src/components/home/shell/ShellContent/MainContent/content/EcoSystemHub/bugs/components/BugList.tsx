"use client";

import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { ThumbsUp } from "lucide-react";
import { useBugs, BugSeverity, BugStatus } from "../hooks/useBugs";
import type { BugRow } from "../hooks/useBugs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { FeedbackTopic } from "../../feedback/config/topics";
import { TOPICS } from "../../feedback/config/topics";
import { UiButton } from "@/components/ui/UiButton";
import { UiSelect } from "@/components/ui/UiSelect";

export default function BugList() {
  const [status, setStatus] = React.useState<BugStatus | undefined>(undefined);
  const [severity, setSeverity] = React.useState<BugSeverity | undefined>(undefined);
  const [topic, setTopic] = React.useState<FeedbackTopic | "all">("all");
  const { items, upvote, setStatus: setBugStatus, setSeverity: setBugSeverity, removeBug } = useBugs({ status, severity, topic } as any);
  const isMaintainer = useQuery(api.community.bugs.bugs.isBugMaintainer, {});
  const me = useQuery(api.users.onboarding.queries.me, {});

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', gap: 8, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <UiSelect
            label="Topic"
            size="sm"
            value={topic}
            onChange={(v) => setTopic(v as any)}
            options={[{ label: 'All topics', value: 'all' }, ...TOPICS.map((t) => ({ label: t.label, value: t.value }))]}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <UiSelect
            label="Status"
            size="sm"
            value={status ?? ''}
            onChange={(v) => setStatus((v || undefined) as any)}
            options={[{ label: 'All', value: '' }, ...(["open","in_progress","resolved","closed"] as BugStatus[]).map((s) => ({ label: s.replace('_',' '), value: s }))]}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <UiSelect
            label="Severity"
            size="sm"
            value={severity ?? ''}
            onChange={(v) => setSeverity((v || undefined) as any)}
            options={[{ label: 'All', value: '' }, ...(["low","medium","high","critical"] as BugSeverity[]).map((s) => ({ label: s, value: s }))]}
          />
        </div>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ p: 1, border: "1px dashed color-mix(in oklab, var(--text), transparent 80%)", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
            No bugs found.
          </Typography>
        </Box>
      ) : (
        items.map((b: any) => {
          const canDelete = Boolean(isMaintainer) || Boolean(me?._id && b.reporterId && String(me._id) === String(b.reporterId));
          return (
          <Card key={b._id} elevation={0} sx={{ backgroundColor: 'var(--card)', borderRadius: 2, border: '1px solid color-mix(in oklab, var(--text) 20%, var(--card) 80%)' }}>
            <CardContent>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={b.topic} size="small" sx={{ color: 'var(--text)', borderColor: 'color-mix(in oklab, var(--text), transparent 70%)' }} variant="outlined" />
                    <Chip label={b.severity} size="small" sx={{ color: 'var(--text)', borderColor: 'color-mix(in oklab, var(--text), transparent 70%)' }} variant="outlined" />
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{b.title}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <UiButton size="sm" variant="outline" onClick={() => upvote(b._id)} startIcon={<ThumbsUp size={14} />}> {(b.upvoters?.length ?? 0)} </UiButton>
                    {canDelete && (
                      <UiButton size="sm" variant="danger" onClick={() => removeBug(b._id)}>Delete</UiButton>
                    )}
                  </Stack>
                </Stack>
                <Typography variant="body2" sx={{ color: 'var(--text)' }}>{b.description}</Typography>
                {isMaintainer ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <div style={{ minWidth: 160 }}>
                      <UiSelect
                        label="Status"
                        size="sm"
                        value={b.status}
                        onChange={(v) => { void setBugStatus(b._id, v as BugStatus); }}
                        options={(["open","in_progress","resolved","closed"] as BugStatus[]).map((s) => ({ label: s.replace('_',' '), value: s }))}
                      />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <UiSelect
                        label="Severity"
                        size="sm"
                        value={b.severity}
                        onChange={(v) => { void setBugSeverity(b._id, v as BugSeverity); }}
                        options={(["low","medium","high","critical"] as BugSeverity[]).map((s) => ({ label: s, value: s }))}
                      />
                    </div>
                  </Stack>
                ) : null}
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{new Date(b.createdAt).toLocaleString()}</Typography>
              </Stack>
            </CardContent>
          </Card>
        );
        })
      )}
    </Stack>
  );
}
