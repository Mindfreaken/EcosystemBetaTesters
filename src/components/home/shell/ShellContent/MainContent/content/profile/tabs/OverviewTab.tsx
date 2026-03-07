"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function OverviewTab() {
  return (
    <Box sx={{ textAlign: "center", color: "var(--textSecondary)", py: 6 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--textLight)", mb: 0.5 }}>
        Overview functionality coming soon
      </Typography>
      <Typography variant="body2">
        This section will display your spaces and activity highlights
      </Typography>
    </Box>
  );
}
