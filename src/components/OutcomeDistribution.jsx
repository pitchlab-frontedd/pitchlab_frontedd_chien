function getMetricContext(data, filters = {}) {
  const hasPitcher = Array.isArray(filters.pitcherIds) && filters.pitcherIds.length > 0
  const hasBatter = Boolean(filters.batterId)
  const expectedPerspective = hasBatter ? 'batter' : hasPitcher ? 'pitcher' : 'batter'
  const wpaPerspective = data?.wpaPerspective || expectedPerspective

  if (hasPitcher && hasBatter) {
    return {
      wpaTitle: wpaPerspective === 'pitcher' ? 'Pitcher perspective' : 'Batter perspective',
      wpaCopy: wpaPerspective === 'pitcher'
        ? 'WPA is shown from the selected pitcher side. Positive helps the pitcher; negative helps the batter.'
        : 'WPA is shown from the selected batter side. Positive helps the batter; negative helps the pitcher/defense.',
    }
  }

  if (hasPitcher) {
    return {
      wpaTitle: 'Pitcher perspective',
      wpaCopy: 'WPA is shown from the pitcher side. Positive helps the pitcher; negative helps the batting team.',
    }
  }

  if (hasBatter) {
    return {
      wpaTitle: 'Batter perspective',
      wpaCopy: 'WPA is shown from the batter side. Positive helps the batter; negative helps the pitcher/defense.',
    }
  }

  return {
    wpaTitle: 'Batter perspective by default',
    wpaCopy: 'WPA defaults to the batter side. Positive helps the batter; negative helps the pitcher/defense.',
  }
}

function MetricContext({ data, filters, hasData }) {
  const context = getMetricContext(data, filters)

  return (
    <div className="metric-context-grid">
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
          <p>Use this guide when reading WPA in Pitch Tracking under the current filters.</p>
        </div>
      </div>
      <MetricContext data={data} filters={filters} hasData={hasData} />
    </section>
  )
}
