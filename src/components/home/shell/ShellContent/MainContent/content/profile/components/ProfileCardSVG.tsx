"use client";

import React from "react";

export interface ProfileCardProps {
  tier: "starter" | "common" | "rare" | "epic" | "legendary" | "mythic";
  coverUrl: string;
  avatarUrl: string;
  displayName: string;
  title: string;
  followers: string;   // format strings (e.g., "12.4k")
  projects: string;
  xp: string;
  about: string;
  footerLabel: string;
  footerBadge: string;
}

export default function ProfileCardSVG({
  tier,
  coverUrl,
  avatarUrl,
  displayName,
  title,
  followers,
  projects,
  xp,
  about,
  footerLabel,
  footerBadge,
}: ProfileCardProps) {
  // Dynamically size the footer badge to fit the content
  const badgePaddingX = 8; // px
  const approxCharWidth = 7.5; // px (monospace-like for the chip font)
  const badgeWidth = Math.max(40, Math.ceil((footerBadge?.length || 1) * approxCharWidth + badgePaddingX * 2));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="400"
      height="600"
      viewBox="0 0 400 600"
      data-tier={tier}
      style={{ ["--card-bg" as any]: "#0b0f1a", ["--text" as any]: "#e8ecf1", ["--muted" as any]: "#a6b0c3" }}
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="card-clip">
          <rect x="20" y="20" width="360" height="560" rx="24" ry="24" />
        </clipPath>
        <linearGradient id="cover-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id="avatar-clip">
          <circle cx="200" cy="170" r="60" />
        </clipPath>
      </defs>

      {/* styles identical to SVG file */}
      <style>{`
        svg { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        .bg { fill: var(--card-bg); }
        .border { fill: none; stroke: var(--border); stroke-width: 3; }
        .border-glow { fill: none; stroke: var(--glow); stroke-width: 4; opacity: .12; filter: url(#glow); }
        .divider { stroke: rgba(255,255,255,.08); stroke-width: 1; }

        .chip { fill: var(--accent); fill-opacity: .12; stroke: var(--accent); stroke-width: 1; }
        .chip-back { fill: rgba(0,0,0,.55); stroke: var(--accent); stroke-width: 1.5; }
        .chip-neon { fill: none; stroke: var(--glow); stroke-width: 6; opacity: .28; filter: url(#glow); }
        .chip-text { font-size: 12px; font-weight: 700; fill: var(--foreground); letter-spacing: .12em; text-transform: uppercase; }

        .name { font-weight: 800; font-size: 26px; fill: var(--foreground); }
        .title { font-weight: 700; font-size: 14px; fill: var(--muted); }

        .stat-label { font-size: 12px; fill: var(--muted); }
        .stat-value { font-size: 16px; font-weight: 800; fill: var(--foreground); }

        .footer { font-size: 12px; fill: var(--muted); }
        .cover-tint { fill: var(--accent); opacity: .14; }
        .panel { fill: rgba(8,12,20,1); stroke: rgba(255,255,255,.06); }

        svg[data-tier="starter"] { --border:#6b7280; --accent:#9ca3af; --glow:#6b7280; }
        svg[data-tier="common"] { --border:#38bdf8; --accent:#38bdf8; --glow:#38bdf8; }
        svg[data-tier="rare"] { --border:#8b5cf6; --accent:#8b5cf6; --glow:#8b5cf6; }
        svg[data-tier="epic"] { --border:#f59e0b; --accent:#f59e0b; --glow:#f59e0b; }
        svg[data-tier="legendary"] { --border:#f43f5e; --accent:#f43f5e; --glow:#f43f5e; }
        svg[data-tier="mythic"] { --border:#22d3ee; --accent:#22d3ee; --glow:#22d3ee; }

        /* Ensure only the correct tier label shows */
        .tier-label { display: none; }
        svg[data-tier="starter"] .tier-starter { display: inline; }
        svg[data-tier="common"] .tier-common { display: inline; }
        svg[data-tier="rare"] .tier-rare { display: inline; }
        svg[data-tier="epic"] .tier-epic { display: inline; }
        svg[data-tier="legendary"] .tier-legendary { display: inline; }
        svg[data-tier="mythic"] .tier-mythic { display: inline; }
      `}</style>

      {/* Card container */}
      <g filter="url(#shadow)">
        <rect x="20" y="20" width="360" height="560" rx="24" ry="24" className="bg" />
        {/* Cover */}
        <g clipPath="url(#card-clip)">
          <image x="20" y="20" width="360" height="140" preserveAspectRatio="xMidYMid slice" href={coverUrl} />
          <rect x="20" y="20" width="360" height="140" className="cover-tint" />
          <rect x="20" y="20" width="360" height="140" fill="url(#cover-shade)" />
        </g>
        {/* Draw glow first so the panel can cover it, then draw solid border on top */}
        <rect x="20" y="20" width="360" height="560" rx="24" ry="24" className="border-glow" />
        <rect x="36" y="172" width="328" height="392" rx="20" ry="20" className="panel" />
        <rect x="20" y="20" width="360" height="560" rx="24" ry="24" className="border" />
      </g>

      {/* Tier chip */}
      <g transform="translate(44,44)">
        <rect x="0" y="0" width="96" height="28" rx="10" ry="10" className="chip-neon" />
        <rect x="0" y="0" width="96" height="28" rx="10" ry="10" className="chip-back" />
        <rect x="2" y="2" width="92" height="24" rx="8" ry="8" className="chip" />
        {/* we keep all tier labels; visibility is controlled by data-tier styles */}
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-starter">STARTER</text>
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-common">COMMON</text>
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-rare">RARE</text>
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-epic">EPIC</text>
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-legendary">LEGENDARY</text>
        <text x="48" y="19" textAnchor="middle" className="chip-text tier-label tier-mythic">MYTHIC</text>
      </g>

      {/* Avatar */}
      <g>
        <circle cx="200" cy="170" r="60" fill="rgba(255,255,255,.06)" stroke="var(--accent)" strokeWidth="1" />
        <image x="140" y="110" width="120" height="120" href={avatarUrl} clipPath="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />
      </g>

      {/* Name and title */}
      <g transform="translate(40,260)">
        <text x="160" y="0" textAnchor="middle" className="name">{displayName}</text>
        <text x="160" y="24" textAnchor="middle" className="title">{title}</text>
      </g>

      {/* Divider */}
      <line x1="48" y1="308" x2="352" y2="308" className="divider" />

      {/* Stats */}
      <g transform="translate(48,328)">
        <g>
          <text x="0" y="0" className="stat-label">Followers</text>
          <text x="0" y="22" className="stat-value">{followers}</text>
        </g>
        <g transform="translate(118,0)">
          <text x="0" y="0" className="stat-label">Coming soon</text>
          <text x="0" y="22" className="stat-value">—</text>
        </g>
        <g transform="translate(236,0)">
          <text x="0" y="0" className="stat-label">Coming soon</text>
          <text x="0" y="22" className="stat-value">—</text>
        </g>
      </g>

      {/* About */}
      <g transform="translate(40,384)">
        <text x="0" y="0" className="title">About</text>
        <foreignObject x="0" y="10" width="320" height="100">
          <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {about}
          </div>
        </foreignObject>
      </g>

      {/* Footer */}
      <g id="footer" transform="translate(40,536)">
        <rect x="0" y="-24" width="320" height="36" rx="10" ry="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" />
        <text id="footerLabel" x="160" y="-6" textAnchor="middle" dominantBaseline="middle" className="footer">{footerLabel}</text>
        <g id="footerBadge" transform="translate(320, 2)">
          <rect id="footerBadgeRect" x={-badgeWidth} y="0" width={badgeWidth} height="24" rx="8" ry="8" fill="var(--accent)" />
          <text id="footerBadgeText" x={-badgeWidth / 2} y="16" textAnchor="middle" className="chip-text" fill="#0b0f1a">{footerBadge}</text>
        </g>
      </g>
    </svg>
  );
}

