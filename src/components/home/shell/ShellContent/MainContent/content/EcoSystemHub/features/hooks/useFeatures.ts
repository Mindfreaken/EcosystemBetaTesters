"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { FeedbackTopic } from "../../feedback/config/topics";

export interface FeatureRow {
  _id: string;
  title: string;
  topic: FeedbackTopic;
  description?: string;
  status?: "open" | "planned" | "in_progress" | "done" | "tabled";
  votes: number;
  createdAt: number;
  clerkUserId?: string;
  userId?: string;
}

export function useFeatures(topic?: FeedbackTopic | "all", status?: FeatureRow["status"] | "all") {
  const args = useMemo(() => ({
    topic: topic && topic !== "all" ? topic : undefined,
    status: status && status !== "all" ? status : undefined,
  }), [topic, status]);
  const items = useQuery(api.community.features.list, args) as unknown as FeatureRow[] | undefined;

  const createMutation = useMutation(api.community.features.create);
  const voteUp = useMutation(api.community.features.voteUp);

  async function createFeature(input: { title: string; topic: FeedbackTopic; description?: string }) {
    const res = await createMutation(input);
    return res?._id as string | undefined;
  }

  async function vote(id: string) {
    try { await voteUp({ id: id as any }); } catch {}
  }

  return { items: items ?? [], createFeature, vote };
}
