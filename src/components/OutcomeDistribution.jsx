function MetricContext({ wpaPerspective = 'batter', hasData }) {
  const perspectiveLabel = wpaPerspective === 'pitcher' ? 'Pitcher' : 'Batter'
  const wpaDirection = wpaPerspective === 'pitcher'
    ? 'Positive WPA favors the pitcher; negative WPA favors the batting team.'
    : 'Positive WPA favors the batter; negative WPA favors the pitcher/defense.'

  return (
    <div className="metric-context-grid">
      <div className="metric-context-card">
        <div className="metric-context-label">EMP xRUNS</div>
        <div className="metric-context-title">Batter-side run value</div>
        <p>
          Calculated from the batting team perspective. Positive means the pitch result added runs for the offense;
          negative means it helped the pitcher prevent runs.
        </p>
      </div>
      <div className="metric-context-card">
        <div className="metric-context-label">WPA</div>
        <div className="metric-context-title">{hasData ? `${perspectiveLabel} perspective` : 'Perspective appears after data loads'}</div>
        <p>{hasData ? wpaDirection : 'Select a pitcher or batter to show which side the WPA values are using.'}</p>
      </div>
    </div>
  )
}

export default function OutcomeDistribution({ data }) {
  const hasData = Boolean(data?.pitchTypeOutcomes?.length)
  const wpaPerspective = data?.wpaPerspective || 'batter'

  return (
    <section className="analysis-card analysis-card-spaced">
      <div className="analysis-heading">
        <div>
          <h2>Metric Perspective</h2>
          <p>Use this guide when reading EMP xRUNS and WPA in Pitch Tracking.</p>
        </div>
      </div>
      <MetricContext wpaPerspective={wpaPerspective} hasData={hasData} />
    </section>
  )
}
