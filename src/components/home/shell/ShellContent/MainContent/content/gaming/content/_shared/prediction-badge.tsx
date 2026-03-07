"use client"

import React from "react"

interface PredictionBadgeProps {
  isWinPredicted?: boolean
  size?: number
  // When true, clicking toggles between compact and expanded label
  interactive?: boolean
  // Start expanded (shows full label). Default: false (compact)
  defaultExpanded?: boolean
}

export default function PredictionBadge({
  isWinPredicted = true,
  size = 24,
  interactive = true,
  defaultExpanded = false,
}: PredictionBadgeProps) {
  // Minimal, non-distracting treatment
  const tint = isWinPredicted ? "#18c964" : "#ff6b6b"
  const outcome = isWinPredicted ? "Win" : "Loss"
  const labelFull = isWinPredicted ? "Predicted Win" : "Predicted Loss"

  const [expanded, setExpanded] = React.useState<boolean>(defaultExpanded)

  const dotSize = Math.max(8, Math.min(12, Math.floor(size * 0.5)))
  const padX = 14
  const height = Math.max(34, size + 10)

  const content = (
    <div
      className="inline-flex flex-col items-center justify-center gap-0 select-none"
      style={{
        height,
        paddingLeft: padX,
        paddingRight: padX,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: 12,
        border: "1px solid",
        borderColor: "color-mix(in oklab, var(--border), transparent 35%)",
        background: `color-mix(in oklab, ${tint}, transparent 96%)`,
        // Very subtle ring using the outcome tint
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint}, transparent 90%)`,
        color: "var(--textSecondary)",
        fontWeight: 700,
        fontSize: 11,
        lineHeight: 1.05,
      }}
      title={labelFull}
      aria-label={labelFull}
      role="status"
    >
      {/* Top row: emote + Predicted */}
      <div className="inline-flex items-center gap-1" style={{ marginBottom: 4 }}>
        <span
          aria-hidden
          className="relative inline-flex items-center justify-center"
          style={{ width: dotSize + 2, height: dotSize + 2 }}
        >
          {isWinPredicted ? (
            <svg
              width={dotSize + 2}
              height={dotSize + 2}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <path
                d="M4 8.5l2.2 2.2L12 5.5"
                stroke={`color-mix(in oklab, ${tint}, transparent 20%)`}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width={dotSize + 2}
              height={dotSize + 2}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              <path
                d="M5 5l6 6M11 5l-6 6"
                stroke={`color-mix(in oklab, ${tint}, transparent 20%)`}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
        <span className="whitespace-nowrap" style={{ opacity: 0.9 }}>Predicted</span>
      </div>
      {/* Bottom row: centered outcome */}
      <div className="w-full text-center" style={{ fontSize: 10, opacity: 0.9, color: `color-mix(in oklab, ${tint}, var(--textSecondary) 70%)` }}>
        {outcome}
      </div>
    </div>
  )

  if (!interactive) {
    return <div className="flex items-center justify-center">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="flex items-center justify-center focus:outline-none"
      style={{ background: "none" }}
      aria-pressed={expanded}
    >
      {content}
    </button>
  )
}
