"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import useMediaQuery from "@mui/material/useMediaQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const roles = [
  { key: "overview", label: "General Overview" },
  { key: "jungle", label: "Jungle" },
  { key: "top", label: "Top" },
  { key: "mid", label: "Mid" },
  { key: "bot", label: "Bot" },
  { key: "sup", label: "Support" },
  { key: "roles", label: "Roles Overview" },
] as const;

export type RoleTabKey = typeof roles[number]["key"];

export default function RoleTabs({ value, onChange }: { value?: RoleTabKey; onChange?: (val: RoleTabKey) => void }) {
  const isMdUp = useMediaQuery("(min-width:900px)");
  const [internal, setInternal] = React.useState<RoleTabKey>(value ?? "overview");
  const active = value ?? internal;
  const idx = Math.max(0, roles.findIndex((r) => r.key === active));
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const updateUrlRole = React.useCallback((next: RoleTabKey) => {
    const sp = new URLSearchParams(params?.toString());
    // Map overview/roles to removal of role param
    if (next === "overview" || next === "roles") {
      sp.delete("role");
    } else {
      sp.set("role", next);
    }
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [params, pathname, router]);

  // Keep tab selection in sync with URL
  React.useEffect(() => {
    const urlRole = (params?.get("role") || "overview").toLowerCase();
    const valid = roles.some((r) => r.key === urlRole);
    const next: RoleTabKey = valid ? (urlRole as RoleTabKey) : (urlRole === "roles" ? "roles" : "overview");
    if (next !== internal && !value) {
      setInternal(next);
    }
  }, [params, value, internal]);

  return (
    <Tabs
      value={idx}
      onChange={(_, i: number) => {
        const next = roles[i].key;
        setInternal(next);
        onChange?.(next);
        updateUrlRole(next);
      }}
      variant={isMdUp ? "standard" : "scrollable"}
      centered={isMdUp}
      scrollButtons={isMdUp ? false : "auto"}
      TabIndicatorProps={{
        sx: {
          height: 24, // reduced from 32 (~25%)
          borderRadius: 999,
          background:
            "linear-gradient(180deg, color-mix(in oklab, #ffffff, transparent 88%), color-mix(in oklab, var(--primaryLight), transparent 82%))",
          border: "1px solid color-mix(in oklab, var(--border), transparent 28%)",
          backdropFilter: "blur(6px) saturate(1.2)",
          zIndex: 0,
          top: "50%",
          bottom: "auto",
          transform: "translateY(-50%)",
          marginTop: 0,
          marginBottom: 0,
        },
      }}
      sx={{
        minHeight: 28, // reduced from 38 (~25%)
        maxWidth: { md: 1100 },
        mx: { md: "auto" },
        display: "flex",
        alignItems: "center",
        '.MuiTabs-flexContainer': { gap: 0.5 },
        mb: 0.25,
      }}
    >
      {roles.map((t) => (
        <Tab
          key={t.key}
          disableRipple
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: 11 }}>{t.label}</Box>
            </Box>
          }
          sx={{
            minHeight: 28, // reduced
            py: 0.25,
            px: 1,
            color: "color-mix(in oklab, var(--foreground), transparent 30%)",
            textTransform: "none",
            fontSize: 11,
            fontWeight: 700,
            position: "relative",
            zIndex: 1,
            transition: "color .2s ease",
            '&.Mui-selected': {
              color: "var(--textPrimary)",
              textShadow: "0 0 10px color-mix(in oklab, var(--highlight), transparent 60%)",
            },
            ':hover': {
              color: "var(--textPrimary)",
            },
            '&:not(.Mui-selected):hover::after': {
              content: "''",
              position: "absolute",
              left: 10,
              right: 10,
              bottom: 3,
              height: 2,
              borderRadius: 2,
              background: "linear-gradient(90deg, color-mix(in oklab, var(--primaryLight), transparent 30%), color-mix(in oklab, var(--secondaryLight), transparent 40%))",
              boxShadow: "0 0 10px color-mix(in oklab, var(--highlight), transparent 70%)",
            },
          }}
        />
      ))}
    </Tabs>
  );
}
