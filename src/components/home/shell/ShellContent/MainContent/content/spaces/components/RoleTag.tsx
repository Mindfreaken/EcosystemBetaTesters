"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import "../styles/RoleEffects.css";

interface RoleTagProps {
    role: {
        name: string;
        color: string;
        style: string;
        gradientConfig?: {
            color1: string;
            color2: string;
            angle: number;
            isAnimated: boolean;
        };
    };
    showBackground?: boolean;
}

export default function RoleTag({ role, showBackground = true }: RoleTagProps) {
    const { name, color, style, gradientConfig } = role;

    const getStyle = () => {
        if (style === "gradient" && gradientConfig) {
            const { color1, color2, angle, isAnimated } = gradientConfig;
            const gradient = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
            
            return {
                background: showBackground ? `color-mix(in oklab, ${color1} 10%, var(--card))` : "transparent",
                border: showBackground ? `1px solid color-mix(in oklab, ${color1} 20%, transparent)` : "none",
                color: "var(--foreground)",
                ...(isAnimated ? {
                    backgroundImage: gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% 200%",
                } : {
                    color: color1, // Simplified
                })
            };
        }

        // Solid
        return {
            background: showBackground ? `color-mix(in oklab, ${color} 12%, var(--card))` : "transparent",
            border: showBackground ? `1px solid color-mix(in oklab, ${color} 25%, transparent)` : "none",
            color: color,
        };
    };

    const containerStyle = getStyle();

    return (
        <Box
            className={`role-tag ${style === "gradient" && gradientConfig?.isAnimated ? "vibrant-gradient-text" : ""}`}
            data-text={name}
            sx={{
                ...containerStyle,
                px: 0.75,
                py: 0.25,
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                ...(style === "gradient" && gradientConfig?.isAnimated ? {
                    backgroundImage: `linear-gradient(${gradientConfig.angle}deg, ${gradientConfig.color1}, ${gradientConfig.color2}, ${gradientConfig.color1}, ${gradientConfig.color2}, ${gradientConfig.color1})`,
                    backgroundSize: "300% auto",
                } : {})
            }}
        >
            <Typography variant="caption" sx={{ fontWeight: "inherit", fontSize: "inherit", color: "inherit", WebkitBackgroundClip: "inherit", WebkitTextFillColor: "inherit" }}>
                {name}
            </Typography>
        </Box>
    );
}
