import { Typography } from 'antd'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const { Text } = Typography

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

export default function NextPitchMap({ data, filters }) {
  const topCombos = data?.topCombos || []
  const total = Number(data?.total || 0)
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
        <div className="next-pitch-combos next-pitch-combos-only">
          <Text className="next-pitch-list-title">Top pitch-zone combinations</Text>
          <div className="next-pitch-combo-list">
            {topCombos.slice(0, 8).map((item, index) => (
              <div key={`${item.zone}-${item.pitchType}`} className="next-pitch-combo-row">
                <span>{index + 1}</span>
                <b style={{ color: pitchTypeColor(item.pitchType) }}>{pitchTypeLabel(item.pitchType)}</b>
                <em>Zone {item.zone}</em>
                <strong>{pct(item.overallPct)}%</strong>
              </div>
            ))}
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
