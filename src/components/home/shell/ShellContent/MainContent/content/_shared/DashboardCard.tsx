import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";

interface DashboardCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    colorKey?: "primary" | "secondary" | "chart3" | "chart4";
    action?: React.ReactNode;
    subtitle?: string;
}

export default function DashboardCard({
    title,
    icon,
    children,
    colorKey = "primary",
    action,
    subtitle
}: DashboardCardProps) {
    const themeColor = themeVar(colorKey);

    return (
        <Box
            sx={{
                position: "relative",
                p: 3,
                borderRadius: "9px",
                background: `linear-gradient(135deg, color-mix(in oklab, ${themeColor}, transparent 94%), color-mix(in oklab, ${themeVar("background")}, transparent 20%))`,
                backdropFilter: "blur(12px)",
                border: `1px solid color-mix(in oklab, ${themeColor}, transparent 80%)`,
                transition: "all 0.3s ease",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: `0 4px 20px -10px color-mix(in oklab, ${themeColor}, transparent 90%)`,
                "&:hover": {
                    borderColor: themeColor,
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 30px -12px color-mix(in oklab, ${themeColor}, transparent 80%)`,
                }
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {icon && (
                        <Box sx={{ color: themeColor, display: "flex", alignItems: "center" }}>
                            {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 20 }) : icon}
                        </Box>
                    )}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                color: themeVar("foreground"),
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                fontSize: "0.75rem",
                                opacity: 0.9
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: themeVar("mutedForeground"),
                                    fontSize: "0.7rem",
                                    display: "block",
                                    mt: -0.5
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {action && (
                    <Box sx={{ flexShrink: 0 }}>
                        {action}
                    </Box>
                )}
            </Box>

            <Box sx={{ flex: 1 }}>
                {children}
            </Box>
        </Box>
    );
}
