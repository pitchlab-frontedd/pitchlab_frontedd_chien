function getMetricContext(data, filters = {}) {
  const hasPitcher = Array.isArray(filters.pitcherIds) && filters.pitcherIds.length > 0
  const hasBatter = Boolean(filters.batterId)
  const expectedPerspective = hasBatter ? 'batter' : hasPitcher ? 'pitcher' : 'batter'
  const wpaPerspective = data?.wpaPerspective || expectedPerspective

  if (hasPitcher && hasBatter) {
    return {
      selectionTitle: 'Pitcher vs batter matchup',
      selectionCopy: 'Both sides are selected, so the numbers describe this matchup from the selected batter side.',
      wpaTitle: wpaPerspective === 'pitcher' ? 'Pitcher perspective' : 'Batter perspective',
      wpaCopy: wpaPerspective === 'pitcher'
        ? 'WPA is shown from the selected pitcher side. Positive helps the pitcher; negative helps the batter.'
        : 'WPA is shown from the selected batter side. Positive helps the batter; negative helps the pitcher/defense.',
    }
  }

  if (hasPitcher) {
    return {
      selectionTitle: 'Pitcher selected',
      selectionCopy: 'The table is filtered to the selected pitcher and any other active filters.',
      wpaTitle: 'Pitcher perspective',
      wpaCopy: 'WPA is shown from the pitcher side. Positive helps the pitcher; negative helps the batting team.',
    }
  }

  if (hasBatter) {
    return {
      selectionTitle: 'Batter selected',
      selectionCopy: 'The table is filtered to the selected batter and any other active filters.',
      wpaTitle: 'Batter perspective',
      wpaCopy: 'WPA is shown from the batter side. Positive helps the batter; negative helps the pitcher/defense.',
    }
  }

  return {
    selectionTitle: 'No player selected',
    selectionCopy: 'The table uses the broader sample from the current filters.',
    wpaTitle: 'Batter perspective by default',
    wpaCopy: 'WPA defaults to the batter side. Positive helps the batter; negative helps the pitcher/defense.',
  }
}

function MetricContext({ data, filters, hasData }) {
  const context = getMetricContext(data, filters)

  return (
    <div className="metric-context-grid">
      <div className="metric-context-card">
        <div className="metric-context-label">CURRENT FILTER</div>
        <div className="metric-context-title">{context.selectionTitle}</div>
        <p>{context.selectionCopy}</p>
      </div>
      <div className="metric-context-card">
        <div className="metric-context-label">EMP xRUNS</div>
        <div className="metric-context-title">Always batting-team perspective</div>
        <p>
          Positive means the pitch result added expected runs for the offense. Negative means the pitcher/defense
          prevented expected runs.
        </p>
      </div>
      <div className="metric-context-card">
        <div className="metric-context-label">WPA</div>
        <div className="metric-context-title">{hasData ? context.wpaTitle : 'Perspective appears after data loads'}</div>
        <p>{hasData ? context.wpaCopy : 'Select a pitcher or batter to show which side the WPA values are using.'}</p>
      </div>
    </div>
  )
}

export default function OutcomeDistribution({ data, filters }) {
  const hasData = Boolean(data?.pitchTypeOutcomes?.length)

  return (
    <section className="analysis-card analysis-card-spaced">
      <div className="analysis-heading">
        <div>
          <h2>Metric Perspective</h2>
          <p>Use this guide when reading EMP xRUNS and WPA in Pitch Tracking under the current filters.</p>
        </div>
      </div>
      <MetricContext data={data} filters={filters} hasData={hasData} />
    </section>
  )
}
