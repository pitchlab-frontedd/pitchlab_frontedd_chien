import { useState } from 'react'
import { Tooltip, Typography } from 'antd'

const { Text } = Typography

const CELL = 62
const GRID = 5
const SIZE = CELL * GRID
const RING = CELL
const STRIKE_START = RING
const STRIKE_SIZE = CELL * 3
const MID = SIZE / 2
const STRIKE_END = STRIKE_START + STRIKE_SIZE
const OUTER_CELLS = [
  {
    zone: 11,
    path: [
      [0, 0],
      [MID, 0],
      [MID, STRIKE_START],
      [STRIKE_START, STRIKE_START],
      [STRIKE_START, MID],
      [0, MID],
    ],
    labelX: 10,
    labelY: 20,
    valueX: CELL * 0.75,
    valueY: CELL * 0.72,
  },
  {
    zone: 12,
    path: [
      [MID, 0],
      [SIZE, 0],
      [SIZE, MID],
      [STRIKE_END, MID],
      [STRIKE_END, STRIKE_START],
      [MID, STRIKE_START],
    ],
    labelX: SIZE - 30,
    labelY: 20,
    valueX: SIZE - CELL * 0.75,
    valueY: CELL * 0.72,
  },
  {
    zone: 13,
    path: [
      [0, MID],
      [STRIKE_START, MID],
      [STRIKE_START, STRIKE_END],
      [MID, STRIKE_END],
      [MID, SIZE],
      [0, SIZE],
    ],
    labelX: 12,
    labelY: SIZE - 12,
    valueX: CELL * 0.75,
    valueY: SIZE - CELL * 0.65,
  },
  {
    zone: 14,
    path: [
      [STRIKE_END, MID],
      [SIZE, MID],
      [SIZE, SIZE],
      [MID, SIZE],
      [MID, STRIKE_END],
      [STRIKE_END, STRIKE_END],
    ],
    labelX: SIZE - 34,
    labelY: SIZE - 12,
    valueX: SIZE - CELL * 0.75,
    valueY: SIZE - CELL * 0.65,
  },
]
const STRIKE_ZONE = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]

const ZONE_CELLS = [
  ...STRIKE_ZONE.flatMap((row, ri) =>
    row.map((zone, ci) => ({
      zone,
      x: STRIKE_START + ci * CELL,
      y: STRIKE_START + ri * CELL,
      width: CELL,
      height: CELL,
    }))
  ),
]

const METRICS = [
  { key: 'out', label: 'Out%', color: '88,166,255', help: 'Out rate by zone.' },
  { key: 'foul', label: 'Foul%', color: '227,179,65', help: 'Foul rate by zone.' },
  { key: 'whiff', label: 'Whiff%', color: '255,107,107', help: 'Misses divided by swings.' },
]

function computeZoneChase(zoneData) {
  if (!zoneData) return { zonePct: null, chasePct: null }

  let inZoneTotal = 0
  let allTotal = 0
  let chaseSwings = 0
  let chaseTotal = 0

  const STRIKE_ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const CHASE_ZONES = [11, 12, 13, 14]

  ;[...STRIKE_ZONES, ...CHASE_ZONES].forEach(z => {
    const d = zoneData[z]
    if (!d) return
    allTotal += d.total
    if (STRIKE_ZONES.includes(z)) inZoneTotal += d.total
    if (CHASE_ZONES.includes(z)) {
      chaseTotal += d.total
      chaseSwings += d.swinging_strike + d.foul + d.in_play_out + d.in_play_hit
    }
  })

  return {
    zonePct: allTotal > 0 ? +((inZoneTotal / allTotal) * 100).toFixed(1) : null,
    chasePct: chaseTotal > 0 ? +((chaseSwings / chaseTotal) * 100).toFixed(1) : null,
  }
}

export default function ZoneHeatmap({ zoneData, setName, setColor }) {
  const [metric, setMetric] = useState('out')
  const [tooltip, setTooltip] = useState(null)
  const metricConfig = METRICS.find(m => m.key === metric)
  const { zonePct, chasePct } = computeZoneChase(zoneData)

  const getValue = (zone) => {
    const d = zoneData?.[zone]
    if (!d) return 0
    if (metric === 'out') return d.outRate
    if (metric === 'foul') return d.foulRate
    if (metric === 'whiff') return d.whiffRate
    return 0
  }

  const getDisplayText = (zone) => {
    const d = zoneData?.[zone]
    if (!d || d.total === 0) return { main: '—', sub: '' }
    const swings = d.swinging_strike + d.foul + d.in_play_out + d.in_play_hit
    if (metric === 'out') return { main: `${(d.outRate * 100).toFixed(0)}%`, sub: `n=${d.total}` }
    if (metric === 'foul') return { main: `${(d.foulRate * 100).toFixed(0)}%`, sub: `n=${d.total}` }
    if (metric === 'whiff') return { main: `${(d.whiffRate * 100).toFixed(0)}%`, sub: `sw=${swings}` }
    return { main: '—', sub: '' }
  }

  const getCellBg = (zone) => {
    const v = Math.max(0, Math.min(1, getValue(zone)))
    return `rgba(${metricConfig.color}, ${v * 0.85 + 0.05})`
  }

  const getCellTextColor = (zone) => getValue(zone) > 0.55 ? '#0d1117' : '#e6edf3'
  const pathD = (points) => `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')} Z`

  const width = SIZE
  const height = SIZE
  const zoneX = STRIKE_START
  const zoneY = STRIKE_START
  const zoneWidth = STRIKE_SIZE
  const zoneHeight = STRIKE_SIZE

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {setName && setColor && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: setColor }} />
          )}
          <Text style={{
            color: '#e6edf3', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            Strike Zone {setName ? `· ${setName}` : ''}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {METRICS.map(m => (
            <Tooltip key={m.key} title={m.help} placement="top">
              <button
                onClick={() => setMetric(m.key)}
                style={{
                  padding: '3px 10px', borderRadius: 4,
                  border: `1px solid ${metric === m.key ? `rgba(${m.color},1)` : '#30363d'}`,
                  background: metric === m.key ? `rgba(${m.color},0.2)` : 'transparent',
                  color: metric === m.key ? `rgb(${m.color})` : '#484f58',
                  cursor: 'help', fontSize: 11,
                  fontWeight: metric === m.key ? 700 : 400,
                  letterSpacing: '0.05em',
                }}
              >
                {m.label}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ borderRadius: 4, overflow: 'hidden' }}>
          <rect width={width} height={height} fill="#0d1117" />
          {OUTER_CELLS.map(({ zone, path, labelX, labelY, valueX, valueY }) => {
            const { main, sub } = getDisplayText(zone)
            const textCol = getCellTextColor(zone)
            return (
              <g key={zone}
                onMouseMove={(e) => sub && setTooltip({ text: sub, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <path d={pathD(path)} fill={getCellBg(zone)} />
                <text x={labelX} y={labelY} textAnchor="start"
                  fontSize={10} fill={textCol} opacity={0.4}
                  fontFamily="JetBrains Mono, monospace" fontWeight="700">
                  {zone}
                </text>
                <text x={valueX} y={valueY} textAnchor="middle"
                  dominantBaseline="middle" fontSize={13} fontWeight="800"
                  fill={textCol} fontFamily="JetBrains Mono, monospace">
                  {main}
                </text>
              </g>
            )
          })}
          <line x1={MID} y1={0} x2={MID} y2={STRIKE_START} stroke="#30363d" strokeWidth={1.5} />
          <line x1={MID} y1={STRIKE_END} x2={MID} y2={height} stroke="#30363d" strokeWidth={1.5} />
          <line x1={0} y1={MID} x2={STRIKE_START} y2={MID} stroke="#30363d" strokeWidth={1.5} />
          <line x1={STRIKE_END} y1={MID} x2={width} y2={MID} stroke="#30363d" strokeWidth={1.5} />
          {ZONE_CELLS.map(({ zone, x, y, width: cellWidth, height: cellHeight }) => {
            const { main, sub } = getDisplayText(zone)
            const textCol = getCellTextColor(zone)
            return (
              <g key={zone}
                onMouseMove={(e) => sub && setTooltip({ text: sub, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <rect x={x} y={y} width={cellWidth} height={cellHeight} fill={getCellBg(zone)} />
                <text x={x + 10} y={y + 16} textAnchor="start"
                  fontSize={10} fill={textCol} opacity={0.4}
                  fontFamily="JetBrains Mono, monospace" fontWeight="700">
                  {zone}
                </text>
                <text x={x + cellWidth / 2} y={y + cellHeight / 2} textAnchor="middle"
                  dominantBaseline="middle" fontSize={22} fontWeight="800"
                  fill={textCol} fontFamily="JetBrains Mono, monospace">
                  {main}
                </text>
              </g>
            )
          })}
          <rect x={zoneX} y={zoneY} width={zoneWidth} height={zoneHeight} fill="none" stroke="#30363d" strokeWidth={2} />
          <line x1={STRIKE_START + CELL} y1={STRIKE_START} x2={STRIKE_START + CELL} y2={STRIKE_END} stroke="#21262d" strokeWidth={1.5} />
          <line x1={STRIKE_START + CELL * 2} y1={STRIKE_START} x2={STRIKE_START + CELL * 2} y2={STRIKE_END} stroke="#21262d" strokeWidth={1.5} />
          <line x1={STRIKE_START} y1={STRIKE_START + CELL} x2={STRIKE_END} y2={STRIKE_START + CELL} stroke="#21262d" strokeWidth={1.5} />
          <line x1={STRIKE_START} y1={STRIKE_START + CELL * 2} x2={STRIKE_END} y2={STRIKE_START + CELL * 2} stroke="#21262d" strokeWidth={1.5} />
          <rect x={0} y={0} width={width} height={height} fill="none" stroke="#30363d" strokeWidth={2} />
        </svg>
      </div>

      {(zonePct !== null || chasePct !== null) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Tooltip title="Pitches thrown inside the strike zone (zones 1–9) as a percentage of all pitches." placement="top">
            <div style={{
              flex: 1, background: '#0d1117', border: '1px solid #21262d',
              borderRadius: 6, padding: '6px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'help',
            }}>
              <Text style={{ fontSize: 10, color: '#484f58', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Zone%
              </Text>
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#e3b341', fontFamily: 'JetBrains Mono, monospace' }}>
                {zonePct !== null ? `${zonePct}%` : '—'}
              </Text>
            </div>
          </Tooltip>
          <Tooltip title="Rate at which batters swing at pitches outside the strike zone (zones 11–14)." placement="top">
            <div style={{
              flex: 1, background: '#0d1117', border: '1px solid #21262d',
              borderRadius: 6, padding: '6px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'help',
            }}>
              <Text style={{ fontSize: 10, color: '#484f58', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Chase%
              </Text>
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#ff7b72', fontFamily: 'JetBrains Mono, monospace' }}>
                {chasePct !== null ? `${chasePct}%` : '—'}
              </Text>
            </div>
          </Tooltip>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <Text style={{ fontSize: 10, color: '#484f58' }}>Low</Text>
        <div style={{
          width: 80, height: 6, borderRadius: 3,
          background: `linear-gradient(to right, rgba(${metricConfig.color},0.05), rgba(${metricConfig.color},0.9))`,
        }} />
        <Text style={{ fontSize: 10, color: '#484f58' }}>High</Text>
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 32,
          background: '#1f2937', border: '1px solid #374151', borderRadius: 4,
          padding: '4px 10px', fontSize: 11, color: '#e6edf3',
          pointerEvents: 'none', zIndex: 9999,
          fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
