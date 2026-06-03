import { Table, Tooltip } from 'antd'

const OUTCOME_LABELS = {
  BB: 'Walk',
  HBP: 'Hit By Pitch',
  '1B': 'Single',
  '2B': 'Double',
  '3B': 'Triple',
  HR: 'Home Run',
  K: 'Strikeout',
  Out: 'Out',
  DP: 'Double Play',
  FC: 'Fielder Choice',
  ROE: 'Reached on Error',
  Ball: 'Ball',
  'Called Strike': 'Called Strike',
  'Swinging Strike': 'Swinging Strike',
  Foul: 'Foul',
  'In Play': 'In Play',
  Other: 'Other',
}

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

const IMPORTANT_OUTCOMES = ['BB', 'HBP', '1B', '2B', '3B', 'HR', 'K', 'Out', 'DP', 'FC', 'ROE']

const numberText = (value, color) => (
  <span className="tracking-number" style={color ? { color } : undefined}>{value}</span>
)

const METRIC_HELP = {
  'Pitch Type': 'Pitch category.',
  '#': 'Total pitches.',
  'EMP xRUNS': 'Average runs added per pitch.',
  WPA: 'Average win probability change.',
  'RESULT DISTRIBUTION': 'Result frequency by pitch type.',
}

const metricTitle = (label) => (
  <Tooltip title={METRIC_HELP[label]} placement="top">
    <span style={{ cursor: 'help' }}>{label}</span>
  </Tooltip>
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
    render: value => (
      <span
        className="tracking-pitch-type"
        style={{ color: PITCH_TYPE_COLORS[value] || '#cbd5e1' }}
      >
        {PITCH_TYPE_LABELS[value] || value}
      </span>
    ),
  },
  {
    title: metricTitle('#'),
    dataIndex: 'count',
    width: 64,
    sorter: (a, b) => a.count - b.count,
    render: value => numberText(value),
    ...right,
  },
  {
    title: metricTitle('EMP xRUNS'),
    dataIndex: 'expectedRuns',
    width: 110,
    sorter: (a, b) => a.expectedRuns - b.expectedRuns,
    render: value => numberText(value, value > 0 ? '#ff6b6b' : '#3fb950'),
    ...right,
  },
  {
    title: metricTitle('WPA'),
    dataIndex: 'winProbChange',
    width: 90,
    sorter: (a, b) => a.winProbChange - b.winProbChange,
    render: value => numberText(`${value > 0 ? '+' : ''}${value}%`, value >= 0 ? '#3fb950' : '#ff6b6b'),
    ...right,
  },
  {
    title: metricTitle('RESULT DISTRIBUTION'),
    dataIndex: 'outcomes',
    render: outcomes => {
      const byOutcome = new Map((outcomes || []).map(item => [item.outcome, item]))
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {IMPORTANT_OUTCOMES.map(outcome => {
            const item = byOutcome.get(outcome)
            if (!item) return null
            return (
              <span
                key={outcome}
                className="outcome-chip"
                title={OUTCOME_LABELS[outcome] || outcome}
              >
                <b>{outcome}</b> {item.pct}%
              </span>
            )
          })}
        </div>
      )
    },
  },
]

export default function OutcomeDistribution({ data }) {
  const rows = data?.pitchTypeOutcomes || []
  const hasData = rows.length > 0

  return (
    <section className="analysis-card analysis-card-spaced">
      <div className="analysis-heading">
        <div>
          <h2>Outcome Distribution</h2>
          <p>Empirical expected runs from the historical outcome distribution under the selected filters.</p>
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
          showSorterTooltip={false}
        />
      ) : (
        <div className="analysis-empty-state">
          Select a pitcher or batter to view outcome distribution.
        </div>
      )}
    </section>
  )
}
