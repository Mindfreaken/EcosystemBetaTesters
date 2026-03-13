import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useShellView } from "../../../viewContext";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";
import DashboardCard from "../_shared/DashboardCard";
import { Users, Layout, Puzzle, ArrowRight, Shield, Pickaxe } from "lucide-react";
import { Button, Avatar, Chip, Stack } from "@mui/material";

export default function HomeContent() {
  const router = useRouter();
  const { setView, setSelectedSpaceId, setSelectedDailyId, setNerdleVariant } = useShellView();
  const user = useQuery(api.spaces.core.getMe);
  const spaces = useQuery(api.spaces.core.getUserSpaces) ?? [];

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  const valorantNerdle = useQuery(api.dailies.nerdle.current.getByDate, { game: "valorant", date: todayStr });
  const minecraftNerdle = useQuery(api.dailies.nerdle.current.getByDate, { game: "minecraft", date: todayStr });

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
        borderRadius: 0,
        bgcolor: "transparent",
        p: { xs: 2, sm: 4, md: 6 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Neon grid overlay */}
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            `linear-gradient(${themeVar("border")} 1px, transparent 1px), linear-gradient(90deg, ${themeVar("border")} 1px, transparent 1px)`,
          backgroundSize: "32px 32px, 32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          borderRadius: "inherit",
          zIndex: 0
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1200, mx: "auto", width: "100%" }}>
        {/* Header Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              lineHeight: 1,
              textShadow: `0 0 24px color-mix(in oklab, ${themeVar("primary")}, transparent 60%)`,
              color: themeVar("foreground"),
              letterSpacing: "-0.04em"
            }}
          >
            Welcome back, <Box component="span" sx={{ color: themeVar("primary") }}>{user?.displayName || "Agent"}</Box>
          </Typography>
        </Box>

        {/* Dashboard Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
            gap: 3,
            mb: 6
          }}
        >
          {/* Spaces Widget */}
          <Box sx={{ gridColumn: { lg: "span 8" } }}>
            <DashboardCard
              title="Recent Spaces"
              subtitle={`${spaces.length} active memberships`}
              icon={<Users />}
              colorKey="primary"
              action={
                <Button
                  size="small"
                  onClick={() => setView("spaces")}
                  sx={{ color: themeVar("primary"), fontWeight: 800 }}
                >
                  View All
                </Button>
              }
            >
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {spaces.slice(0, 4).map((space: any) => (
                  <Box
                    key={space._id}
                    onClick={() => {
                      setSelectedSpaceId(space._id);
                      setView("spaces");
                    }}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 97%)`,
                      border: `1px solid ${themeVar("border")}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      "&:hover": {
                        bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 94%)`,
                        borderColor: themeVar("primary"),
                        transform: "translateX(4px)"
                      }
                    }}
                  >
                    <Avatar
                      src={space.avatarUrl}
                      variant="rounded"
                      sx={{ width: 44, height: 44, border: `1px solid ${themeVar("border")}` }}
                    >
                      {space.name[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("foreground"), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {space.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {space.description || "No description set"}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {spaces.length === 0 && (
                  <Box sx={{ gridColumn: "span 2", py: 4, textAlign: "center", opacity: 0.5 }}>
                    <Typography variant="body2">You haven't joined any spaces yet.</Typography>
                    <Button
                      variant="text"
                      size="small"
                      sx={{ mt: 1, fontWeight: 800 }}
                      onClick={() => setView("spaces")}
                    >
                      Browse Spaces
                    </Button>
                  </Box>
                )}
              </Box>
            </DashboardCard>
          </Box>

          {/* Dailies Snapshot */}
          <Box sx={{ gridColumn: { lg: "span 4" } }}>
            <DashboardCard
              title="Daily Challenges"
              icon={<Puzzle />}
              colorKey="chart3"
              action={
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedDailyId("nerdle");
                    setView("dailies");
                  }}
                  sx={{ color: themeVar("chart3"), fontWeight: 800 }}
                >
                  Play
                </Button>
              }
            >
              <Stack spacing={2}>
                <Box
                  onClick={() => {
                    setSelectedDailyId("nerdle");
                    setNerdleVariant("valorant");
                    setView("dailies");
                  }}
                  sx={{
                    p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("chart3")}, transparent 92%)`,
                    border: `1px solid color-mix(in oklab, ${themeVar("chart3")}, transparent 75%)`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: themeVar("chart3"), bgcolor: `color-mix(in oklab, ${themeVar("chart3")}, transparent 92%)` }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Shield size={18} style={{ color: themeVar("primary") }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("foreground") }}>Valorant Nerdle</Typography>
                    <Chip label="LIVE" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, bgcolor: themeVar("primary"), color: 'white' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
                    Current Mystery: <Box component="span" sx={{ color: themeVar("foreground"), fontWeight: 800 }}>{valorantNerdle ? "Ready" : "Loading..."}</Box>
                  </Typography>
                </Box>

                <Box
                  onClick={() => {
                    setSelectedDailyId("nerdle");
                    setNerdleVariant("minecraft");
                    setView("dailies");
                  }}
                  sx={{
                    p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 92%)`,
                    border: `1px solid color-mix(in oklab, ${themeVar("secondary")}, transparent 75%)`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: themeVar("secondary"), bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 92%)` }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Pickaxe size={18} style={{ color: themeVar("secondary") }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("foreground") }}>Minecraft Nerdle</Typography>
                    <Chip label="LIVE" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, bgcolor: themeVar("secondary"), color: 'white' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
                    Current Mystery: <Box component="span" sx={{ color: themeVar("foreground"), fontWeight: 800 }}>{minecraftNerdle ? "Ready" : "Loading..."}</Box>
                  </Typography>
                </Box>
              </Stack>
            </DashboardCard>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
