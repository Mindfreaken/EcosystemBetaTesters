"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./styles/Home.css";

const FeatureGrid: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colors = useMemo(() => {
    const defaults = {
      background: "#0a0a0a",
      backgroundDark: "#000000",
      text: "#eaeaea",
      textSecondary: "#9ca3af",
      primary: "#6c47ff",
      secondary: "#ff2d55",
      card: "#111111",
      border: "#2a2a2a",
      shadow: "0,0,0",
    } as const;

    if (!mounted) return defaults;

    const css = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => css.getPropertyValue(name)?.trim() || fallback;
    // Note: --shadow should be rgb triplet like "0,0,0" if defined; fallback to black
    return {
      background: get("--background", defaults.background),
      backgroundDark: get("--background-dark", defaults.backgroundDark),
      text: get("--text", defaults.text),
      textSecondary: get("--text-secondary", defaults.textSecondary),
      primary: get("--primary", defaults.primary),
      secondary: get("--secondary", defaults.secondary),
      card: get("--card", defaults.card),
      border: get("--border", defaults.border),
      shadow: get("--shadow-rgb", defaults.shadow),
    };
  }, [mounted]);

  const features = [
    {
      id: 1,
      title: "Community Building",
      description:
        "Create and nurture engaged communities with powerful moderation tools and insights.",
      icon: "community",
    },
    {
      id: 2,
      title: "Resource Sharing",
      description:
        "Share resources efficiently with smart recommendations and collaborative tools.",
      icon: "resource",
    },
    {
      id: 3,
      title: "Sustainable Growth",
      description:
        "Set goals and track community growth with detailed analytics and achievements.",
      icon: "goal",
    },
  ];

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "community":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "resource":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case "goal":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        );
    }
  };

  return (
    <div className="flex justify-center items-center w-full px-4">
      <div className="w-full max-w-6xl px-4 feature-grid-container">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="feature-card p-4 sm:p-6 rounded-xl transition-all duration-300 hover:transform hover:scale-105 backdrop-blur-md hover:shadow-neon"
            style={{
              backgroundColor: `${colors.card}60`,
              borderWidth: "1px",
              borderColor: `${colors.border}60`,
              boxShadow: `0 8px 32px ${colors.shadow}30`,
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-full border-2 icon-glow"
                style={{
                  borderColor: colors.primary,
                  backgroundColor: `${colors.backgroundDark}80`,
                  boxShadow: `0 0 15px ${colors.primary}80`,
                }}
              >
                <div style={{ color: colors.primary }}>{renderIcon(feature.icon)}</div>
              </div>

              <h3
                className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-glow"
                style={{
                  color: colors.text,
                  textShadow: `0 0 5px ${colors.primary}80`,
                }}
              >
                {feature.title}
              </h3>

              <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureGrid;
