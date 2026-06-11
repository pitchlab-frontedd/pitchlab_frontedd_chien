import { Typography } from 'antd'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const { Text } = Typography

const ZONE_GRID = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]

const pct = value => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0.0'
  return Number(value).toFixed(1)
}

const describeCount = counts => {
  if (!Array.isArray(counts) || counts.length === 0) return 'All counts'
  if (counts.length === 1) {
    const [balls, strikes] = String(counts[0]).split('-')
    return `${balls || 0}-${strikes || 0} count`
  }
  return `${counts.length} selected counts`
}

function ZoneCell({ zone, data, maxZoneTotal }) {
  const topPitch = data?.topPitchType
  const zonePct = Number(data?.pct || 0)
  const topPct = Number(data?.topPitchTypePct || 0)
  const intensity = maxZoneTotal > 0 ? Math.max(0.08, Number(data?.total || 0) / maxZoneTotal) : 0.08
  const color = topPitch ? pitchTypeColor(topPitch) : '#465b78'

  return (
    <div
      className="next-pitch-zone-cell"
      style={{
        borderColor: topPitch ? color : '#334761',
        background: topPitch
          ? `linear-gradient(180deg, ${color}${Math.round(intensity * 70).toString(16).padStart(2, '0')}, rgba(17,28,43,0.95))`
          : '#111c2b',
      }}
    >
      <span className="next-pitch-zone-id">{zone}</span>
      <strong style={{ color: topPitch ? color : '#7f8da1' }}>
        {topPitch ? pitchTypeLabel(topPitch) : '-'}
      </strong>
      <b>{zonePct ? `${pct(zonePct)}%` : '-'}</b>
      <small>{topPitch ? `${pct(topPct)}% in zone` : 'no pitches'}</small>
    </div>
  )
}

export default function NextPitchMap({ data, filters }) {
  const zones = data?.zones || {}
  const topCombos = data?.topCombos || []
  const total = Number(data?.total || 0)
  const maxZoneTotal = Math.max(...Object.values(zones).map(zone => Number(zone?.total || 0)), 0)
  const hasData = total > 0

  return (
    <section className="analysis-card next-pitch-card">
      <div className="analysis-heading">
        <div>
          <h2>Next Pitch Tendencies</h2>
          <p>{describeCount(filters?.counts)} historical pitch-zone distribution for the active filters.</p>
        </div>
        {hasData && <span className="next-pitch-sample">n={total}</span>}
      </div>

      {hasData ? (
        <div className="next-pitch-layout">
          <div className="next-pitch-grid" aria-label="Next pitch zone distribution">
            {ZONE_GRID.flat().map(zone => (
              <ZoneCell
                key={zone}
                zone={zone}
                data={zones[zone]}
                maxZoneTotal={maxZoneTotal}
              />
            ))}
          </div>

          <div className="next-pitch-combos">
            <Text className="next-pitch-list-title">Top pitch-zone combinations</Text>
            <div className="next-pitch-combo-list">
              {topCombos.slice(0, 6).map((item, index) => (
                <div key={`${item.zone}-${item.pitchType}`} className="next-pitch-combo-row">
                  <span>{index + 1}</span>
                  <b style={{ color: pitchTypeColor(item.pitchType) }}>{pitchTypeLabel(item.pitchType)}</b>
                  <em>Zone {item.zone}</em>
                  <strong>{pct(item.overallPct)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="analysis-empty-state">
          Select a pitcher, batter, or count to view next pitch tendencies.
        </div>
      )}
    </section>
  )
}
