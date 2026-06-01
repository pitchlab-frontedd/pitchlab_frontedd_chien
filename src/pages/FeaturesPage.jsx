import PageNavbar from '../components/PageNavbar'

const FEATURES = [
  {
    title: 'Historical Matchups',
    body: 'Compare batters, pitchers, seasons, counts, pitch types, strike-zone locations, and runner states from Statcast data.',
  },
  {
    title: 'Zone Heatmap',
    body: 'Visualize outcomes by strike-zone area with an expanded 13-zone layout for inside and outside chase regions.',
  },
  {
    title: 'Set Comparison',
    body: 'Build multiple filter sets and compare summary stats, pitch outcomes, and pitch-type behavior side by side.',
  },
  {
    title: 'Pitch Prediction',
    body: 'Use historical Statcast outcomes as the current empirical baseline for future pitch prediction workflows.',
  },
]

export default function FeaturesPage({ page, onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>
      <PageNavbar page={page} onNavigate={onNavigate} />
      <main style={{ flex: 1, padding: '56px 48px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{
            color: '#f0883e',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 54,
            letterSpacing: '0.08em',
            lineHeight: 1,
            marginBottom: 12,
          }}>
            FEATURES
          </div>
          <p style={{
            color: '#8b949e',
            fontSize: 16,
            maxWidth: 620,
            letterSpacing: '0.03em',
            marginBottom: 32,
          }}>
            PitchLab combines MLB pitch-level data with fast filters and compact visual analysis for game planning.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            {FEATURES.map((feature, index) => (
              <section
                key={feature.title}
                style={{
                  background: '#161b22',
                  border: '1px solid #21262d',
                  borderRadius: 8,
                  padding: 22,
                  minHeight: 160,
                }}
              >
                <div style={{
                  color: '#484f58',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  marginBottom: 18,
                }}>
                  0{index + 1}
                </div>
                <h2 style={{
                  color: '#e6edf3',
                  fontSize: 24,
                  letterSpacing: '0.06em',
                  margin: '0 0 10px',
                  fontFamily: "'Bebas Neue', sans-serif",
                }}>
                  {feature.title}
                </h2>
                <p style={{ color: '#8b949e', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {feature.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
