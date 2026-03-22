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

export interface ProfileCardModalProps {
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
    joinNumber?: number | string;
    projectsCount?: number;
    xp?: number;
  };
  children?: React.ReactNode;
}

function formatCompact(n: number | undefined | null): string {
  if (!n || n <= 0) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
}

export default function ProfileCardModal({ show, onClose, userId, prefill, children }: ProfileCardModalProps) {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const effectiveUserId = (userId as any) || (me as any)?._id || "";
  const isSelf = !userId || ((me as any)?._id && String((me as any)?._id) === String(userId));
  const overview = useQuery(
    // Use profile overview to get authoritative follower count
    api.users.profiles.functions.profileOverview.getProfile as any,
    { userId: effectiveUserId }
  );

  const ovProfile = (overview as any)?.profile ?? {};
  const displayName = prefill?.displayName
    ?? ovProfile.displayName
    ?? (isSelf ? me?.displayName : undefined)
    ?? "Unknown User";
  const title = prefill?.customStatus
    ?? ovProfile.customStatus
    ?? (isSelf ? me?.customStatus : undefined)
    ?? "Unknown User";
  const coverUrl = prefill?.coverUrl
    ?? ovProfile.coverUrl
    ?? (isSelf ? me?.coverUrl : undefined)
    ?? "/covers/default/default_001.png";
  const avatarUrl = prefill?.avatarUrl
    ?? ovProfile.avatarUrl
    ?? (isSelf ? me?.avatarUrl : undefined)
    ?? "/avatars/default/default_001.jpg";
  // Followers from profile overview (falls back to 0)
  const followers = formatCompact((overview as any)?.stats?.followers ?? 0);
  const projects = formatCompact(
    prefill?.projectsCount
      ?? ovProfile.projectsCount
      ?? (isSelf ? (me as any)?.projectsCount : undefined)
      ?? 0
  );
  const about = prefill?.bio
    ?? ovProfile.bio
    ?? (isSelf ? me?.bio : undefined)
    ?? "Hey there! I'm exploring this new platform.";
  const rawTier = (
    prefill?.tier
      ?? ovProfile.tier
      ?? (isSelf ? (me as any)?.tier : undefined)
      ?? "starter"
  ) as string;
  const allowedTiers = new Set(["starter", "common", "rare", "epic", "legendary"]);
  const tier: "starter" | "common" | "rare" | "epic" | "legendary" =
    (allowedTiers.has(rawTier) ? rawTier : "starter") as any;
  const footerLabel = "Join number";
  const footerBadge = (() => {
    const raw =
      // prefer overview values for the effective user if present
      ovProfile?.joinNumber
      ?? ovProfile?.join_no
      ?? ovProfile?.joinNo
      ?? ovProfile?.memberNo
      ?? prefill?.joinNumber
      ?? (isSelf ? (me as any)?.joinNumber : undefined)
      ?? (isSelf ? (me as any)?.join_no : undefined)
      ?? (isSelf ? (me as any)?.joinNo : undefined)
      ?? (isSelf ? (me as any)?.memberNo : undefined)
      ?? 1;
    const str = String(raw).replace(/^0+/, "");
    return str.length ? str : "0";
  })();

  return (
    <Dialog open={show} onClose={onClose} maxWidth={false} PaperProps={{ sx: { background: "transparent", boxShadow: "none" } }}>
      <DialogContent sx={{ position: "relative", p: 2, bgcolor: "transparent" }}>
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
        <Box sx={{ display: "grid", placeItems: "center", p: { xs: 0, sm: 1 } }}>
          <ProfileCardSVG
            tier={tier}
            coverUrl={coverUrl}
            avatarUrl={avatarUrl}
            displayName={displayName}
            title={title}
            followers={followers}
            projects={projects}
            about={about}
            footerLabel={footerLabel}
            footerBadge={footerBadge}
          />
        </Box>
        {children && (
          <Box sx={{ mt: 2, px: 2, pb: 2 }}>
            {children}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}


