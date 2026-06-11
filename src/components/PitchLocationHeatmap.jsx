import { Typography } from 'antd'

const { Text } = Typography

const WIDTH = 620
const HEIGHT = 420
const PLOT = {
  left: 72,
  top: 34,
  width: 320,
  height: 316,
}
const STRIKE_ZONE = {
  xMin: -0.83,
  xMax: 0.83,
  zMin: 1.5,
  zMax: 3.5,
}

const mapX = (x, xRange = [-2.6, 2.6]) => (
  PLOT.left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * PLOT.width
)

const mapZ = (z, zRange = [0.4, 5.2]) => (
  PLOT.top + PLOT.height - ((z - zRange[0]) / (zRange[1] - zRange[0])) * PLOT.height
)

const describeCount = counts => {
  if (!Array.isArray(counts) || counts.length === 0) return 'All counts'
  if (counts.length === 1) {
    const [balls, strikes] = String(counts[0]).split('-')
    return `${balls || 0}-${strikes || 0} count`
  }
  return `${counts.length} selected counts`
}

function BatterSilhouette() {
  return (
    <g opacity="0.32">
      <path
        d="M448 100 L544 42 Q551 45 554 52 Q555 58 548 63 L455 124 Z"
        fill="#d6d6d6"
        stroke="#c1c1c1"
        strokeWidth="1"
      />
      <circle cx="420" cy="102" r="18" fill="#dedede" stroke="#c9c9c9" />
      <path
        d="M390 122 Q416 106 441 121 Q465 136 474 162 Q485 195 467 225 Q454 248 431 255 Q405 263 384 247 Q371 236 372 212 L369 166 Q368 139 390 122 Z"
        fill="#dddddd"
        stroke="#c7c7c7"
        strokeWidth="1.1"
      />
      <path
        d="M390 131 Q369 140 362 167 Q356 191 366 200 Q379 211 393 192 L411 168 Q417 160 410 153 Q401 145 392 154 L379 176 Q373 185 370 178 Q369 158 383 142 Z"
        fill="#e5e5e5"
        stroke="#cacaca"
        strokeWidth="1"
      />
      <path
        d="M401 248 Q389 287 401 326 Q411 356 397 373 Q383 389 359 383 Q349 380 357 373 Q376 363 377 342 Q375 319 365 292 Q356 267 371 242 Z"
        fill="#dedede"
        stroke="#c8c8c8"
        strokeWidth="1"
      />
      <path
        d="M438 248 Q455 286 476 325 Q495 359 490 381 Q485 399 459 396 Q438 393 430 386 Q426 381 437 376 Q457 365 453 344 Q447 317 425 276 Z"
        fill="#dedede"
        stroke="#c8c8c8"
        strokeWidth="1"
      />
      <path
        d="M400 130 Q418 116 440 126"
        fill="none"
        stroke="#c8c8c8"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </g>
  )
}

function HeatCell({ cell, xRange, zRange }) {
  const x = mapX(cell.x, xRange)
  const y = mapZ(cell.z, zRange)
  const intensity = Math.max(0.08, Math.min(1, Number(cell.intensity || 0)))
  const outerRadius = 7 + intensity * 13
  const midRadius = 4 + intensity * 8
  const hotRadius = 2 + intensity * 5
  const isHot = intensity > 0.46

  return (
    <g>
      <circle cx={x} cy={y} r={outerRadius} fill="#2f5ea8" opacity={0.18 + intensity * 0.18} />
      <circle cx={x} cy={y} r={midRadius} fill="#7f9ed0" opacity={0.2 + intensity * 0.16} />
      {isHot && (
        <circle cx={x} cy={y} r={hotRadius} fill="#ef3434" opacity={0.32 + intensity * 0.46} />
      )}
    </g>
  )
}

export default function PitchLocationHeatmap({ data, filters }) {
  const cells = data?.cells || []
  const xRange = data?.xRange || [-2.6, 2.6]
  const zRange = data?.zRange || [0.4, 5.2]
  const total = Number(data?.total || 0)
  const hasData = total > 0 && cells.length > 0
  const zoneX = mapX(STRIKE_ZONE.xMin, xRange)
  const zoneY = mapZ(STRIKE_ZONE.zMax, zRange)
  const zoneW = mapX(STRIKE_ZONE.xMax, xRange) - zoneX
  const zoneH = mapZ(STRIKE_ZONE.zMin, zRange) - zoneY

  return (
    <section className="analysis-card pitch-location-card">
      <div className="analysis-heading">
        <div>
          <h2>Pitch Location Heatmap</h2>
          <p>{describeCount(filters?.counts)} precise plate_x / plate_z density for the active filters.</p>
        </div>
        {hasData && <span className="next-pitch-sample">n={total}</span>}
      </div>

      {hasData ? (
        <div className="pitch-location-shell">
          <svg
            className="pitch-location-svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label="Pitch location heatmap"
          >
            <rect width={WIDTH} height={HEIGHT} rx="10" fill="#f7f7f5" />
            <g opacity="0.55">
              {Array.from({ length: 40 }, (_, i) => (
                <line
                  key={i}
                  x1={i * 28 - 120}
                  y1="0"
                  x2={i * 28 - 80}
                  y2="26"
                  stroke="#98c7ce"
                  strokeWidth="1"
                />
              ))}
            </g>
            <line x1="0" y1="27" x2={WIDTH} y2="27" stroke="#b8b8b8" strokeWidth="2" />
            <g transform="translate(20 0)">
              <BatterSilhouette />
            </g>
            <path
              d="M184 363 L274 363 L292 394 L229 412 L168 394 Z"
              fill="#e1e1df"
              stroke="#c7c7c5"
              strokeWidth="1.2"
            />
            <g style={{ mixBlendMode: 'multiply' }}>
              {cells.map(cell => (
                <HeatCell key={`${cell.x}-${cell.z}`} cell={cell} xRange={xRange} zRange={zRange} />
              ))}
            </g>
            <rect
              x={zoneX}
              y={zoneY}
              width={zoneW}
              height={zoneH}
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="5"
            />
          </svg>
          <div className="pitch-location-legend">
            <span>Low</span>
            <div />
            <span>High</span>
          </div>
        </div>
      ) : (
        <div className="analysis-empty-state">
          No precise pitch locations are available for the active filters.
        </div>
      )}
    </section>
  )
}
