const LINKS = [
  { label: 'Features', page: 'features' },
  { label: 'Historical Data', page: 'history' },
  { label: 'Pitch Prediction', page: 'prediction' },
]

export default function PageNavbar({ page, onNavigate }) {
  return (
    <nav className="page-navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      height: 56,
      borderBottom: '1px solid #2f4058',
      background: '#142033',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div
        className="page-brand"
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => onNavigate('home')}
      >
        <img src="/logo.jpg" alt="logo" style={{ width: 48, height: 27, borderRadius: 4 }} />
        <span style={{
          color: '#e6edf3',
          fontSize: 18,
          fontWeight: 700,
        }}>
          PitchLab
        </span>
      </div>

      <div className="page-nav-links" style={{ display: 'flex', gap: 32 }}>
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
                color: isActive ? '#f0883e' : '#b7c0cc',
                fontSize: 15,
                fontWeight: isActive ? 700 : 500,
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
