"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { dividerColor, chipNeutralSx } from "../general_overview/styles";
import { getRoleIconPath, RoleKey } from "../general_overview/utils";

export type RoleSummary = {
  key: RoleKey;
  roleLabel: string;
  champ: { name: string; img: string };
  win: number; // percentage
  kda: number; // ratio
  gpm: number; // gold per minute
  dpm: number; // damage per minute
};

export default function RoleCard({ role }: { role: RoleSummary }) {
  const roleIconSrc = getRoleIconPath(role.key);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        border: `1px solid ${dividerColor}`,
        backgroundColor: "var(--card)",
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          borderColor: 'color-mix(in oklab, var(--border), transparent 20%)',
          boxShadow: '0 0 0 3px color-mix(in oklab, var(--border), transparent 85%) inset',
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gridTemplateRows: 'auto auto auto',
          alignItems: 'center',
          columnGap: 1,
          rowGap: 0.5,
        }}
      >
        {/* Row 1: role label, champ image, champ name */}
        <Box sx={{ gridColumn: '1 / 2', gridRow: '1 / 2', justifySelf: 'start' }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>{role.roleLabel}</Typography>
        </Box>
        <Box sx={{ gridColumn: '2 / 3', gridRow: '1 / 2', position: 'relative', width: 44, height: 44, justifySelf: 'center' }}>
          <Box
            component="img"
            src={role.champ.img}
            alt={role.champ.name}
            sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1, border: `1px solid ${dividerColor}` }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'var(--background)',
              border: `1px solid ${dividerColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box component="img" src={roleIconSrc} alt={`${role.roleLabel} icon`} sx={{ width: 14, height: 14, opacity: 0.9 }} />
          </Box>
        </Box>
        <Box sx={{ gridColumn: '3 / 4', gridRow: '1 / 2', justifySelf: 'end', textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'var(--muted-foreground)' }}>{role.champ.name}</Typography>
        </Box>

        {/* Row 2: WR and KDA */}
        <Box sx={{ gridColumn: '1 / 2', gridRow: '2 / 3', justifySelf: 'start' }}>
          <Chip size="small" label={`${role.win}% WR`} sx={chipNeutralSx} />
        </Box>
        <Box sx={{ gridColumn: '3 / 4', gridRow: '2 / 3', justifySelf: 'end' }}>
          <Chip size="small" label={`${role.kda.toFixed(1)} KDA`} sx={chipNeutralSx} />
        </Box>

        {/* Row 3: GPM and DPM */}
        <Box sx={{ gridColumn: '1 / 2', gridRow: '3 / 4', justifySelf: 'start' }}>
          <Chip size="small" label={`${role.gpm} GPM`} sx={chipNeutralSx} />
        </Box>
        <Box sx={{ gridColumn: '3 / 4', gridRow: '3 / 4', justifySelf: 'end' }}>
          <Chip size="small" label={`${role.dpm} DPM`} sx={chipNeutralSx} />
        </Box>
      </Box>
    </Paper>
  );
}


