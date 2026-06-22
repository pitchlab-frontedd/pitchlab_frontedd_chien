import { useMemo } from 'react'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

function silvermanBandwidth(values) {
  const n = values.length
  if (n < 2) return 1
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
  return 1.06 * Math.sqrt(variance) * Math.pow(n, -0.2)
}

function gaussianKDE(values, bandwidth, evalPoints) {
  const n = values.length
  const coeff = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI))
  return evalPoints.map(x => {
    const y = values.reduce((sum, xi) => {
      const u = (x - xi) / bandwidth
      return sum + Math.exp(-0.5 * u * u)
    }, 0) * coeff
    return { x, y }
  })
}

const W = 580
const H = 260
const PAD = { top: 16, right: 20, bottom: 40, left: 36 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const EVAL_N = 160

export default function VelocityDistribution({ data }) {
  const pitchTypes = Object.keys(data || {}).filter(pt => (data[pt]?.length || 0) >= 5)

  const { curves, xMin, xMax, yMax } = useMemo(() => {
    if (!pitchTypes.length) return { curves: [], xMin: 70, xMax: 100, yMax: 1 }

    let allVals = []
    pitchTypes.forEach(pt => allVals.push(...data[pt]))
    const rawMin = Math.min(...allVals)
    const rawMax = Math.max(...allVals)
    const xMin = Math.floor(rawMin - 2)
    const xMax = Math.ceil(rawMax + 2)

    const evalPoints = Array.from({ length: EVAL_N }, (_, i) =>
      xMin + (i / (EVAL_N - 1)) * (xMax - xMin)
    )

    let yMax = 0
    const curves = pitchTypes.map(pt => {
      const values = data[pt]
      const bw = Math.max(silvermanBandwidth(values), 0.5)
      const points = gaussianKDE(values, bw, evalPoints)
      const curveMax = Math.max(...points.map(p => p.y))
      if (curveMax > yMax) yMax = curveMax
      return { pt, points, n: values.length }
    })

    return { curves, xMin, xMax, yMax: yMax * 1.08 }
  }, [data, pitchTypes.join(',')])

  const xScale = x => PAD.left + ((x - xMin) / (xMax - xMin)) * PLOT_W
  const yScale = y => PAD.top + PLOT_H - (y / yMax) * PLOT_H

  const toPolyline = pts =>
    pts.map(p => `${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(' ')

  const toFillPath = pts => {
    if (!pts.length) return ''
    const baseY = yScale(0).toFixed(1)
    const line = pts.map(p => `L${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(' ')
    return `M${xScale(pts[0].x).toFixed(1)},${baseY} ${line} L${xScale(pts[pts.length - 1].x).toFixed(1)},${baseY} Z`
  }

  const tickStart = Math.ceil(xMin / 5) * 5
  const xTicks = []
  for (let v = tickStart; v <= xMax; v += 5) xTicks.push(v)

  if (!pitchTypes.length) {
    return (
      <div className="analysis-empty-state">
        No velocity data available for the active filters.
      </div>
    )
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, background: '#f8f8f6' }}
      >
        {xTicks.map(v => (
          <line
            key={v}
            x1={xScale(v)} y1={PAD.top}
            x2={xScale(v)} y2={PAD.top + PLOT_H}
            stroke="#e2e8f0" strokeWidth="1"
          />
        ))}

        {curves.map(({ pt, points }) => (
          <path
            key={`fill-${pt}`}
            d={toFillPath(points)}
            fill={pitchTypeColor(pt)}
            fillOpacity="0.18"
            stroke="none"
          />
        ))}

        {curves.map(({ pt, points }) => (
          <polyline
            key={`line-${pt}`}
            points={toPolyline(points)}
            fill="none"
            stroke={pitchTypeColor(pt)}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        <line
          x1={PAD.left} y1={PAD.top + PLOT_H}
          x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H}
          stroke="#94a3b8" strokeWidth="1"
        />

        {xTicks.map(v => (
          <g key={`tick-${v}`}>
            <line
              x1={xScale(v)} y1={PAD.top + PLOT_H}
              x2={xScale(v)} y2={PAD.top + PLOT_H + 5}
              stroke="#94a3b8" strokeWidth="1"
            />
            <text
              x={xScale(v)} y={PAD.top + PLOT_H + 18}
              textAnchor="middle"
              fill="#475569" fontSize="11"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              {v}
            </text>
          </g>
        ))}

        <text
          x={PAD.left + PLOT_W / 2} y={H - 4}
          textAnchor="middle"
          fill="#475569" fontSize="12" fontWeight="700"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          MPH
        </text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 12 }}>
        {curves.map(({ pt, n }) => (
          <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 24, height: 3, background: pitchTypeColor(pt), borderRadius: 2 }} />
            <span style={{ color: '#e6edf3', fontSize: 13, fontWeight: 800 }}>
              {pitchTypeLabel(pt)}
            </span>
            <span style={{ color: '#7f8da1', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              n={n}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
