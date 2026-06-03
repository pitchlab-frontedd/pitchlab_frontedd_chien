import { Table, Tooltip } from 'antd'

const PITCH_TYPE_LABELS = {
  FF: 'Four Seamer',
  SI: 'Sinker',
  SL: 'Slider',
  CH: 'Changeup',
  CU: 'Curveball',
  FC: 'Cutter',
  ST: 'Sweeper',
  FS: 'Splitter',
}

const PITCH_TYPE_COLORS = {
  FF: '#ff5c7a',
  SI: '#fb923c',
  SL: '#4ade80',
  CH: '#22c55e',
  CU: '#22d3ee',
  FC: '#a78bfa',
  ST: '#f59e0b',
  FS: '#38bdf8',
}

const METRIC_HELP = {
  'Pitch Type': 'Pitch type in the selected filters. Year is controlled from the left filter panel.',
  '#': 'Total pitches of this pitch type.',
  '# RHB': 'Pitches to right-handed batters. Shows a dash when handedness is unavailable.',
  '# LHB': 'Pitches to left-handed batters. Shows a dash when handedness is unavailable.',
  '%': 'Usage rate: this pitch type divided by all selected pitches.',
  MPH: 'Average release speed.',
  PA: 'Plate appearances ending on this pitch type.',
  AB: 'At-bats ending on this pitch type.',
  H: 'Hits ending on this pitch type.',
  '1B': 'Singles ending on this pitch type.',
  '2B': 'Doubles ending on this pitch type.',
  '3B': 'Triples ending on this pitch type.',
  HR: 'Home runs ending on this pitch type.',
  SO: 'Strikeouts ending on this pitch type.',
  BBE: 'Batted balls ending on this pitch type.',
  BA: 'Batting average allowed on plate appearances ending with this pitch type.',
  SLG: 'Slugging percentage allowed on plate appearances ending with this pitch type.',
  wOBA: 'Estimated wOBA from event weights for plate appearances ending with this pitch type.',
  'Whiff%': 'Swinging strikes divided by swings, not total pitches.',
  'PutAway%': 'Strikeouts divided by two-strike pitches of this pitch type.',
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

const columns = [
  {
    title: metricTitle('Pitch Type'),
    dataIndex: 'pitchType',
    width: 132,
    render: pt => (
      <span
        className="tracking-pitch-type"
        style={{ color: PITCH_TYPE_COLORS[pt] || '#cbd5e1' }}
      >
        {PITCH_TYPE_LABELS[pt] || pt}
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
  },
  { title: metricTitle('# RHB'), dataIndex: 'rhb', sorter: (a, b) => (a.rhb || 0) - (b.rhb || 0), width: 74, render: numericCell },
  { title: metricTitle('# LHB'), dataIndex: 'lhb', sorter: (a, b) => (a.lhb || 0) - (b.lhb || 0), width: 74, render: numericCell },
  { title: metricTitle('%'), dataIndex: 'pct', sorter: (a, b) => a.pct - b.pct, width: 62, render: pctCell },
  { title: metricTitle('MPH'), dataIndex: 'mph', sorter: (a, b) => (a.mph || 0) - (b.mph || 0), width: 66, render: value => <span className="tracking-number">{oneDecimal(value)}</span> },
  { title: metricTitle('PA'), dataIndex: 'pa', sorter: (a, b) => (a.pa || 0) - (b.pa || 0), width: 56, render: numericCell },
  { title: metricTitle('AB'), dataIndex: 'ab', sorter: (a, b) => (a.ab || 0) - (b.ab || 0), width: 56, render: numericCell },
  { title: metricTitle('H'), dataIndex: 'h', sorter: (a, b) => (a.h || 0) - (b.h || 0), width: 48, render: numericCell },
  { title: metricTitle('1B'), dataIndex: 'singles', sorter: (a, b) => (a.singles || 0) - (b.singles || 0), width: 50, render: numericCell },
  { title: metricTitle('2B'), dataIndex: 'doubles', sorter: (a, b) => (a.doubles || 0) - (b.doubles || 0), width: 50, render: numericCell },
  { title: metricTitle('3B'), dataIndex: 'triples', sorter: (a, b) => (a.triples || 0) - (b.triples || 0), width: 50, render: numericCell },
  { title: metricTitle('HR'), dataIndex: 'hr', sorter: (a, b) => (a.hr || 0) - (b.hr || 0), width: 52, render: numericCell },
  { title: metricTitle('SO'), dataIndex: 'so', sorter: (a, b) => (a.so || 0) - (b.so || 0), width: 52, render: numericCell },
  { title: metricTitle('BBE'), dataIndex: 'bbe', sorter: (a, b) => (a.bbe || 0) - (b.bbe || 0), width: 60, render: numericCell },
  { title: metricTitle('BA'), dataIndex: 'ba', sorter: (a, b) => (a.ba || 0) - (b.ba || 0), width: 64, render: rateCell },
  { title: metricTitle('SLG'), dataIndex: 'slg', sorter: (a, b) => (a.slg || 0) - (b.slg || 0), width: 68, render: rateCell },
  { title: metricTitle('wOBA'), dataIndex: 'woba', sorter: (a, b) => (a.woba || 0) - (b.woba || 0), width: 76, render: rateCell },
  { title: metricTitle('Whiff%'), dataIndex: 'whiffPct', sorter: (a, b) => a.whiffPct - b.whiffPct, width: 82, render: pctCell },
  { title: metricTitle('PutAway%'), dataIndex: 'putAwayPct', sorter: (a, b) => (a.putAwayPct || 0) - (b.putAwayPct || 0), width: 96, render: pctCell },
]

export default function PitchTypeTable({ data }) {
  const rows = data || []
  const hasData = rows.length > 0

  return (
    <section className="pitch-tracking-panel">
      <div className="tracking-heading">
        <div>
          <h2>Pitch Tracking</h2>
          <p>Pitch mix and outcome profile for the active filters.</p>
        </div>
      </div>
      {hasData ? (
        <Table
          className="pitch-tracking-table"
          dataSource={rows}
          columns={columns}
          rowKey="pitchType"
          pagination={false}
          size="small"
          scroll={{ x: 1320 }}
          showSorterTooltip={false}
        />
      ) : (
        <div className="tracking-empty-state">
          Select a pitcher or batter to view pitch tracking.
        </div>
      )}
    </section>
  )
}
