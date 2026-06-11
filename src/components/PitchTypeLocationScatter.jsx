import { useState } from 'react'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const WIDTH = 520
const HEIGHT = 390
const PLOT = {
  left: 48,
  top: 34,
  width: 250,
  height: 280,
}
const STRIKE_ZONE = {
  xMin: -0.83,
  xMax: 0.83,
  zMin: 1.55,
  zMax: 3.45,
}

const mapX = (x, xRange = [-2.6, 2.6]) => (
  PLOT.left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * PLOT.width
)

const mapZ = (z, zRange = [0.4, 5.2]) => (
  PLOT.top + PLOT.height - ((z - zRange[0]) / (zRange[1] - zRange[0])) * PLOT.height
)

const titleCase = value => {
  if (!value) return '-'
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const dash = value => {
  if (value === null || value === undefined || value === '') return '-'
  if (Number.isFinite(Number(value))) return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)
  return value
}

export default function PitchTypeLocationScatter({ data }) {
  const [selectedPoint, setSelectedPoint] = useState(null)
  const points = data?.points || []
  const legendPitchTypes = data?.legendPitchTypes || []
  const xRange = data?.xRange || [-2.6, 2.6]
  const zRange = data?.zRange || [0.4, 5.2]
  const zoneX = mapX(STRIKE_ZONE.xMin, xRange)
  const zoneY = mapZ(STRIKE_ZONE.zMax, zRange)
  const zoneW = mapX(STRIKE_ZONE.xMax, xRange) - zoneX
  const zoneH = mapZ(STRIKE_ZONE.zMin, zRange) - zoneY
  const zoneCenterX = zoneX + zoneW / 2
  const plateTop = PLOT.top + PLOT.height + 34
  const plateHalfWidth = 54
  const plateDepth = 24
  const selectedPitchName = selectedPoint ? pitchTypeLabel(selectedPoint.pitchType) : ''

  if (!points.length) {
    return (
      <div className="pitch-type-scatter-empty">
        No pitch locations available.
      </div>
    )
  }

  return (
    <div className="pitch-type-scatter-card">
      <svg className="pitch-type-scatter-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Pitch types by exact location">
        <rect width={WIDTH} height={HEIGHT} rx="8" fill="#f8f8f6" />
        <path
          d={`M${zoneCenterX - plateHalfWidth} ${plateTop} L${zoneCenterX + plateHalfWidth} ${plateTop} L${zoneCenterX + plateHalfWidth + 18} ${plateTop + plateDepth} L${zoneCenterX} ${plateTop + plateDepth + 13} L${zoneCenterX - plateHalfWidth - 18} ${plateTop + plateDepth} Z`}
          fill="#e3e3e1"
          stroke="#c8c8c6"
          strokeWidth="1.1"
        />
        <rect x={zoneX} y={zoneY} width={zoneW} height={zoneH} fill="none" stroke="#2f2f2f" strokeWidth="4" />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.z}-${point.pitchType}-${index}`}
            cx={mapX(point.x, xRange)}
            cy={mapZ(point.z, zRange)}
            r={selectedPoint === point ? 7 : 5.6}
            fill={pitchTypeColor(point.pitchType)}
            stroke="#111"
            strokeWidth={selectedPoint === point ? 1.8 : 1.1}
            opacity="0.92"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedPoint(point)}
          />
        ))}
        <g transform="translate(376 58)">
          {legendPitchTypes.slice(0, 6).map((pitchType, index) => (
            <g key={pitchType} transform={`translate(0 ${index * 26})`}>
              <circle cx="0" cy="0" r="5.5" fill={pitchTypeColor(pitchType)} stroke="#111" strokeWidth="0.9" />
              <text x="13" y="4" fill="#111" fontSize="11.5" fontWeight="700" fontFamily="Helvetica, Arial, sans-serif">
                {pitchTypeLabel(pitchType)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {selectedPoint && (
        <div className="pitch-point-popover">
          <button type="button" onClick={() => setSelectedPoint(null)}>×</button>
          <h3>{selectedPitchName}</h3>
          <p>Batter: {selectedPoint.batterName || '-'}</p>
          <p>Pitcher: {selectedPoint.pitcherName || '-'}</p>
          <p>Date: {selectedPoint.gameDate || '-'}</p>
          <p>Pitch Speed: {dash(selectedPoint.releaseSpeed)}</p>
          <p>Exit Velocity: {dash(selectedPoint.launchSpeed)}</p>
          <p>Launch Angle: {dash(selectedPoint.launchAngle)}</p>
          <p>Inning: {dash(selectedPoint.inning)}</p>
          <p>Count: {dash(selectedPoint.balls)}-{dash(selectedPoint.strikes)}</p>
          <p>Outs: {dash(selectedPoint.outs)}</p>
          <p>Result: {titleCase(selectedPoint.events || selectedPoint.description)}</p>
          <p>Contact Type: {titleCase(selectedPoint.contactType)}</p>
        </div>
      )}
    </div>
  )
}
