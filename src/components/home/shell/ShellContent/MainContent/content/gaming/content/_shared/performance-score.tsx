"use client"

interface PerformanceScoreProps {
  score?: number
  size?: number
}

export default function PerformanceScore({ score = 5000, size = 75 }: PerformanceScoreProps) {
  const maxScore = 10000
  const percentage = Math.min(100, (score / maxScore) * 100)
  const circumference = 2 * Math.PI * (size * 0.35)
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Color based on score performance
  const getScoreColor = (score: number) => {
    if (score >= 8000) return "#18c964" // Green for excellent
    if (score >= 6000) return "#f5a623" // Yellow for good
    if (score >= 4000) return "#ff9500" // Orange for average
    return "#ff6b6b" // Red for poor
  }

  const scoreColor = getScoreColor(score)

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.35}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={size * 0.08}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.35}
            stroke={scoreColor}
            strokeWidth={size * 0.08}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease-in-out",
              filter: `drop-shadow(0 0 4px ${scoreColor}40)`,
            }}
          />
        </svg>

        {/* Score text */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: size * 0.18,
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {score}
        </div>
      </div>
    </div>
  )
}
