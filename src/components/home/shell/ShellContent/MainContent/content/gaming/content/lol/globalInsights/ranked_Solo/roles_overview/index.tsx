"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import RoleCard from "./RoleCard";
import HeaderIdentity from "../shared/HeaderIdentity";
import { cardSx, sectionLabelSx } from "../general_overview/styles";
import { ROLES_OVERVIEW_MOCK } from "../shared/rolesMock";

export default function RolesOverview() {
  // Shared mock roles data
  const roles = ROLES_OVERVIEW_MOCK;

  return (
    <Box sx={{ px: 0, py: 0, width: "100%" }}>
      {/* Shared identity header */}
      <HeaderIdentity region="na1" queue="RANKED_SOLO_5x5" />

      {/* Roles Overview Grid */}
      <Paper elevation={0} sx={{ ...cardSx, p: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>Roles Overview</Typography>
          <Typography variant="caption" sx={{ color: "var(--muted-foreground)" }}>
            Role performance snapshot (WR · KDA)
          </Typography>
        </Box>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            md: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 1,
        }}>
          {roles.map((r) => (
            <RoleCard key={r.key} role={r} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}


