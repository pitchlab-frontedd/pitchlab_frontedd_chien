import { useEffect, useState } from 'react'
import { Layout, Select, ConfigProvider, theme, Typography, Divider, Button, InputNumber, Spin } from 'antd'
import PageNavbar from '../components/PageNavbar'

const { Sider, Content } = Layout
const { Text } = Typography
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://new-baseball-app-backend.onrender.com'

const PITCH_TYPE_COLORS = {
  FF: '#f0883e', SI: '#e3b341', SL: '#58a6ff',
  CH: '#3fb950', CU: '#bc8cff', FC: '#ff6b6b',
  ST: '#d2a8ff', FS: '#2da44e',
}

const PITCH_TYPE_LABELS = {
  FF: 'Four-Seam FB', SI: 'Sinker', SL: 'Slider',
  CH: 'Changeup', CU: 'Curveball', FC: 'Cutter',
  ST: 'Sweeper', FS: 'Splitter',
}

function SectionLabel({ children }) {
  return (
    <Text style={{
      display: 'block', fontSize: 10, fontWeight: 700, color: '#484f58',
      textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      {children}
    </Text>
  )
}

function Pill({ label, selected, onClick, color }) {
  const c = color || '#f0883e'
  return (
    <div
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 4,
        border: `1px solid ${selected ? c : '#30363d'}`,
        background: selected ? `${c}25` : 'transparent',
        color: selected ? c : '#8b949e',
        cursor: 'pointer', fontSize: 12, fontWeight: selected ? 700 : 400,
        letterSpacing: '0.05em', userSelect: 'none', transition: 'all 0.15s',
      }}
    >
      {label}
    </div>
  )
}

function CountSelector({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 3, paddingLeft: 26 }}>
        {['0S', '1S', '2S'].map(s => (
          <div key={s} style={{ width: 34, textAlign: 'center', fontSize: 10, color: '#484f58', fontFamily: 'JetBrains Mono, monospace' }}>{s}</div>
        ))}
      </div>
      {[0, 1, 2, 3].map(b => (
        <div key={b} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ width: 22, fontSize: 10, color: '#484f58', textAlign: 'right', marginRight: 4, fontFamily: 'JetBrains Mono, monospace' }}>{b}B</div>
          {[0, 1, 2].map(s => {
            const key = `${b}-${s}`
            const sel = value === key
            return (
              <div
                key={key}
                onClick={() => onChange(sel ? '' : key)}
                style={{
                  width: 32, height: 24, marginRight: 2, borderRadius: 3,
                  border: `1px solid ${sel ? '#f0883e' : '#30363d'}`,
                  background: sel ? 'rgba(240,136,62,0.2)' : '#161b22',
                  color: sel ? '#f0883e' : '#484f58',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 10, fontWeight: sel ? 700 : 400,
                  userSelect: 'none', transition: 'all 0.12s',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {b}-{s}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function BaseDiamond({ bases, onChange }) {
  const toggle = (base) => onChange({ ...bases, [base]: !bases[base] })
  const BaseSquare = ({ base }) => {
    const active = bases[base]
    return (
      <div
        onClick={() => toggle(base)}
        style={{
          width: 18, height: 18, transform: 'rotate(45deg)',
          border: `2px solid ${active ? '#f0883e' : '#30363d'}`,
          background: active ? 'rgba(240,136,62,0.35)' : '#161b22',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      />
    )
  }

  return (
    <div style={{ position: 'relative', width: 100, height: 96 }}>
      <div style={{ position: 'absolute', left: 41, top: 4 }}><BaseSquare base="second" /></div>
      <div style={{ position: 'absolute', left: 5, top: 38 }}><BaseSquare base="third" /></div>
      <div style={{ position: 'absolute', left: 77, top: 38 }}><BaseSquare base="first" /></div>
      <div style={{ position: 'absolute', left: 41, top: 72, width: 18, height: 18, transform: 'rotate(45deg)', border: '2px solid #30363d', background: '#161b22' }} />
      <span style={{ position: 'absolute', left: 39, top: -13, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>2B</span>
      <span style={{ position: 'absolute', left: -17, top: 42, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>3B</span>
      <span style={{ position: 'absolute', left: 99, top: 42, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>1B</span>
    </div>
  )
}

function MiniDiamond({ bases }) {
  const Base = ({ active }) => (
    <div style={{
      width: 10, height: 10, transform: 'rotate(45deg)',
      background: active ? '#f0883e' : '#21262d',
      border: `1px solid ${active ? '#f0883e' : '#30363d'}`,
    }} />
  )
  return (
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div style={{ position: 'absolute', left: 13, top: 2 }}><Base active={bases.second} /></div>
      <div style={{ position: 'absolute', left: 2, top: 13 }}><Base active={bases.third} /></div>
      <div style={{ position: 'absolute', left: 24, top: 13 }}><Base active={bases.first} /></div>
      <div style={{ position: 'absolute', left: 13, top: 24 }}><Base active={false} /></div>
    </div>
  )
}

function PitchCard({ rank, result, isTop }) {
  const isEmpty = !result
  const color = isEmpty ? '#484f58' : (PITCH_TYPE_COLORS[result.pitchType] || '#484f58')

  return (
    <div style={{
      background: '#161b22',
      border: `1px solid ${isTop ? '#1f6feb' : '#21262d'}`,
      borderRadius: 8,
      padding: '16px',
      position: 'relative',
      opacity: isEmpty ? 0.35 : 1,
    }}>
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 22, height: 22, borderRadius: '50%',
        background: isTop ? '#1f6feb' : '#21262d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        color: isTop ? '#fff' : '#484f58',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {rank}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em', lineHeight: 1 }}>
          {isEmpty ? '-' : result.pitchType}
        </span>
        <span style={{ fontSize: 12, color: '#8b949e' }}>
          {isEmpty ? '' : PITCH_TYPE_LABELS[result.pitchType]}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Out Rate', value: isEmpty ? '-' : `${result.outRate}%`, color: '#e3b341' },
          { label: 'xRuns', value: isEmpty ? '-' : result.expectedRuns.toFixed(2), color: '#ff6b6b' },
          { label: 'Win% Δ', value: isEmpty ? '-' : `${result.winProbChange > 0 ? '+' : ''}${result.winProbChange}%`, color: result?.winProbChange >= 0 ? '#3fb950' : '#ff6b6b' },
          { label: 'Sample', value: isEmpty ? '-' : result.count, color: '#58a6ff' },
        ].map(({ label, value, color: metricColor }) => (
          <div key={label} style={{ background: '#0d1117', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: isEmpty ? '#484f58' : metricColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PitchPredictionPage({ page, onNavigate }) {
  const [pitchers, setPitchers] = useState([])
  const [batters, setBatters] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)
  const [pitcherId, setPitcherId] = useState('')
  const [batterId, setBatterId] = useState('')
  const [pitcherHand, setPitcherHand] = useState('')
  const [pitcherRole, setPitcherRole] = useState('All')
  const [inningHalf, setInningHalf] = useState('TOP')
  const [inning, setInning] = useState(1)
  const [scoreUs, setScoreUs] = useState(0)
  const [scoreThem, setScoreThem] = useState(0)
  const [count, setCount] = useState('')
  const [outs, setOuts] = useState(0)
  const [bases, setBases] = useState({ first: false, second: false, third: false })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [resPitchers, resBatters] = await Promise.all([
          fetch(`${API_BASE_URL}/api/pitchers`),
          fetch(`${API_BASE_URL}/api/batters`),
        ])
        const [pitcherData, batterData] = await Promise.all([resPitchers.json(), resBatters.json()])
        setPitchers(Array.isArray(pitcherData) ? pitcherData : [])
        setBatters(Array.isArray(batterData) ? batterData : [])
      } catch (error) {
        console.error('Prediction metadata failed:', error)
      } finally {
        setMetaLoading(false)
      }
    }
    load()
  }, [])

  const handlePredict = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        year: 'ALL',
        pitcherId: pitcherId || '',
        batterId: batterId || '',
        pitcherRole,
        pitcherHand,
        outs: String(outs),
        on1b: bases.first ? '1' : '0',
        on2b: bases.second ? '1' : '0',
        on3b: bases.third ? '1' : '0',
      })

      if (count) {
        const [balls, strikes] = count.split('-')
        params.set('balls', balls)
        params.set('strikes', strikes)
      }

      const response = await fetch(`${API_BASE_URL}/api/pitches/predict?${params.toString()}`)
      const data = await response.json()
      setResults(Array.isArray(data?.recommendations) ? data.recommendations : [])
    } catch (error) {
      console.error('Prediction failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: {
      colorPrimary: '#f0883e',
      colorBgContainer: '#161b22',
      colorBgElevated: '#1c2128',
      colorBgLayout: '#0d1117',
      colorBorder: '#30363d',
      colorBorderSecondary: '#21262d',
      colorText: '#e6edf3',
      colorTextSecondary: '#8b949e',
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
      borderRadius: 6,
    } }}>
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>
        <PageNavbar page={page} onNavigate={onNavigate} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#0d1117', borderBottom: '1px solid #21262d', height: 48 }}>
          <Text style={{ color: '#484f58', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Pitch Prediction
          </Text>
          {metaLoading && <Spin size="small" style={{ marginLeft: 12 }} />}
        </div>

        <Layout style={{ background: '#0d1117', flex: 1 }}>
          <Sider width={270} style={{ background: '#0d1117', borderRight: '1px solid #21262d', overflow: 'auto' }}>
            <div style={{ padding: '16px 14px', color: '#e6edf3' }}>
              <SectionLabel>Pitcher</SectionLabel>
              <Select showSearch allowClear placeholder="Search pitcher..." value={pitcherId || undefined} onChange={v => setPitcherId(v || '')} options={pitchers.map(p => ({ value: String(p.id), label: p.name }))} style={{ width: '100%' }} filterOption={(input, opt) => (opt?.label || '').toLowerCase().includes(input.toLowerCase())} />

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Batter</SectionLabel>
              <Select showSearch allowClear placeholder="Search batter..." value={batterId || undefined} onChange={v => setBatterId(v || '')} options={batters.map(b => ({ value: String(b.id), label: b.name }))} style={{ width: '100%' }} filterOption={(input, opt) => (opt?.label || '').toLowerCase().includes(input.toLowerCase())} />

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Pitcher Profile</SectionLabel>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {[{ label: 'ALL', value: '' }, { label: 'RHP', value: 'R' }, { label: 'LHP', value: 'L' }].map(item => (
                  <Pill key={item.label} label={item.label} selected={pitcherHand === item.value} onClick={() => setPitcherHand(item.value)} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ label: 'ALL', value: 'All' }, { label: 'SP', value: 'SP' }, { label: 'RP', value: 'RP' }].map(item => (
                  <Pill key={item.label} label={item.label} selected={pitcherRole === item.value} onClick={() => setPitcherRole(item.value)} />
                ))}
              </div>

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Inning</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['TOP', 'BOT'].map(half => <Pill key={half} label={half} selected={inningHalf === half} onClick={() => setInningHalf(half)} />)}
                </div>
                <InputNumber min={1} max={20} value={inning} onChange={v => setInning(v || 1)} style={{ width: 76 }} />
              </div>

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Score</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <InputNumber min={0} max={30} value={scoreUs} onChange={v => setScoreUs(v ?? 0)} style={{ width: 65 }} />
                <span style={{ color: '#484f58', fontSize: 18, lineHeight: '32px', marginBottom: 2 }}>-</span>
                <InputNumber min={0} max={30} value={scoreThem} onChange={v => setScoreThem(v ?? 0)} style={{ width: 65 }} />
              </div>

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Count</SectionLabel>
              <CountSelector value={count} onChange={setCount} />

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Outs</SectionLabel>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(n => <Pill key={n} label={`${n} Out${n !== 1 ? 's' : ''}`} selected={outs === n} onClick={() => setOuts(n)} />)}
              </div>

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Runners on Base</SectionLabel>
              <div style={{ paddingLeft: 20, marginTop: 14, marginBottom: 4 }}>
                <BaseDiamond bases={bases} onChange={setBases} />
              </div>

              <Divider style={{ borderColor: '#21262d', margin: '16px 0 12px' }} />
              <Button type="primary" onClick={handlePredict} loading={loading} block style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: '0.12em', height: 42 }}>
                Predict
              </Button>
            </div>
          </Sider>

          <Content style={{ padding: '20px', background: '#0d1117', overflow: 'auto' }}>
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Inning', content: `${inningHalf} ${inning}` },
                { label: 'Score', content: `${scoreUs} - ${scoreThem}` },
                { label: 'Count', content: count || '-' },
                { label: 'Outs', content: `${outs}` },
                { label: 'Pitcher', content: `${pitcherHand || 'ALL'} ${pitcherRole}` },
              ].map(({ label, content }) => (
                <div key={label} style={{ paddingRight: 22, marginRight: 22, borderRight: '1px solid #21262d' }}>
                  <div style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{content}</div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Runners</div>
                <MiniDiamond bases={bases} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Top 4 Recommended Pitches
              </Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[0, 1, 2, 3].map(i => <PitchCard key={i} rank={i + 1} result={results?.[i] ?? null} isTop={i === 0} />)}
            </div>
          </Content>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
