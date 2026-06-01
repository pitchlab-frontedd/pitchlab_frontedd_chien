const LINKS = [
  { label: 'Features', page: 'features' },
  { label: 'Historical Data', page: 'history' },
  { label: 'Pitch Prediction', page: 'prediction' },
]

export default function PageNavbar({ page, onNavigate }) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      height: 56,
      borderBottom: '1px solid #21262d',
      background: '#0d1117',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => onNavigate('home')}
      >
        <img src="/logo.jpg" alt="logo" style={{ width: 48, height: 27, borderRadius: 4 }} />
        <span style={{
          color: '#e6edf3',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.15em',
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          PitchLab
        </span>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        {LINKS.map(link => {
          const isActive = page === link.page
          return (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 0 2px 0',
                color: isActive ? '#f0883e' : '#8b949e',
                fontSize: 14,
                letterSpacing: '0.08em',
                fontFamily: "'Barlow Condensed', sans-serif",
                borderBottom: isActive ? '2px solid #f0883e' : '2px solid transparent',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
