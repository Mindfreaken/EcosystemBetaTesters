"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ProfileCardSVG from "./ProfileCardSVG";
import type { Id } from "convex/_generated/dataModel";

export interface ProfileCollectionsModalProps {
  show: boolean;
  onClose: () => void;
  userId?: Id<"users"> | string;
  prefill?: {
    displayName?: string;
    customStatus?: string;
    coverUrl?: string;
    avatarUrl?: string;
    bio?: string;
    tier?: "starter" | "common" | "rare" | "epic" | "legendary" | string;
    projectsCount?: number;
    xp?: number;
    joinNumber?: number | string;
  };
}

function formatCompact(n: number | undefined | null): string {
  if (!n || n <= 0) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
}

export default function ProfileCollectionsModal({ show, onClose, userId, prefill }: ProfileCollectionsModalProps) {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const effectiveUserId = (userId as any) || (me as any)?._id || "";
  const isSelf = !userId || ((me as any)?._id && String((me as any)?._id) === String(userId));
  const overview = useQuery(
    api.users.profiles.functions.profileOverview.getProfile as any,
    { userId: effectiveUserId }
  );

  const ovProfile = (overview as any)?.profile ?? {};
  const displayName = prefill?.displayName ?? ovProfile.displayName ?? (isSelf ? me?.displayName : undefined) ?? "Unknown User";
  const title = prefill?.customStatus ?? ovProfile.customStatus ?? (isSelf ? me?.customStatus : undefined) ?? "Unknown User";
  const baseCoverUrl = prefill?.coverUrl ?? ovProfile.coverUrl ?? (isSelf ? me?.coverUrl : undefined) ?? "/covers/default/default_001.png";
  const avatarUrl = prefill?.avatarUrl ?? ovProfile.avatarUrl ?? (isSelf ? me?.avatarUrl : undefined) ?? "/avatars/default/default_001.jpg";
  const followers = formatCompact((overview as any)?.stats?.followers ?? 0);
  const projects = formatCompact(prefill?.projectsCount ?? ovProfile.projectsCount ?? (isSelf ? (me as any)?.projectsCount : undefined) ?? 0);
  const xp = formatCompact(prefill?.xp ?? ovProfile.xp ?? (isSelf ? (me as any)?.xp : undefined) ?? 10);
  const about = prefill?.bio ?? ovProfile.bio ?? (isSelf ? me?.bio : undefined) ?? "Hey there! I'm exploring this new platform.";

  const rawTier = (prefill?.tier ?? ovProfile.tier ?? (isSelf ? (me as any)?.tier : undefined) ?? "starter") as string;
  const allowedTiers = new Set(["starter", "common", "rare", "epic", "legendary"]);
  const currentTier: "starter" | "common" | "rare" | "epic" | "legendary" =
    (allowedTiers.has(rawTier) ? rawTier : "starter") as any;

  const variants = [
    // Slot 1: player's current profile card
    { tier: currentTier, coverUrl: baseCoverUrl },
  ] as const;

  const count = variants.length;
  const cols = Math.min(count, 3);

  return (
    <Dialog
      open={show}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { background: "transparent", boxShadow: "none", display: "grid", placeItems: "center" } }}
    >
      <DialogContent sx={{ position: "relative", p: 2, display: "grid", placeItems: "center" }}>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "var(--textLight)",
            backgroundColor: "rgba(0,0,0,0.3)",
            ":hover": { backgroundColor: "rgba(0,0,0,0.5)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Box>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {variants.map((v, idx) => (
              <Box key={idx} sx={{ display: "grid", placeItems: "center" }}>
                <ProfileCardSVG
                  tier={v.tier as any}
                  coverUrl={v.coverUrl}
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  title={title}
                  followers={followers}
                  projects={projects}
                  xp={xp}
                  about={about}
                  footerLabel={"Join number"}
                  footerBadge={String((me as any)?.joinNumber ?? 1)}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
