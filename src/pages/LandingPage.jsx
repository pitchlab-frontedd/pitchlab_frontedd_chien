import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Features', page: 'features' },
  { label: 'Historical Data', page: 'history' },
  { label: 'Pitch Prediction', page: 'prediction' },
]

export default function LandingPage({ onNavigate }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleNav = (page) => {
    setLeaving(true)
    setTimeout(() => onNavigate(page), 450)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      fontFamily: "'Barlow Condensed', sans-serif",
      transform: leaving ? 'translateY(-100%)' : 'translateY(0)',
      transition: leaving ? 'transform 0.45s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/hero-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        filter: 'brightness(0.45)',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(13,17,23,0.85) 0%, rgba(13,17,23,0.3) 60%, rgba(13,17,23,0.1) 100%)',
      }} />

      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 48px',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.jpg" alt="logo" style={{ width: 48, height: 27, borderRadius: 4 }} />
          <span style={{
            color: '#e6edf3',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.15em',
          }}>
            PitchLab
          </span>
        </div>

        <div style={{ display: 'flex', gap: 34 }}>
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => handleNav(link.page)}
              style={{
                background: 'none',
                border: 'none',
                color: '#e6edf3',
                fontSize: 14,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                padding: 0,
                opacity: 0.85,
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: 48,
        transform: visible ? 'translateY(-55%)' : 'translateY(-40%)',
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(42px, 6vw, 80px)',
          color: '#ffffff',
          lineHeight: 1.05,
          letterSpacing: '0.04em',
        }}>
          PREDICT THE PLAY.<br />WIN SMARTER.
        </div>
        <div style={{
          marginTop: 20,
          color: '#8b949e',
          fontSize: 'clamp(12px, 1.2vw, 15px)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Analyze every pitch with MLB Statcast data.
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 28,
        left: 48,
        zIndex: 2,
        opacity: visible ? 0.45 : 0,
        transition: 'opacity 1s ease 0.6s',
        userSelect: 'none',
      }}>
        <span style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#e6edf3',
        }}>
          Presented by N.J.D
        </span>
      </div>
    </div>
  )
}
