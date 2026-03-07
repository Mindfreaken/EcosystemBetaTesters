"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../../_shared/ContentTemplate";
import { FlaskConical, RefreshCcw } from "lucide-react";
import BetaComposer from "./components/BetaComposer";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { UiIconButton } from "@/components/ui/UiIconButton";
import { UiButton } from "@/components/ui/UiButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useSearchParams } from "next/navigation";
import { MuiCard } from "@/components/ui/MuiCard";

type BetaPost = { _id: any; userId: any; content: string; topic?: string | null; createdAt: number; author?: { displayName: string; username: string } | null };

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const href = url.startsWith('http') ? url : `https://${url}`;
    parts.push(
      <a
        key={`${start}-${href}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        {url}
      </a>
    );
    lastIndex = start + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function BetasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = useQuery(api.users.onboarding.queries.me, {});
  const canCompose = Boolean((me as any)?.ecosystemdevs);
  const posts = useQuery(api.community.betas.posts.list, {}) as BetaPost[] | undefined;
  const createPost = useMutation(api.community.betas.posts.create);
  const removePost = useMutation(api.community.betas.posts.remove);

  const handlePost = async (p: { content: string; topic: string }) => {
    try {
      await createPost({ content: p.content, topic: p.topic || undefined });
    } catch (e) {
      console.error("Failed to create beta post", e);
    }
  };

  return (
    <ContentTemplate
      title="Join Betas"
      subtitle="Opt into experimental features early."
      maxWidth={"md"}
      gutterX={{ xs: 1, sm: 2, md: 3 }}
      gutterY={{ xs: 1, sm: 2, md: 3 }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <UiButton size="sm" variant="outline" startIcon={<ArrowBackIcon fontSize="small" />} onClick={() => {
          const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
          sp.delete("ecoHubView");
          const qs = sp.toString();
          router.replace(qs ? `/home?${qs}` : "/home");
        }}>
          Back to Hub
        </UiButton>
      </Box>
      {/* Composer (WIP – local only) */}
      {canCompose && (
        <Box sx={{ mb: 2 }}>
          <MuiCard variant="interactive">
            <BetaComposer onPost={handlePost} />
          </MuiCard>
        </Box>
      )}

      {/* Feed */}
      {(posts?.length ?? 0) === 0 ? (
        <MuiCard variant="interactive">
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              p: 4,
              borderRadius: 2,
              background: "linear-gradient(180deg, color-mix(in oklab, var(--primary), transparent 92%) 0%, transparent 100%)",
              border: "1px dashed color-mix(in oklab, var(--foreground), transparent 88%)",
              boxShadow: "0 10px 28px color-mix(in oklab, var(--foreground) 12%, transparent)",
            }}
          >
            <Box sx={{ color: "var(--textSecondary)", mb: 1, display: "grid", placeItems: "center" }}>
              <FlaskConical size={32} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--textLight)", mb: 0.5 }}>
              No betas available right now
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--textSecondary)", mb: 2 }}>
              Post updates here as they go live. This feed is local-only for now.
            </Typography>
          </Box>
        </MuiCard>
      ) : (
        <Box sx={{ display: "grid", gap: 1 }}>
          {(posts ?? []).map((p) => (
            <MuiCard key={String(p._id)} variant="interactive">
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, justifyContent: "space-between" }}>
                <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 700 }}>
                  {p.topic || "Beta update"}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "var(--textSecondary)" }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </Typography>
                  {me?._id && p.userId === (me as any)._id && (
                    <UiIconButton
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try { await removePost({ postId: p._id }); } catch (e) { console.error("Failed to delete post", e); }
                      }}
                      className="text-[color:var(--textSecondary)]"
                      aria-label="Delete beta post"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </UiIconButton>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "var(--textPrimary)", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                {linkify(p.content)}
              </Typography>
            </MuiCard>
          ))}
        </Box>
      )}
    </ContentTemplate>
  );
}
