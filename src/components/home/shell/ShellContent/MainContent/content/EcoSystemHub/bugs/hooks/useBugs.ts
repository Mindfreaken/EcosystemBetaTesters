"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { FeedbackTopic } from "../../feedback/config/topics";

export type BugStatus = "open" | "in_progress" | "resolved" | "closed";
export type BugSeverity = "low" | "medium" | "high" | "critical";

export interface BugRow {
  _id: string;
  title: string;
  description: string;
  topic: FeedbackTopic;
  status: BugStatus;
  severity: BugSeverity;
  reporterId?: any;
  createdAt: number;
  updatedAt: number;
  upvoters?: string[];
}

export type UseBugsResult = {
  items: BugRow[];
  createBug: (input: { title: string; description: string; topic: FeedbackTopic; severity: BugSeverity; tags?: string[] }) => Promise<any>;
  upvote: (bugId: string) => Promise<void>;
  setStatus: (bugId: string, status: BugStatus) => Promise<void>;
  setSeverity: (bugId: string, severity: BugSeverity) => Promise<void>;
  removeBug: (bugId: string) => Promise<void>;
};

export function useBugs(filters?: { status?: BugStatus; severity?: BugSeverity; topic?: FeedbackTopic | "all" }): UseBugsResult {
  const args = useMemo(() => ({
    status: filters?.status,
    severity: filters?.severity,
    topic: filters?.topic && filters.topic !== "all" ? filters.topic : undefined,
  }), [filters?.status, filters?.severity, filters?.topic]);

  // Note: file path convex/community/bugs/bugs.ts -> api.community.bugs.bugs
  const items = useQuery(api.community.bugs.bugs.listBugs as any, args) as unknown as BugRow[] | undefined;
  const create = useMutation(api.community.bugs.bugs.createBugByIdentity as any);
  const toggleUpvote = useMutation(api.community.bugs.bugs.toggleUpvoteByIdentity as any);
  const updateStatus = useMutation(api.community.bugs.bugs.updateStatus as any);
  const updateSeverity = useMutation(api.community.bugs.bugs.updateSeverity as any);
  const deleteBug = useMutation(api.community.bugs.bugs.deleteBug as any);

  async function createBug(input: { title: string; description: string; topic: FeedbackTopic; severity: BugSeverity; tags?: string[] }) {
    return await create(input as any);
  }

  async function upvote(bugId: string) {
    await toggleUpvote({ bugId } as any);
  }

  async function setStatus(bugId: string, status: BugStatus) {
    await updateStatus({ bugId, status } as any);
  }

  async function setSeverity(bugId: string, severity: BugSeverity) {
    await updateSeverity({ bugId, severity } as any);
  }

  async function removeBug(bugId: string) {
    await deleteBug({ bugId } as any);
  }

  return { items: items ?? [], createBug, upvote, setStatus, setSeverity, removeBug };
}
