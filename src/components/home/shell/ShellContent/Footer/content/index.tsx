"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import { useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import GlowPilledButton from "@/components/ui/GlowPilledButton";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import LogoutIcon from "@mui/icons-material/Logout";
import { useShellView } from "../../viewContext";

// Keep this file focused on the FOOTER CONTENT ONLY (no shell styling)
// The Shell footer wrapper (background/border/padding) lives in Footer/index.tsx
export default function FooterContent() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { setView } = useShellView();

  const btnStyle: React.CSSProperties = {
    // Match header button styling
    backgroundColor: "rgba(0,0,0,0.2)",
    color: "inherit",
    outline: "none",
    position: "relative",
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      {/* Left: Personal */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GlowPilledButton
          onClick={() => setView("profile")}
          icon={<AccountCircleIcon fontSize="small" />}
          label="Profile"
          style={btnStyle}
        />





        {/* Notes */}
        <GlowPilledButton
          onClick={() => setView("notes")}
          icon={<DescriptionIcon fontSize="small" />}
          label="Notes"
          style={btnStyle}
        />
      </Box>

      {/* Center: Support */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}></Box>

      {/* Right: Session/Settings */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <GlowPilledButton
          onClick={() => setView("settings")}
          icon={<SettingsIcon fontSize="small" />}
          label="Settings"
          style={btnStyle}
        />

        {/* Logout */}
        <GlowPilledButton
          onClick={() => signOut({ redirectUrl: "/" })}
          icon={<LogoutIcon fontSize="small" />}
          label="Logout"
          style={btnStyle}
        />
      </Box>
    </Box>
  );
}



