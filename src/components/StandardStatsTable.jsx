const sumBy = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)

const avg = (sum, count) => (count > 0 ? sum / count : null)

const formatRate = value => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return Number(value).toFixed(3).replace(/^0/, '')
}

const formatNumber = value => (
  value === null || value === undefined || Number.isNaN(value) ? '-' : Number(value).toLocaleString()
)

const formatCell = column => {
  if (column.innings) return formatInnings(column.value)
  if (column.fixed2) return column.value === null || column.value === undefined || Number.isNaN(Number(column.value)) ? '-' : Number(column.value).toFixed(2)
  if (column.rate) return formatRate(column.value)
  return formatNumber(column.value)
}

const formatInnings = outs => {
  if (!outs) return '-'
  const fullInnings = Math.floor(outs / 3)
  const remainder = outs % 3
  return `${fullInnings}.${remainder}`
}

const pitchingValue = (standardStats, fallbackStats, key) => (
  standardStats?.source ? standardStats[key] : fallbackStats[key]
)

const buildStandardStats = rows => {
  const pa = sumBy(rows, 'pa')
  const ab = sumBy(rows, 'ab')
  const h = sumBy(rows, 'h')
  const singles = sumBy(rows, 'singles')
  const doubles = sumBy(rows, 'doubles')
  const triples = sumBy(rows, 'triples')
  const hr = sumBy(rows, 'hr')
  const bb = sumBy(rows, 'bb')
  const hbp = sumBy(rows, 'hbp')
  const outs = sumBy(rows, 'outs')
  const runs = sumBy(rows, 'runs')
  const totalBases = rows.some(row => row.totalBases !== undefined)
    ? sumBy(rows, 'totalBases')
    : singles + doubles * 2 + triples * 3 + hr * 4
  const obpDenominator = ab + bb + hbp
  const avgValue = avg(h, ab)
  const obp = avg(h + bb + hbp, obpDenominator)
  const slg = avg(totalBases, ab)

  return {
    pa,
    ab,
    h,
    singles,
    doubles,
    triples,
    hr,
    bb,
    hbp,
    outs,
    runs,
    so: sumBy(rows, 'so'),
    avg: avgValue,
    obp,
    slg,
    ops: obp !== null && slg !== null ? obp + slg : null,
    whip: outs > 0 ? ((bb + h) / (outs / 3)) : null,
  }
}

export default function StandardStatsTable({ data = [], filters = {}, standardStats = null }) {
  const hasData = data.length > 0
  const stats = buildStandardStats(data)
  const isPitcherView = Array.isArray(filters.pitcherIds) && filters.pitcherIds.length > 0 && !filters.batterId
  const firstCountLabel = isPitcherView ? 'BF' : 'PA'
  const title = isPitcherView ? 'Standard Pitching Statistics' : 'Standard Batting Statistics'
  const columns = isPitcherView ? [
    { key: 'sample', label: firstCountLabel, value: standardStats?.bf ?? stats.pa },
    { key: 'w', label: 'W', value: standardStats?.w },
    { key: 'l', label: 'L', value: standardStats?.l },
    { key: 'era', label: 'ERA', value: standardStats?.era, fixed2: true },
    { key: 'g', label: 'G', value: standardStats?.g ?? standardStats?.games },
    { key: 'gs', label: 'GS', value: standardStats?.gs },
    { key: 'sv', label: 'SV', value: standardStats?.sv },
    { key: 'ip', label: 'IP', value: standardStats?.ip ?? stats.outs, innings: !standardStats?.ip },
    { key: 'h', label: 'H', value: pitchingValue(standardStats, stats, 'h') },
    { key: 'r', label: 'R', value: pitchingValue(standardStats, stats, 'r') ?? stats.runs },
    { key: 'er', label: 'ER', value: standardStats?.er },
    { key: 'hr', label: 'HR', value: pitchingValue(standardStats, stats, 'hr') },
    { key: 'bb', label: 'BB', value: pitchingValue(standardStats, stats, 'bb') },
    { key: 'so', label: 'SO', value: pitchingValue(standardStats, stats, 'so') },
    { key: 'whip', label: 'WHIP', value: standardStats?.whip ?? stats.whip, fixed2: true },
  ] : [
    { key: 'sample', label: firstCountLabel, value: stats.pa },
    { key: 'ab', label: 'AB', value: stats.ab },
    { key: 'h', label: 'H', value: stats.h },
    { key: 'singles', label: '1B', value: stats.singles },
    { key: 'doubles', label: '2B', value: stats.doubles },
    { key: 'triples', label: '3B', value: stats.triples },
    { key: 'hr', label: 'HR', value: stats.hr },
    { key: 'bb', label: 'BB', value: stats.bb },
    { key: 'so', label: 'SO', value: stats.so },
    { key: 'hbp', label: 'HBP', value: stats.hbp },
    { key: 'avg', label: 'AVG', value: stats.avg, rate: true },
    { key: 'obp', label: 'OBP', value: stats.obp, rate: true },
    { key: 'slg', label: 'SLG', value: stats.slg, rate: true },
    { key: 'ops', label: 'OPS', value: stats.ops, rate: true },
  ]

  return (
    <section className="analysis-card standard-stats-card">
      <div className="analysis-heading">
        <div>
          <h2>{title}</h2>
          <p>Basic outcome totals for the active filters.</p>
        </div>
      </div>
      {hasData ? (
        <div className="standard-stats-table-wrap">
          <table className="standard-stats-table">
            <thead>
              <tr>
                <th>Split</th>
                {columns.map(column => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total</td>
                {columns.map(column => (
                  <td key={column.key}>{formatCell(column)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="analysis-empty-state">
          Select a pitcher or batter to view standard statistics.
        </div>
      )}
    </section>
  )
}
