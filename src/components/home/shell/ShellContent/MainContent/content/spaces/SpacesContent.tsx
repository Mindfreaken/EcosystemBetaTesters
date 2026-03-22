"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import UiButton from "@/components/ui/UiButton";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { useShellView } from "../../../viewContext";
import { themeVar } from "@/theme/registry";

import { Plus, Users, Shield, Zap, Layout } from "lucide-react";
import { useQuery, useAction } from "convex/react";
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
  const [isUpgrading, setIsUpgrading] = useState(false);

  const createCheckoutSession = useAction(api.billing.createCheckoutSession);

  const ownedSpacesData = useQuery(api.spaces.core.getUserOwnedSpacesCount) ?? { count: 0, max: 5 };
  const { count: ownedSpacesCount, max: maxSpaces } = ownedSpacesData;
  const userSpaces = useQuery(api.spaces.core.getUserSpaces);
  const isAtLimit = ownedSpacesCount >= maxSpaces;
  const isPaidTier = maxSpaces > 5;


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

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const { url } = await createCheckoutSession({});
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      // Note: User will need to set STRIPE_SECRET_KEY in Convex dashboard
    } finally {
      setIsUpgrading(false);
    }
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
              color: themeVar("foreground"),
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
              color: themeVar("mutedForeground"),
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
                  <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 600 }}>
                    {ownedSpacesCount} / {maxSpaces} Spaces Used
                  </Typography>
                </Box>
                {isPaidTier ? (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    icon={<Zap size={14} />}
                    label="Expanded Spaces Active"
                    sx={{ fontWeight: "bold" }}
                  />
                ) : (
                  <UiButton
                    variant={isAtLimit ? "primary" : "outline"}
                    size="sm"
                    pill
                    loading={isUpgrading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade();
                    }}
                    startIcon={<Zap size={14} />}
                  >
                    {isAtLimit ? "Add More Spaces" : "Upgrade Plan"}
                  </UiButton>
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
                <Zap size={16} style={{ color: themeVar("chart3") }} />
                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 600 }}>
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
              <Typography variant="h5" sx={{ fontWeight: 800, color: themeVar("foreground") }}>
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
                        color: space.coverUrl ? "white" : themeVar("mutedForeground"),
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
            <Typography variant="h6" sx={{ color: themeVar("mutedForeground"), mb: 1 }}>
              No spaces yet.
            </Typography>
            <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
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


