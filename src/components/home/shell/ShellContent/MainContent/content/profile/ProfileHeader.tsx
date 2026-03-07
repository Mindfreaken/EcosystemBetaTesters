"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import EditProfileModal from "./components/EditProfileModal";
import ProfileCardModal from "./components/ProfileCardModal";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import UiButton from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function ProfileHeader() {
  const [showEdit, setShowEdit] = React.useState(false);
  const [showCard, setShowCard] = React.useState(false);
  const me = useQuery(api.users.onboarding.queries.me, {});
  const overview = useQuery(
    api.users.profiles.functions.profileOverview.getProfile as any,
    { userId: (me as any)?._id || "" }
  );
  const coverUrl = me?.coverUrl || "/covers/default/default_001.png";
  const avatarUrl = me?.avatarUrl || "/avatars/default/default_001.jpg";
  const displayName = me?.displayName || "Unknown User";
  const status = me?.customStatus || "Unknown User";
  return (
    <Box sx={{ position: "relative", width: "100%", bgcolor: "transparent" }}>
      {/* Banner */}
      <Box
        sx={{
          height: 180,
          width: "100%",
          borderRadius: 0,
          overflow: "hidden",
          backgroundImage:
            `linear-gradient(120deg, rgba(255,64,96,0.25), rgba(255,166,0,0.15)), url('${coverUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid var(--border)",
        }}
      />

      {/* Avatar + Name row */}
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mt: -6, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            alt="User avatar"
            src={avatarUrl}
            sx={{ width: 96, height: 96, border: "3px solid var(--background)", boxShadow: `0 8px 24px rgba(0,0,0,.35)` }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--textLight)" }}>
              {displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--warning, #ff6b6b)" }}>
              {status}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <UiButton pill variant="primary" style={{ marginTop: 8 }} onClick={() => setShowEdit(true)}>
            Edit Profile
          </UiButton>
          <UiButton pill variant="outline" style={{ marginTop: 8 }} onClick={() => setShowCard(true)}>
            View profile card
          </UiButton>
        </Box>
      </Box>

      {/* Stats + Info row (skeleton layout for now) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, px: { xs: 2, sm: 3 }, mt: 2 }}>
        <MuiCard variant="interactive">
          <Typography variant="overline" sx={{ color: "var(--textSecondary)", letterSpacing: ".12em" }}>
            Bio
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--textPrimary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {me?.bio || "Hey there! I'm exploring this new platform."}
          </Typography>
        </MuiCard>
        <MuiCard variant="interactive">
          <Typography variant="overline" sx={{ color: "var(--textSecondary)", letterSpacing: ".12em" }}>
            Stats
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mt: 0.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)" }}>Followers</Typography>
              <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 800 }}>{(overview as any)?.stats?.followers ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)" }}>Following</Typography>
              <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 800 }}>{(overview as any)?.stats?.following ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)" }}>XP</Typography>
              <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 800 }}>{(me as any)?.xp ?? 0}</Typography>
            </Box>
          </Box>
        </MuiCard>
      </Box>

      <EditProfileModal show={showEdit} onClose={() => setShowEdit(false)} />
      <ProfileCardModal show={showCard} onClose={() => setShowCard(false)} />
    </Box>
  );
}

