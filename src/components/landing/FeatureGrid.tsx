"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./styles/Home.css";

const FeatureGrid: React.FC = () => {
  // Note: we no longer need the complex `useMemo` for colors. 
  // We use CSS variables directly so it stays in sync with ThemeProvider,
  // and prevents Opera GX from "force dark mode" overriding JS inline hexes.

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
              backgroundColor: `color-mix(in oklab, var(--card), transparent 40%)`,
              borderWidth: "1px",
              borderColor: `color-mix(in oklab, var(--border), transparent 40%)`,
              boxShadow: `0 8px 32px rgba(var(--shadow), 0.3)`,
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-3 sm:mb-5 p-3 sm:p-4 rounded-full border-2 icon-glow"
                style={{
                  borderColor: 'var(--primary)',
                  backgroundColor: `color-mix(in oklab, var(--background), transparent 20%)`,
                  boxShadow: `0 0 15px color-mix(in oklab, var(--primary), transparent 20%)`,
                }}
              >
                <div style={{ color: 'var(--primary)' }}>{renderIcon(feature.icon)}</div>
              </div>

              <h3
                className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-glow"
                style={{
                  color: 'var(--foreground)',
                  textShadow: `0 0 5px color-mix(in oklab, var(--primary), transparent 20%)`,
                }}
              >
                {feature.title}
              </h3>

              <p className="text-sm sm:text-base" style={{ color: 'var(--muted-foreground)' }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div >
  );
};

export default FeatureGrid;


