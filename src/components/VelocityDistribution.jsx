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
    return { x, y: y * 100 } // convert density → percentage per MPH
  })
}

const W = 640
const H = 300
const PAD = { top: 24, right: 24, bottom: 56, left: 64 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const EVAL_N = 200

export default function VelocityDistribution({ data }) {
  const pitchTypes = Object.keys(data || {}).filter(pt => (data[pt]?.length || 0) >= 5)

  const { curves, allCurve, xMin, xMax, yMax, yTicks } = useMemo(() => {
    if (!pitchTypes.length) return { curves: [], allCurve: [], xMin: 70, xMax: 100, yMax: 30, yTicks: [] }

    let allVals = []
    pitchTypes.forEach(pt => allVals.push(...data[pt]))
    const rawMin = Math.min(...allVals)
    const rawMax = Math.max(...allVals)
    const xMin = Math.floor(rawMin / 5) * 5
    const xMax = Math.ceil(rawMax / 5) * 5

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

    // All-pitches aggregate curve
    const allBw = Math.max(silvermanBandwidth(allVals), 0.5)
    const allCurve = gaussianKDE(allVals, allBw, evalPoints)
    const allMax = Math.max(...allCurve.map(p => p.y))
    if (allMax > yMax) yMax = allMax

    // Nice Y-axis ticks (multiples of 5%)
    const yAxisMax = Math.ceil(yMax / 5) * 5
    const yTicks = []
    for (let v = 0; v <= yAxisMax; v += 5) yTicks.push(v)

    return { curves, allCurve, xMin, xMax, yMax: yAxisMax, yTicks }
  }, [data, pitchTypes.join(',')])

  const xScale = x => PAD.left + ((x - xMin) / (xMax - xMin)) * PLOT_W
  const yScale = y => PAD.top + PLOT_H - (y / yMax) * PLOT_H
  const baseY = PAD.top + PLOT_H

  const toFillPath = pts => {
    if (!pts.length) return ''
    const line = pts.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`
    ).join(' ')
    return `${line} L${xScale(pts[pts.length - 1].x).toFixed(1)},${baseY} L${xScale(pts[0].x).toFixed(1)},${baseY} Z`
  }

  const toLinePath = pts =>
    pts.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`
    ).join(' ')

  const xTicks = []
  for (let v = xMin; v <= xMax; v += 5) xTicks.push(v)

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
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, background: '#f7f7f5' }}
      >
        {/* Horizontal grid lines */}
        {yTicks.map(v => (
          <line
            key={`hgrid-${v}`}
            x1={PAD.left} y1={yScale(v)}
            x2={PAD.left + PLOT_W} y2={yScale(v)}
            stroke="#e0e6ed" strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(v => (
          <text
            key={`ylabel-${v}`}
            x={PAD.left - 8} y={yScale(v)}
            textAnchor="end" dominantBaseline="middle"
            fill="#64748b" fontSize="11"
            fontFamily="Helvetica, Arial, sans-serif"
          >
            {v}%
          </text>
        ))}

        {/* Y-axis title (rotated) */}
        <text
          x={14} y={PAD.top + PLOT_H / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill="#475569" fontSize="11" fontWeight="700"
          fontFamily="Helvetica, Arial, sans-serif"
          transform={`rotate(-90, 14, ${PAD.top + PLOT_H / 2})`}
        >
          Frequency of Speed
        </text>

        {/* Fill under individual curves */}
        {curves.map(({ pt, points }) => (
          <path
            key={`fill-${pt}`}
            d={toFillPath(points)}
            fill={pitchTypeColor(pt)}
            fillOpacity="0.20"
            stroke="none"
          />
        ))}

        {/* Individual curve strokes */}
        {curves.map(({ pt, points }) => (
          <path
            key={`line-${pt}`}
            d={toLinePath(points)}
            fill="none"
            stroke={pitchTypeColor(pt)}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* All Pitches dashed curve */}
        <path
          d={toLinePath(allCurve)}
          fill="none"
          stroke="#334761"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseY} stroke="#b8c5d5" strokeWidth="1" />
        <line x1={PAD.left} y1={baseY} x2={PAD.left + PLOT_W} y2={baseY} stroke="#b8c5d5" strokeWidth="1" />

        {/* X-axis ticks + labels */}
        {xTicks.map(v => (
          <g key={`xtick-${v}`}>
            <line
              x1={xScale(v)} y1={baseY}
              x2={xScale(v)} y2={baseY + 5}
              stroke="#b8c5d5" strokeWidth="1"
            />
            <text
              x={xScale(v)} y={baseY + 18}
              textAnchor="middle"
              fill="#475569" fontSize="12" fontWeight="700"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              {v} MPH
            </text>
          </g>
        ))}

        {/* X-axis title */}
        <text
          x={PAD.left + PLOT_W / 2} y={H - 6}
          textAnchor="middle"
          fill="#475569" fontSize="12" fontWeight="700"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          Pitch Speed
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 10, paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="28" height="12" style={{ flex: '0 0 auto' }}>
            <line x1="0" y1="6" x2="28" y2="6" stroke="#334761" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
          <span style={{ color: '#c8d4e3', fontSize: 13, fontWeight: 800 }}>All Pitches</span>
        </div>
        {curves.map(({ pt, n }) => (
          <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="28" height="12" style={{ flex: '0 0 auto' }}>
              <line x1="0" y1="6" x2="28" y2="6" stroke={pitchTypeColor(pt)} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#c8d4e3', fontSize: 13, fontWeight: 800 }}>
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
