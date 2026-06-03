import { Table, Tooltip, Typography } from 'antd'

const { Text } = Typography

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

const IMPORTANT_OUTCOMES = ['BB', 'HBP', '1B', '2B', '3B', 'HR', 'K', 'Out', 'DP', 'FC', 'ROE']

const numberText = (value, color = '#8b949e') => (
  <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{value}</span>
)

const METRIC_HELP = {
  PITCH: 'Pitch type code.',
  N: 'Number of selected pitches for this pitch type.',
  'EMP xRUNS': 'Empirical expected runs per pitch from the historical result mix. Higher means more runs for the batting team.',
  WPA: 'Average win probability added by this pitch type in the selected data. Positive favors the batting team; negative favors the pitcher.',
  'RESULT DISTRIBUTION': 'How often each result happened for this pitch type under the selected filters.',
}

const metricTitle = (label) => (
  <Tooltip title={METRIC_HELP[label]} placement="top">
    <span style={{ cursor: 'help' }}>{label}</span>
  </Tooltip>
)

const columns = [
  {
    title: metricTitle('PITCH'),
    dataIndex: 'pitchType',
    width: 80,
    render: value => <Text style={{ color: '#e6edf3', fontWeight: 700 }}>{value}</Text>,
  },
  {
    title: metricTitle('N'),
    dataIndex: 'count',
    width: 70,
    sorter: (a, b) => a.count - b.count,
    render: value => numberText(value),
  },
  {
    title: metricTitle('EMP xRUNS'),
    dataIndex: 'expectedRuns',
    width: 110,
    sorter: (a, b) => a.expectedRuns - b.expectedRuns,
    render: value => numberText(value, value > 0 ? '#ff6b6b' : '#3fb950'),
  },
  {
    title: metricTitle('WPA'),
    dataIndex: 'winProbChange',
    width: 90,
    sorter: (a, b) => a.winProbChange - b.winProbChange,
    render: value => numberText(`${value > 0 ? '+' : ''}${value}%`, value >= 0 ? '#3fb950' : '#ff6b6b'),
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
                style={{
                  border: '1px solid #30363d',
                  borderRadius: 4,
                  padding: '3px 7px',
                  color: '#8b949e',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                }}
                title={OUTCOME_LABELS[outcome] || outcome}
              >
                <b style={{ color: '#e6edf3' }}>{outcome}</b> {item.pct}%
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

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: '16px', marginTop: 16 }}>
      <Text style={{
        display: 'block',
        color: '#e6edf3',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        Outcome Distribution
      </Text>
      <Text style={{ display: 'block', color: '#484f58', fontSize: 11, marginBottom: 12 }}>
        Empirical expected runs from the historical outcome distribution under the selected filters.
      </Text>
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="pitchType"
        pagination={false}
        size="small"
        showSorterTooltip={false}
      />
    </div>
  )
}
