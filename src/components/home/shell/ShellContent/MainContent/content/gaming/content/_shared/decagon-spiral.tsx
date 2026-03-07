"use client"

interface DecagonSpiralProps {
  displayNumber?: number
  size?: number
}

export default function DecagonSpiral({ displayNumber = 1234, size = 120 }: DecagonSpiralProps) {
  const layers = 20
  const rotation = 0
  const scale = 0.95

  const segmentsToShow = Math.min(10, Math.ceil(displayNumber / 1000))

  const colorPalette = [
    "#00ffff", // cyan
    "#0080ff", // light blue
    "#0000ff", // blue
    "#4000ff", // blue-purple
    "#8000ff", // purple
    "#ff00ff", // magenta
    "#ff0080", // pink-red
    "#ff0000", // red
    "#ff8000", // orange
    "#ffff00", // yellow
  ]

  const sideColors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] // Use all colors in sequence

  // Generate points for a regular decagon
  const generateDecagonPoints = (centerX: number, centerY: number, radius: number, rotationAngle = 0) => {
    const points = []
    const sides = 10

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides + rotationAngle
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      points.push({ x, y })
    }

    return points
  }

  const generateSpiral = () => {
    const elements = []
    const centerX = size / 2
    const centerY = size / 2
    let currentRadius = size * 0.4

    for (let i = 0; i < layers; i++) {
      const layerRotation = (rotation + i * 5) * (Math.PI / 180)
      const opacity = Math.max(0.2, 1 - (i / layers) * 0.7)
      const strokeWidth = Math.max(0.3, 1.5 - (i / layers) * 1.2)

      // Get points for this layer
      const points = generateDecagonPoints(centerX, centerY, currentRadius, layerRotation)

      for (let sideIndex = 0; sideIndex < segmentsToShow; sideIndex++) {
        const currentPoint = points[sideIndex]
        const nextPoint = points[(sideIndex + 1) % 10]
        const color = colorPalette[sideColors[sideIndex]]

        elements.push(
          <line
            key={`decagon-side-${i}-${sideIndex}`}
            x1={currentPoint.x}
            y1={currentPoint.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />,
        )
      }

      // Add connecting lines to create the spiral effect
      if (i < layers - 1) {
        const nextRadius = currentRadius * scale
        const nextLayerRotation = (rotation + (i + 1) * 5) * (Math.PI / 180)
        const nextPoints = generateDecagonPoints(centerX, centerY, nextRadius, nextLayerRotation)

        for (let j = 0; j < segmentsToShow; j++) {
          const color = colorPalette[sideColors[j]]

          elements.push(
            <line
              key={`line-${i}-${j}`}
              x1={points[j].x}
              y1={points[j].y}
              x2={nextPoints[j].x}
              y2={nextPoints[j].y}
              stroke={color}
              strokeWidth={strokeWidth * 0.7}
              opacity={opacity * 0.8}
            />,
          )
        }
      }

      currentRadius *= scale
    }

    return elements
  }

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
        <rect width={size} height={size} fill="transparent" rx="8" />
        {generateSpiral()}
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.14}
          fontWeight="900"
          fontFamily="monospace"
          stroke="rgba(0,0,0,0.9)"
          strokeWidth="2"
          paintOrder="stroke fill"
        >
          {displayNumber}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.14}
          fontWeight="900"
          fontFamily="monospace"
          filter="drop-shadow(0 0 4px rgba(0,0,0,0.8))"
        >
          {displayNumber}
        </text>
      </svg>
    </div>
  )
}
