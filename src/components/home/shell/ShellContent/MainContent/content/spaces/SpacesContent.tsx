"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import UiButton from "@/components/ui/UiButton";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { useShellView } from "../../../viewContext";
import { themeVar } from "@/theme/registry";

import { Plus, Users, Shield, Zap, Layout } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ActionCard from "../_shared/ActionCard";
import CreateSpaceModal from "./components/CreateSpaceModal";
import JoinSpaceModal from "./components/JoinSpaceModal";

export default function SpacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setView, setSelectedSpaceId } = useShellView();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const ownedSpacesCount = useQuery(api.spaces.core.getUserOwnedSpacesCount) ?? 0;
  const userSpaces = useQuery(api.spaces.core.getUserSpaces);
  const maxFreeSpaces = 5;
  const isAtLimit = ownedSpacesCount >= maxFreeSpaces;

  const goToFeatureRequests = () => {
    setView("ecosystemHub");
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.set("ecoHubView", "features");
    const qs = sp.toString();
    router.replace(qs ? `/home?${qs}` : "/home");
  };

  const handleCreateSpace = () => {
    if (isAtLimit) return;
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (spaceId: string) => {
    // We'll update this to navigate to the new space once SpaceView is ready
    console.log("Space created with ID:", spaceId);
    setSelectedSpaceId(spaceId);
    setView("spaces");
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
    sp.set("view", "spaces");
    sp.set("spaceId", spaceId);
    router.replace(`/home?${sp.toString()}`);
  };

  const handleJoinSpace = () => {
    setIsJoinModalOpen(true);
  };

  return (
    <ContentTemplate
    >
      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: themeVar("textLight"),
              mb: 2,
              letterSpacing: "-0.02em",
              textShadow: `0 0 20px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
            }}
          >
            Your Space, Your World.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: themeVar("textSecondary"),
              maxWidth: 600,
              mx: "auto",
              fontSize: "1.1rem",
              lineHeight: 1.6,
            }}
          >
            Spaces are private, dedicated homes for your communities within the Ecosystem. Think of them as your own personal servers—built for gaming, projects, or just hanging out with friends.
          </Typography>
        </Box>

        {/* Action Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            mb: 8,
          }}
        >
          {/* Create Space Card */}
          <ActionCard
            title="Create a Space"
            description="Start your own community. Configure everything from permissions to custom themes."
            icon={<Plus />}
            colorKey="primary"
            disabled={isAtLimit}
            onClick={handleCreateSpace}
            extraContent={
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Shield size={16} style={{ color: themeVar("secondary") }} />
                  <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>
                    {ownedSpacesCount} / {maxFreeSpaces} Free Spaces Used
                  </Typography>
                </Box>
                {isAtLimit && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: `color-mix(in oklab, ${themeVar("warning")}, transparent 90%)`,
                      border: `1px solid ${themeVar("warning")}`,
                      color: themeVar("warning"),
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Limit Reached</Typography>
                  </Box>
                )}
              </Box>
            }
          />

          {/* Join Space Card */}
          <ActionCard
            title="Join a Space"
            description="Enter a join code or browse public spaces to find your next community."
            icon={<Users />}
            colorKey="secondary"
            onClick={handleJoinSpace}
            extraContent={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Zap size={16} style={{ color: themeVar("highlight") }} />
                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>
                  Instant Access via Code
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Your Spaces Section */}
        {userSpaces && userSpaces.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Users size={24} style={{ color: themeVar("primary") }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: themeVar("textLight") }}>
                Your Spaces
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
                gap: 3,
              }}
            >
              {userSpaces.map((space: any) => (
                <ActionCard
                  key={space._id}
                  title={space.name}
                  description={space.description || "No description set."}
                  icon={
                    space.avatarUrl ? (
                      <Avatar
                        src={space.avatarUrl}
                        variant="rounded"
                        sx={{ width: 56, height: 56, borderRadius: 2 }}
                      />
                    ) : (
                      <Layout size={20} />
                    )
                  }
                  backgroundImage={space.coverUrl}
                  colorKey="primary"
                  onClick={() => handleCreateSuccess(space._id)}
                  extraContent={
                    <Typography
                      variant="caption"
                      sx={{
                        color: space.coverUrl ? "white" : themeVar("textSecondary"),
                        fontWeight: 600,
                        opacity: 0.8
                      }}
                    >
                      {space.isPublic ? "Public Space" : "Private Space"}
                    </Typography>
                  }
                />
              ))}
            </Box>
          </Box>
        )}

        {userSpaces && userSpaces.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 4,
              border: `2px dashed ${themeVar("border")}`,
              mb: 8,
            }}
          >
            <Typography variant="h6" sx={{ color: themeVar("textSecondary"), mb: 1 }}>
              No spaces yet.
            </Typography>
            <Typography variant="body2" sx={{ color: themeVar("textSecondary") }}>
              Create your first space to get started!
            </Typography>
          </Box>
        )}
      </Box>

      <CreateSpaceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <JoinSpaceModal
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </ContentTemplate>
  );
}
