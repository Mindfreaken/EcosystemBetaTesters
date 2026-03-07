"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { MuiCard } from "@/components/ui/MuiCard";

export default function ActivityTab() {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const profile = useQuery(
    api.users.profiles.functions.profileOverview.getProfile as any,
    me?._id ? ({ userId: me._id } as any) : ("skip" as any)
  ) as any;

  if (!me) {
    return (
      <Box sx={{ textAlign: "center", color: "var(--textSecondary)", py: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--textLight)", mb: 0.5 }}>
          Activity
        </Typography>
        <Typography variant="body2">Loading your recent activity…</Typography>
      </Box>
    );
  }

  const recentRaw = profile?.recentActivity ?? [];
  // Exclude punishments from showing in user-facing activity
  const recent = React.useMemo(() => {
    const isPunishment = (e: any) => {
      const t = String(e?.type || "").toLowerCase();
      const title = String(e?.title || "").toLowerCase();
      return t.includes("punishment") || title.includes("punishment");
    };
    return recentRaw.filter((e: any) => !isPunishment(e));
  }, [recentRaw]);

  return (
    <Box sx={{ color: "var(--textSecondary)", py: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--textLight)", mb: 1 }}>
        Activity
      </Typography>

      {recent.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="body2">No recent activity.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {recent.map((e: any) => (
            <MuiCard key={(e._id || e.id) as string} variant="interactive" size="sm">
              <Typography variant="subtitle2" sx={{ color: "var(--textLight)", fontWeight: 700 }}>
                {e.title || e.type}
              </Typography>
              {e.description ? (
                <Typography variant="caption" sx={{ color: "var(--textSecondary)", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                  {e.description}
                </Typography>
              ) : null}
              <Typography
                variant="caption"
                sx={{ color: "var(--textSecondary)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}
              >
                {new Date(e.timestamp).toLocaleString()}
              </Typography>
            </MuiCard>
          ))}
        </Box>
      )}
    </Box>
  );
}
