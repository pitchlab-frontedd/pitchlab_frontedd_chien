import { Table, Tooltip } from 'antd'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const METRIC_HELP = {
  'Pitch Type': 'Pitch category.',
  '#': 'Total pitches.',
  'vs RHB': 'Pitches vs right-handed batters.',
  'vs LHB': 'Pitches vs left-handed batters.',
  'EMP xRUNS': 'Average expected runs added per pitch from the batting team perspective.',
  WPA: 'Average win probability change.',
  '%': 'Pitch usage rate.',
  MPH: 'Average pitch speed.',
  PA: 'Plate appearances.',
  AB: 'At-bats.',
  H: 'Hits allowed.',
  '1B': 'Singles allowed.',
  '2B': 'Doubles allowed.',
  '3B': 'Triples allowed.',
  HR: 'Home runs allowed.',
  SO: 'Strikeouts.',
  BB: 'Walks allowed.',
  BA: 'Batting average allowed.',
  SLG: 'Slugging allowed.',
  wOBA: 'Weighted on-base average.',
  'Whiff%': 'Misses divided by swings.',
  'PutAway%': 'Strikeouts on two-strike pitches.',
}

const metricTitle = (label, help = METRIC_HELP[label]) => (
  <Tooltip title={help} placement="top">
    <span style={{ cursor: 'help' }}>{label}</span>
  </Tooltip>
)

const hasPitcherFilter = filters => Array.isArray(filters?.pitcherIds) && filters.pitcherIds.length > 0
const hasBatterFilter = filters => Boolean(filters?.batterId)

const getMetricHelp = (filters, outcomeData) => {
  const hasPitcher = hasPitcherFilter(filters)
  const hasBatter = hasBatterFilter(filters)
  const wpaPerspective = outcomeData?.wpaPerspective || (hasBatter ? 'batter' : hasPitcher ? 'pitcher' : 'batter')
  const wpaSide = wpaPerspective === 'pitcher' ? 'selected pitcher' : 'selected batter'
  const wpaDirection = wpaPerspective === 'pitcher'
    ? 'Positive helps the pitcher; negative helps the batting team.'
    : 'Positive helps the batter; negative helps the pitcher/defense.'
  const sample = hasPitcher && hasBatter
    ? `For the selected pitcher-vs-batter matchup, WPA is shown from the ${wpaSide} side.`
    : hasPitcher
      ? 'With a pitcher selected, WPA is shown from the pitcher side.'
      : hasBatter
        ? 'With a batter selected, WPA is shown from the batter side.'
        : 'With no player selected, WPA defaults to the batter side.'

  return {
    ...METRIC_HELP,
    'EMP xRUNS': 'Always batting-team perspective. Positive means the offense added expected runs; negative means the pitcher/defense prevented expected runs.',
    WPA: `${sample} ${wpaDirection}`,
  }
}

const dash = value => (value === null || value === undefined || Number.isNaN(value) ? '-' : value)
const pct = value => (value === null || value === undefined ? '-' : Number(value).toFixed(1))
const oneDecimal = value => (value === null || value === undefined ? '-' : Number(value).toFixed(1))
const rate = value => {
  if (value === null || value === undefined) return '-'
  const fixed = Number(value).toFixed(3)
  return fixed.replace(/^0/, '')
}

const numericCell = value => (
  <span className="tracking-number">{dash(value)}</span>
)

const rateCell = value => (
  <span className="tracking-number">{rate(value)}</span>
)

const pctCell = value => (
  <span className="tracking-number">{pct(value)}</span>
)

const signedPctCell = value => {
  if (value === null || value === undefined) return <span className="tracking-number">-</span>
  const numeric = Number(value)
  return (
    <span className="tracking-number" style={{ color: numeric >= 0 ? '#3fb950' : '#ff6b6b' }}>
      {`${numeric > 0 ? '+' : ''}${numeric}%`}
    </span>
  )
}

const runValueCell = value => {
  if (value === null || value === undefined) return <span className="tracking-number">-</span>
  const numeric = Number(value)
  return (
    <span className="tracking-number" style={{ color: numeric > 0 ? '#ff6b6b' : '#3fb950' }}>
      {numeric.toFixed(3)}
    </span>
  )
}

const signedPctText = value => {
  if (value === null || value === undefined) return '-'
  const numeric = Number(value)
  return `${numeric > 0 ? '+' : ''}${numeric}%`
}

const runValueText = value => {
  if (value === null || value === undefined) return '-'
  return Number(value).toFixed(3)
}

const sumBy = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)

const weightedAverage = (rows, valueKey, weightKey = 'count', digits = 1) => {
  const weighted = rows.reduce((sum, row) => {
    const value = Number(row[valueKey])
    const weight = Number(row[weightKey] || 0)
    return Number.isFinite(value) ? sum + value * weight : sum
  }, 0)
  const totalWeight = rows.reduce((sum, row) => {
    const value = Number(row[valueKey])
    const weight = Number(row[weightKey] || 0)
    return Number.isFinite(value) ? sum + weight : sum
  }, 0)
  return totalWeight > 0 ? +(weighted / totalWeight).toFixed(digits) : null
}

const averageFrom = (sum, count, digits = 3) => (
  count > 0 ? +(sum / count).toFixed(digits) : null
)

const buildTotalRow = rows => {
  const count = sumBy(rows, 'count')
  const ab = sumBy(rows, 'ab')
  const h = sumBy(rows, 'h')
  const singles = sumBy(rows, 'singles')
  const doubles = sumBy(rows, 'doubles')
  const triples = sumBy(rows, 'triples')
  const hr = sumBy(rows, 'hr')
  const totalBases = rows.some(row => row.totalBases !== undefined)
    ? sumBy(rows, 'totalBases')
    : singles + doubles * 2 + triples * 3 + hr * 4
  const wobaNumerator = sumBy(rows, 'wobaNumerator')
  const wobaDenominator = sumBy(rows, 'wobaDenominator')
  const swingAttempts = sumBy(rows, 'swingAttempts')
  const swingingStrikes = sumBy(rows, 'swingingStrikes')
  const twoStrikePitches = sumBy(rows, 'twoStrikePitches')
  const putAway = sumBy(rows, 'putAway')

  return {
    pitchType: 'Total',
    count,
    rhb: sumBy(rows, 'rhb') || null,
    lhb: sumBy(rows, 'lhb') || null,
    expectedRuns: weightedAverage(rows, 'expectedRuns', 'count', 3),
    winProbChange: weightedAverage(rows, 'winProbChange', 'count', 2),
    pct: count > 0 ? 100 : null,
    mph: weightedAverage(rows, 'mph', 'count', 1),
    pa: sumBy(rows, 'pa'),
    ab,
    h,
    singles,
    doubles,
    triples,
    hr,
    so: sumBy(rows, 'so'),
    bb: sumBy(rows, 'bb'),
    ba: averageFrom(h, ab, 3),
    slg: averageFrom(totalBases, ab, 3),
    woba: averageFrom(wobaNumerator, wobaDenominator, 3),
    whiffPct: swingAttempts > 0 ? +((swingingStrikes / swingAttempts) * 100).toFixed(1) : null,
    putAwayPct: twoStrikePitches > 0 ? +((putAway / twoStrikePitches) * 100).toFixed(1) : null,
  }
}

const right = {
  align: 'right',
}

const buildColumns = metricHelp => [
  {
    title: metricTitle('Pitch Type', metricHelp['Pitch Type']),
    dataIndex: 'pitchType',
    align: 'left',
    width: 132,
    render: pt => pt === 'Total' ? (
      <span className="tracking-pitch-type tracking-total-label">Total</span>
    ) : (
      <span
        className="tracking-pitch-type"
        style={{ color: pitchTypeColor(pt) }}
      >
        {pitchTypeLabel(pt)}
      </span>
    ),
  },
  {
    title: metricTitle('#', metricHelp['#']),
    dataIndex: 'count',
    sorter: (a, b) => a.count - b.count,
    defaultSortOrder: 'descend',
    width: 64,
    render: numericCell,
    ...right,
  },
  { title: metricTitle('vs RHB', metricHelp['vs RHB']), dataIndex: 'rhb', sorter: (a, b) => (a.rhb || 0) - (b.rhb || 0), width: 82, render: numericCell, ...right },
  { title: metricTitle('vs LHB', metricHelp['vs LHB']), dataIndex: 'lhb', sorter: (a, b) => (a.lhb || 0) - (b.lhb || 0), width: 82, render: numericCell, ...right },
  { title: metricTitle('EMP xRUNS', metricHelp['EMP xRUNS']), dataIndex: 'expectedRuns', sorter: (a, b) => (a.expectedRuns || 0) - (b.expectedRuns || 0), width: 104, render: runValueCell, ...right },
  { title: metricTitle('WPA', metricHelp.WPA), dataIndex: 'winProbChange', sorter: (a, b) => (a.winProbChange || 0) - (b.winProbChange || 0), width: 82, render: signedPctCell, ...right },
  { title: metricTitle('%', metricHelp['%']), dataIndex: 'pct', sorter: (a, b) => a.pct - b.pct, width: 62, render: pctCell, ...right },
  { title: metricTitle('MPH', metricHelp.MPH), dataIndex: 'mph', sorter: (a, b) => (a.mph || 0) - (b.mph || 0), width: 66, render: value => <span className="tracking-number">{oneDecimal(value)}</span>, ...right },
  { title: metricTitle('PA', metricHelp.PA), dataIndex: 'pa', sorter: (a, b) => (a.pa || 0) - (b.pa || 0), width: 56, render: numericCell, ...right },
  { title: metricTitle('AB', metricHelp.AB), dataIndex: 'ab', sorter: (a, b) => (a.ab || 0) - (b.ab || 0), width: 56, render: numericCell, ...right },
  { title: metricTitle('H', metricHelp.H), dataIndex: 'h', sorter: (a, b) => (a.h || 0) - (b.h || 0), width: 48, render: numericCell, ...right },
  { title: metricTitle('1B', metricHelp['1B']), dataIndex: 'singles', sorter: (a, b) => (a.singles || 0) - (b.singles || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('2B', metricHelp['2B']), dataIndex: 'doubles', sorter: (a, b) => (a.doubles || 0) - (b.doubles || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('3B', metricHelp['3B']), dataIndex: 'triples', sorter: (a, b) => (a.triples || 0) - (b.triples || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('HR', metricHelp.HR), dataIndex: 'hr', sorter: (a, b) => (a.hr || 0) - (b.hr || 0), width: 52, render: numericCell, ...right },
  { title: metricTitle('SO', metricHelp.SO), dataIndex: 'so', sorter: (a, b) => (a.so || 0) - (b.so || 0), width: 52, render: numericCell, ...right },
  { title: metricTitle('BB', metricHelp.BB), dataIndex: 'bb', sorter: (a, b) => (a.bb || 0) - (b.bb || 0), width: 52, render: numericCell, ...right },
  { title: metricTitle('BA', metricHelp.BA), dataIndex: 'ba', sorter: (a, b) => (a.ba || 0) - (b.ba || 0), width: 64, render: rateCell, ...right },
  { title: metricTitle('SLG', metricHelp.SLG), dataIndex: 'slg', sorter: (a, b) => (a.slg || 0) - (b.slg || 0), width: 68, render: rateCell, ...right },
  { title: metricTitle('wOBA', metricHelp.wOBA), dataIndex: 'woba', sorter: (a, b) => (a.woba || 0) - (b.woba || 0), width: 76, render: rateCell, ...right },
  { title: metricTitle('Whiff%', metricHelp['Whiff%']), dataIndex: 'whiffPct', sorter: (a, b) => a.whiffPct - b.whiffPct, width: 82, render: pctCell, ...right },
  { title: metricTitle('PutAway%', metricHelp['PutAway%']), dataIndex: 'putAwayPct', sorter: (a, b) => (a.putAwayPct || 0) - (b.putAwayPct || 0), width: 96, render: pctCell, ...right },
]

export default function PitchTypeTable({ data, outcomeData, filters }) {
  const metricHelp = getMetricHelp(filters, outcomeData)
  const columns = buildColumns(metricHelp)
  const outcomeByPitchType = new Map((outcomeData?.pitchTypeOutcomes || []).map(item => [item.pitchType, item]))
  const rows = (data || []).map(row => {
    const outcome = outcomeByPitchType.get(row.pitchType)
    if (!outcome) return row
    return {
      ...row,
      expectedRuns: outcome.expectedRuns,
      winProbChange: outcome.winProbChange,
    }
  })
  const hasData = rows.length > 0
  const totalRow = hasData ? buildTotalRow(rows) : null
  const summaryCell = (column, index) => {
    const value = totalRow?.[column.dataIndex]
    const content = column.render ? column.render(value, totalRow, index) : value
    return (
      <Table.Summary.Cell key={column.dataIndex || index} index={index} align={column.align}>
        {content}
      </Table.Summary.Cell>
    )
  }

  return (
    <section className="analysis-card">
      <div className="analysis-heading">
        <div>
          <h2>Pitch Tracking</h2>
          <p>Pitch mix and outcome profile for the active filters.</p>
        </div>
      </div>
      {hasData ? (
        <>
          <Table
            className="analysis-table pitch-tracking-table"
            dataSource={rows}
            columns={columns}
            rowKey="pitchType"
            pagination={false}
            size="small"
            scroll={{ x: 1510 }}
            showSorterTooltip={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row className="pitch-tracking-total-row">
                  {columns.map(summaryCell)}
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
          <div className="pitch-tracking-mobile-list">
            {[...rows, totalRow].map(row => {
              const wpa = Number(row.winProbChange || 0)
              const xRuns = Number(row.expectedRuns || 0)
              return (
                <article key={row.pitchType} className="pitch-mobile-card">
                  <div className="pitch-mobile-card-head">
                    <span
                      className="tracking-pitch-type"
                      style={{ color: pitchTypeColor(row.pitchType) }}
                    >
                      {pitchTypeLabel(row.pitchType)}
                    </span>
                    <span className="pitch-mobile-usage">{pct(row.pct)}%</span>
                  </div>
                  <div className="pitch-mobile-metrics">
                    <div>
                      <span>#</span>
                      <b>{dash(row.count)}</b>
                    </div>
                    <div>
                      <span>EMP xRUNS</span>
                      <b style={{ color: xRuns > 0 ? '#ff6b6b' : '#3fb950' }}>{runValueText(row.expectedRuns)}</b>
                    </div>
                    <div>
                      <span>WPA</span>
                      <b style={{ color: wpa >= 0 ? '#3fb950' : '#ff6b6b' }}>{signedPctText(row.winProbChange)}</b>
                    </div>
                    <div>
                      <span>MPH</span>
                      <b>{oneDecimal(row.mph)}</b>
                    </div>
                    <div>
                      <span>Whiff</span>
                      <b>{pct(row.whiffPct)}%</b>
                    </div>
                    <div>
                      <span>PutAway</span>
                      <b>{pct(row.putAwayPct)}%</b>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="analysis-empty-state">
          Select a pitcher or batter to view pitch tracking.
        </div>
      )}
    </section>
  )
}
