import { Table, Tooltip } from 'antd'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const METRIC_HELP = {
  'Pitch Type': 'Pitch category.',
  '#': 'Total pitches.',
  'vs RHB': 'Pitches vs right-handed batters.',
  'vs LHB': 'Pitches vs left-handed batters.',
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
  BBE: 'Batted balls.',
  BA: 'Batting average allowed.',
  SLG: 'Slugging allowed.',
  wOBA: 'Weighted on-base average.',
  'Whiff%': 'Misses divided by swings.',
  'PutAway%': 'Strikeouts on two-strike pitches.',
}

const metricTitle = (label) => (
  <Tooltip title={METRIC_HELP[label]} placement="top">
    <span style={{ cursor: 'help' }}>{label}</span>
  </Tooltip>
)

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

const right = {
  align: 'right',
}

const columns = [
  {
    title: metricTitle('Pitch Type'),
    dataIndex: 'pitchType',
    align: 'left',
    width: 132,
    render: pt => (
      <span
        className="tracking-pitch-type"
        style={{ color: pitchTypeColor(pt) }}
      >
        {pitchTypeLabel(pt)}
      </span>
    ),
  },
  {
    title: metricTitle('#'),
    dataIndex: 'count',
    sorter: (a, b) => a.count - b.count,
    defaultSortOrder: 'descend',
    width: 64,
    render: numericCell,
    ...right,
  },
  { title: metricTitle('vs RHB'), dataIndex: 'rhb', sorter: (a, b) => (a.rhb || 0) - (b.rhb || 0), width: 82, render: numericCell, ...right },
  { title: metricTitle('vs LHB'), dataIndex: 'lhb', sorter: (a, b) => (a.lhb || 0) - (b.lhb || 0), width: 82, render: numericCell, ...right },
  { title: metricTitle('%'), dataIndex: 'pct', sorter: (a, b) => a.pct - b.pct, width: 62, render: pctCell, ...right },
  { title: metricTitle('MPH'), dataIndex: 'mph', sorter: (a, b) => (a.mph || 0) - (b.mph || 0), width: 66, render: value => <span className="tracking-number">{oneDecimal(value)}</span>, ...right },
  { title: metricTitle('PA'), dataIndex: 'pa', sorter: (a, b) => (a.pa || 0) - (b.pa || 0), width: 56, render: numericCell, ...right },
  { title: metricTitle('AB'), dataIndex: 'ab', sorter: (a, b) => (a.ab || 0) - (b.ab || 0), width: 56, render: numericCell, ...right },
  { title: metricTitle('H'), dataIndex: 'h', sorter: (a, b) => (a.h || 0) - (b.h || 0), width: 48, render: numericCell, ...right },
  { title: metricTitle('1B'), dataIndex: 'singles', sorter: (a, b) => (a.singles || 0) - (b.singles || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('2B'), dataIndex: 'doubles', sorter: (a, b) => (a.doubles || 0) - (b.doubles || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('3B'), dataIndex: 'triples', sorter: (a, b) => (a.triples || 0) - (b.triples || 0), width: 50, render: numericCell, ...right },
  { title: metricTitle('HR'), dataIndex: 'hr', sorter: (a, b) => (a.hr || 0) - (b.hr || 0), width: 52, render: numericCell, ...right },
  { title: metricTitle('SO'), dataIndex: 'so', sorter: (a, b) => (a.so || 0) - (b.so || 0), width: 52, render: numericCell, ...right },
  { title: metricTitle('BBE'), dataIndex: 'bbe', sorter: (a, b) => (a.bbe || 0) - (b.bbe || 0), width: 60, render: numericCell, ...right },
  { title: metricTitle('BA'), dataIndex: 'ba', sorter: (a, b) => (a.ba || 0) - (b.ba || 0), width: 64, render: rateCell, ...right },
  { title: metricTitle('SLG'), dataIndex: 'slg', sorter: (a, b) => (a.slg || 0) - (b.slg || 0), width: 68, render: rateCell, ...right },
  { title: metricTitle('wOBA'), dataIndex: 'woba', sorter: (a, b) => (a.woba || 0) - (b.woba || 0), width: 76, render: rateCell, ...right },
  { title: metricTitle('Whiff%'), dataIndex: 'whiffPct', sorter: (a, b) => a.whiffPct - b.whiffPct, width: 82, render: pctCell, ...right },
  { title: metricTitle('PutAway%'), dataIndex: 'putAwayPct', sorter: (a, b) => (a.putAwayPct || 0) - (b.putAwayPct || 0), width: 96, render: pctCell, ...right },
]

export default function PitchTypeTable({ data }) {
  const rows = data || []
  const hasData = rows.length > 0

  return (
    <section className="analysis-card">
      <div className="analysis-heading">
        <div>
          <h2>Pitch Tracking</h2>
          <p>Pitch mix and outcome profile for the active filters.</p>
        </div>
      </div>
      {hasData ? (
        <Table
          className="analysis-table"
          dataSource={rows}
          columns={columns}
          rowKey="pitchType"
          pagination={false}
          size="small"
          scroll={{ x: 1320 }}
          showSorterTooltip={false}
        />
      ) : (
        <div className="analysis-empty-state">
          Select a pitcher or batter to view pitch tracking.
        </div>
      )}
    </section>
  )
}
