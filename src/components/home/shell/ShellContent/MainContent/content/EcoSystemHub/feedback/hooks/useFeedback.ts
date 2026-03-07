"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { FeedbackTopic } from "../config/topics";

export interface FeedbackRow {
  _id: string;
  topic: FeedbackTopic;
  status?: "new" | "acknowledged" | "needs_info" | "resolved" | "closed";
  overall: number;
  comments?: string;
  answers?: Record<string, any>;
  votes: number;
  createdAt: number;
  clerkUserId?: string;
  userId?: string;
}

export function useFeedback(topic?: FeedbackTopic | "all", status?: FeedbackRow["status"] | "all") {
  const listArgs = useMemo(() => ({
    topic: topic && topic !== "all" ? topic : undefined,
    status: status && status !== "all" ? status : undefined,
  }), [topic, status]);
  const items = useQuery(api.community.feedback.list, listArgs) as unknown as FeedbackRow[] | undefined;

  const createMutation = useMutation(api.community.feedback.create);
  const voteUp = useMutation(api.community.feedback.voteUp);

  async function createFeedback(input: { topic: FeedbackTopic; overall: number; comments?: string; answers?: Record<string, any> }) {
    const res = await createMutation(input);
    return res?._id as string | undefined;
  }

  async function vote(id: string) {
    try {
      await voteUp({ id: id as any });
    } catch {}
  }

  return { items: items ?? [], createFeedback, vote };
}
