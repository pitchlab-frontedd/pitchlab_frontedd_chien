import { useState } from 'react'
import { Typography } from 'antd'
import NextPitchMap from './NextPitchMap'
import PitchTypeLocationScatter from './PitchTypeLocationScatter'

const { Text } = Typography

const CHARTS = [
  {
    key: 'zone',
    label: 'Pitch Types By Location',
    description: '9-zone pitch type tendency',
  },
]

export default function TendencyChartGuide({ pitchZoneData, pitchLocationData, filters }) {
  const [activeChart, setActiveChart] = useState(null)

  return (
    <section className="analysis-card chart-guide-card">
      <div className="analysis-heading">
        <div>
          <h2>Tendency Charts</h2>
          <p>Open a focused chart for the active filters.</p>
        </div>
      </div>

      <div className="chart-guide-grid">
        {CHARTS.map(chart => {
          const active = activeChart === chart.key
          return (
            <button
              key={chart.key}
              type="button"
              className={`chart-guide-button ${active ? 'is-active' : ''}`}
              onClick={() => setActiveChart(active ? null : chart.key)}
            >
              <span>{chart.label}</span>
              <Text>{chart.description}</Text>
            </button>
          )
        })}
      </div>

      {activeChart === 'zone' && (
        <div className="chart-guide-panel chart-guide-split-panel">
          <NextPitchMap data={pitchZoneData} filters={filters} />
          <PitchTypeLocationScatter data={pitchLocationData} />
        </div>
      )}
    </section>
  )
}
