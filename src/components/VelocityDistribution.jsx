import { useMemo, useState, useRef } from 'react'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

// Color families for each pitcher (up to 4)
const PITCHER_PALETTES = [
  // Pitcher 0: warm — reds/oranges
  { FF:'#C62828', SI:'#E64A19', FC:'#AD1457', FA:'#B71C1C', SL:'#F57C00', CU:'#FFA000', ST:'#F9A825', CH:'#6D4C41', FS:'#4E342E', KC:'#BF360C', SV:'#E65100', CS:'#FF8F00', KN:'#5D4037', FO:'#4E342E', EP:'#3E2723', SC:'#827717' },
  // Pitcher 1: blues/cyans
  { FF:'#1565C0', SI:'#0277BD', FC:'#283593', FA:'#1A237E', SL:'#00838F', CU:'#006064', ST:'#0097A7', CH:'#00796B', FS:'#0288D1', KC:'#01579B', SV:'#1976D2', CS:'#2196F3', KN:'#4DD0E1', FO:'#00ACC1', EP:'#26C6DA', SC:'#80DEEA' },
  // Pitcher 2: greens
  { FF:'#2E7D32', SI:'#388E3C', FC:'#558B2F', FA:'#1B5E20', SL:'#33691E', CU:'#004D40', ST:'#00695C', CH:'#00897B', FS:'#43A047', KC:'#2E7D32', SV:'#66BB6A', CS:'#A5D6A7', KN:'#37474F', FO:'#546E7A', EP:'#78909C', SC:'#B0BEC5' },
  // Pitcher 3: purples/violets
  { FF:'#6A1B9A', SI:'#7B1FA2', FC:'#4A148C', FA:'#880E4F', SL:'#AD1457', CU:'#512DA8', ST:'#4527A0', CH:'#283593', FS:'#8E24AA', KC:'#AB47BC', SV:'#CE93D8', CS:'#BA68C8', KN:'#9C27B0', FO:'#673AB7', EP:'#5E35B1', SC:'#3949AB' },
]

function pitcherPaletteColor(pitcherIdx, pitchType) {
  const palette = PITCHER_PALETTES[pitcherIdx % PITCHER_PALETTES.length]
  return palette[pitchType] || pitchTypeColor(pitchType)
}

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
    return { x, y: y * 100 }
  })
}

const W = 700
const H = 320
const PAD = { top: 44, right: 32, bottom: 50, left: 62 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const EVAL_N = 250
const CLIP_ID = 'vel-dist-clip'

// Normalize incoming data to { pitcherId: { name, pitchTypes: { pt: [speeds] } } }
function normalizeData(data) {
  if (!data || typeof data !== 'object') return {}
  const firstVal = Object.values(data)[0]
  if (!firstVal) return {}
  // Old format: { PT: [speeds] } — wrap as single pitcher
  if (Array.isArray(firstVal)) {
    return { _single: { name: null, pitchTypes: data } }
  }
  // New format: { pitcherId: { name, pitchTypes } }
  return data
}

export default function VelocityDistribution({ data, pitcherName, filters }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const normalized = useMemo(() => normalizeData(data), [data])
  const pitcherIds = Object.keys(normalized)
  const isMulti = pitcherIds.length > 1

  const { pitcherCurves, xMin, xMax, yMax, yTicks, xTicks } = useMemo(() => {
    if (!pitcherIds.length) {
      return { pitcherCurves: [], xMin: 70, xMax: 100, yMax: 10, yTicks: [0,2,4,6,8,10], xTicks: [] }
    }

    let allVals = []
    pitcherIds.forEach(pid => {
      const pts = normalized[pid].pitchTypes || {}
      Object.values(pts).forEach(arr => allVals.push(...arr))
    })
    if (!allVals.length) return { pitcherCurves: [], xMin: 70, xMax: 100, yMax: 10, yTicks: [0,2,4,6,8,10], xTicks: [] }

    const rawMin = Math.min(...allVals)
    const rawMax = Math.max(...allVals)
    const xMin = Math.floor((rawMin - 4) / 5) * 5
    const xMax = Math.ceil((rawMax + 4) / 5) * 5
    const evalPoints = Array.from({ length: EVAL_N }, (_, i) =>
      xMin + (i / (EVAL_N - 1)) * (xMax - xMin)
    )

    let globalYMax = 0
    const pitcherCurves = pitcherIds.map((pid, pitcherIdx) => {
      const { name, pitchTypes } = normalized[pid]
      const validTypes = Object.keys(pitchTypes).filter(pt => (pitchTypes[pt]?.length || 0) >= 5)
      const curves = validTypes.map(pt => {
        const values = pitchTypes[pt]
        const bw = Math.max(silvermanBandwidth(values), 0.5)
        const points = gaussianKDE(values, bw, evalPoints)
        const cMax = Math.max(...points.map(p => p.y))
        if (cMax > globalYMax) globalYMax = cMax
        const color = isMulti ? pitcherPaletteColor(pitcherIdx, pt) : pitchTypeColor(pt)
        return { pt, points, n: values.length, color }
      })
      return { pid, name, pitcherIdx, curves }
    })

    const yStep = globalYMax > 30 ? 10 : globalYMax > 15 ? 5 : 2
    const yAxisMax = Math.ceil(globalYMax / yStep) * yStep
    const yTicks = []
    for (let v = 0; v <= yAxisMax; v += yStep) yTicks.push(v)
    const xTicks = []
    for (let v = xMin; v <= xMax; v += 5) xTicks.push(v)

    return { pitcherCurves, xMin, xMax, yMax: yAxisMax, yTicks, xTicks }
  }, [normalized, pitcherIds.join(','), isMulti])

  const xScale = x => PAD.left + ((x - xMin) / (xMax - xMin)) * PLOT_W
  const yScale = y => PAD.top + PLOT_H - (y / yMax) * PLOT_H
  const baseY = PAD.top + PLOT_H

  const toFillPath = (pts) => {
    if (!pts.length) return ''
    const threshold = 0.04
    let start = 0, end = pts.length - 1
    while (start < end && pts[start].y < threshold) start++
    while (end > start && pts[end].y < threshold) end--
    if (end <= start) return ''
    const s = Math.max(0, start - 1)
    const e = Math.min(pts.length - 1, end + 1)
    const vis = pts.slice(s, e + 1)
    const line = vis.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`
    ).join(' ')
    return `${line} L${xScale(vis[vis.length-1].x).toFixed(1)},${baseY} L${xScale(vis[0].x).toFixed(1)},${baseY} Z`
  }

  const toLinePath = pts =>
    pts.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`
    ).join(' ')

  const handleMouseMove = e => {
    if (!svgRef.current || !pitcherCurves.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width)
    const dataX = xMin + ((svgX - PAD.left) / PLOT_W) * (xMax - xMin)
    if (dataX < xMin || dataX > xMax) { setTooltip(null); return }

    const tipPitchers = pitcherCurves.map(({ name, pitcherIdx, curves, pid }) => {
      const tipCurves = curves.map(({ pt, points, color }) => {
        const closest = points.reduce((best, p) =>
          Math.abs(p.x - dataX) < Math.abs(best.x - dataX) ? p : best
        )
        return { pt, y: closest.y, color }
      }).filter(d => d.y >= 0.01).sort((a, b) => b.y - a.y)
      return { pid, name, pitcherIdx, tipCurves }
    }).filter(p => p.tipCurves.length > 0)

    setTooltip({ svgX, speed: Math.round(dataX * 10) / 10, pitchers: tipPitchers })
  }

  const allCurves = pitcherCurves.flatMap(p => p.curves)

  if (!allCurves.length) {
    return (
      <div className="analysis-empty-state">
        No velocity data available for the active filters.
      </div>
    )
  }

  const displayTitle = pitcherName
    ? `${pitcherName} Frequency of Pitch Arsenal by Pitch Speed`
    : 'Frequency of Pitch Arsenal by Pitch Speed'

  const tooltipLeftPct = tooltip ? Math.min(Math.max((tooltip.svgX / W) * 100, 18), 78) : 50

  return (
    <div style={{ position: 'relative', background: '#f9fafb', borderRadius: 8 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <clipPath id={CLIP_ID}>
            <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
          </clipPath>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="#f9fafb" />
        <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} fill="#ffffff" />

        <text
          x={W / 2} y={22}
          textAnchor="middle" dominantBaseline="middle"
          fill="#0b6070" fontSize="13" fontWeight="500"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          {displayTitle}
        </text>

        {yTicks.map(v => (
          <line key={`hg-${v}`}
            x1={PAD.left} y1={yScale(v)} x2={PAD.left + PLOT_W} y2={yScale(v)}
            stroke="#b8dcea" strokeWidth="0.7"
          />
        ))}
        {xTicks.map(v => (
          <line key={`vg-${v}`}
            x1={xScale(v)} y1={PAD.top} x2={xScale(v)} y2={baseY}
            stroke="#b8dcea" strokeWidth="0.7"
          />
        ))}

        {yTicks.map(v => (
          <text key={`yl-${v}`}
            x={PAD.left - 8} y={yScale(v)}
            textAnchor="end" dominantBaseline="middle"
            fill="#3d7a8a" fontSize="10"
            fontFamily="Helvetica, Arial, sans-serif"
          >
            {v}%
          </text>
        ))}

        <text
          x={13} y={PAD.top + PLOT_H / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill="#1f6070" fontSize="10" fontWeight="600"
          fontFamily="Helvetica, Arial, sans-serif"
          transform={`rotate(-90, 13, ${PAD.top + PLOT_H / 2})`}
        >
          Frequency
        </text>

        {/* Fills */}
        {pitcherCurves.map(({ pid, curves }) =>
          curves.map(({ pt, points, color }) => (
            <path key={`fill-${pid}-${pt}`}
              d={toFillPath(points)}
              fill={color} fillOpacity="0.13" stroke="none"
              clipPath={`url(#${CLIP_ID})`}
            />
          ))
        )}

        {/* Curve strokes */}
        {pitcherCurves.map(({ pid, curves }) =>
          curves.map(({ pt, points, color }) => (
            <path key={`line-${pid}-${pt}`}
              d={toLinePath(points)}
              fill="none" stroke={color}
              strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
              clipPath={`url(#${CLIP_ID})`}
            />
          ))
        )}

        <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H}
          fill="none" stroke="#90c4d4" strokeWidth="0.8"
        />

        {xTicks.map(v => (
          <g key={`xt-${v}`}>
            <line x1={xScale(v)} y1={baseY} x2={xScale(v)} y2={baseY + 4}
              stroke="#5a9aaa" strokeWidth="0.8"
            />
            <text x={xScale(v)} y={baseY + 16}
              textAnchor="middle" fill="#3d7a8a" fontSize="10"
              fontFamily="Helvetica, Arial, sans-serif"
            >
              {v} MPH
            </text>
          </g>
        ))}

        <text
          x={PAD.left + PLOT_W / 2} y={baseY + 34}
          textAnchor="middle" fill="#1f6070" fontSize="11" fontWeight="600"
          fontFamily="Helvetica, Arial, sans-serif"
        >
          Pitch Speed
        </text>

        {tooltip && (
          <line
            x1={tooltip.svgX} y1={PAD.top} x2={tooltip.svgX} y2={baseY}
            stroke="#5a9aaa" strokeWidth="0.8" strokeDasharray="3 2"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && tooltip.pitchers.length > 0 && (
        <div style={{
          position: 'absolute',
          left: `${tooltipLeftPct}%`, top: '14%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #90c4d4', borderRadius: 6,
          padding: '7px 11px', pointerEvents: 'none', zIndex: 10,
          minWidth: 150, boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        }}>
          <div style={{ fontWeight: 700, color: '#0b4a5a', marginBottom: 5, fontSize: 12 }}>
            {tooltip.speed.toFixed(1)} MPH
          </div>
          {tooltip.pitchers.map(({ pid, name, tipCurves }) => (
            <div key={pid}>
              {isMulti && name && (
                <div style={{ color: '#5a8a9a', fontSize: 10, marginBottom: 2, fontWeight: 600 }}>
                  {name}
                </div>
              )}
              {tipCurves.map(d => (
                <div key={d.pt} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, fontSize: 11 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: d.color, borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ color: '#1f5a6a' }}>{pitchTypeLabel(d.pt)}</span>
                  <span style={{ color: '#3d7a8a', marginLeft: 'auto', paddingLeft: 6, fontVariantNumeric: 'tabular-nums' }}>
                    {d.y.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px 16px',
        padding: '8px 14px 10px', background: '#f9fafb',
        borderTop: '1px solid #daeaf0',
      }}>
        {pitcherCurves.map(({ pid, name, pitcherIdx, curves }) => (
          <div key={pid} style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', width: isMulti ? '100%' : undefined }}>
            {isMulti && (
              <div style={{ width: '100%', color: '#0b6070', fontSize: 11, fontWeight: 700, marginBottom: 1 }}>
                {name || pid}
              </div>
            )}
            {curves.map(({ pt, n, color }) => (
              <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="24" height="10" style={{ flex: '0 0 auto' }}>
                  <rect x="0" y="3" width="24" height="4" fill={color} fillOpacity="0.25" rx="1" />
                  <line x1="0" y1="5" x2="24" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span style={{ color: '#1f5a6a', fontSize: 11 }}>{pitchTypeLabel(pt)}</span>
                <span style={{ color: '#5a8a9a', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>n={n}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
