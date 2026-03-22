import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorKey: "primary" | "secondary" | "chart3" | "chart4";
    onClick?: () => void;
    extraContent?: React.ReactNode;
    disabled?: boolean;
    backgroundImage?: string;
}

export default function ActionCard({
    title,
    description,
    icon,
    colorKey,
    onClick,
    extraContent,
    disabled,
    backgroundImage
}: ActionCardProps) {
    const themeColor = themeVar(colorKey);

    return (
        <Box
            onClick={!disabled ? onClick : undefined}
            tabIndex={!disabled ? 0 : -1}
            onKeyDown={!disabled ? (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onClick?.();
                }
            } : undefined}
            sx={{
                position: "relative",
                p: 3,
                borderRadius: 4,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: backgroundImage
                    ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${backgroundImage})`
                    : `linear-gradient(135deg, color-mix(in oklab, ${themeColor}, transparent 92%), color-mix(in oklab, ${themeVar("background")}, transparent 50%))`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: `1px solid color-mix(in oklab, ${themeColor}, transparent 80%)`,
                overflow: "hidden",
                opacity: disabled ? 0.6 : 1,
                display: "flex",
                flexDirection: "column",
                "&:hover": !disabled ? {
                    transform: "translateY(-4px)",
                    borderColor: themeColor,
                    boxShadow: `0 12px 24px -8px color-mix(in oklab, ${themeColor}, transparent 85%)`,
                    "& .icon-glow": { opacity: backgroundImage ? 0.4 : 0.8 },
                } : {},
            }}
        >
            <Box
                className="icon-glow"
                sx={{
                    position: "absolute",
                    top: -15,
                    right: -15,
                    width: 80,
                    height: 80,
                    background: themeColor,
                    filter: "blur(40px)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                }}
            />

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.5, mb: 2 }}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        background: `color-mix(in oklab, ${themeColor}, transparent 85%)`,
                        color: themeColor,
                        flexShrink: 0,
                    }}
                >
                    {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 28 }) : icon}
                </Box>
                <Box sx={{ flex: 1, pt: 0.5 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            mb: 0.5,
                            color: themeVar("foreground"),
                            fontSize: "1.1rem",
                            lineHeight: 1.2,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: themeVar("mutedForeground"),
                            fontSize: "0.85rem",
                            lineHeight: 1.4,
                            opacity: 0.9,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                        }}
                    >
                        {description}
                    </Typography>
                </Box>
            </Box>

            {extraContent && (
                <Box sx={{ mt: "auto" }}>
                    {extraContent}
                </Box>
            )}
        </Box>
    );
}


