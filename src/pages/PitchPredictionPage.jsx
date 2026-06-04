import { useEffect, useMemo, useState } from 'react'
import { Layout, Select, ConfigProvider, theme, Typography, Divider, Button, InputNumber, Spin, Tooltip } from 'antd'
import PageNavbar from '../components/PageNavbar'
import { pitchTypeColor, pitchTypeLabel } from '../utils/pitchTypes'

const { Sider, Content } = Layout
const { Text } = Typography
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://new-baseball-app-backend-fn6w.onrender.com'

const RECOMMENDATION_GOALS = [
  {
    key: 'out',
    label: 'Outs',
    title: 'Most Likely Out',
    help: 'Rank by highest out rate.',
  },
  {
    key: 'run',
    label: 'Prevent Runs',
    title: 'Lowest Run Value',
    help: 'Rank by lowest empirical run value.',
  },
  {
    key: 'damage',
    label: 'Limit Damage',
    title: 'Lowest Damage',
    help: 'Rank by lower run value, then lower home-run rate.',
  },
  {
    key: 'wpa',
    label: 'Win Probability',
    title: 'Best WPA',
    help: 'Rank by win probability change for the current perspective.',
  },
]

const TOP_K_OPTIONS = [3, 4, 5, 6]
const DETAIL_OUTCOMES = ['BB', 'HBP', '1B', '2B', '3B', 'HR', 'K', 'Out', 'DP', 'FC', 'ROE']

function sampleSignal(count = 0) {
  if (count >= 100) return { label: 'Strong sample', color: '#3fb950' }
  if (count >= 30) return { label: 'Moderate sample', color: '#e3b341' }
  return { label: 'Low sample', color: '#ff6b6b' }
}

function valueSignal(value, lowerFavorsPitcher = true) {
  const numeric = Number(value || 0)
  if (Math.abs(numeric) < 0.005) return { label: 'Neutral', color: '#8b949e' }
  const pitcherEdge = lowerFavorsPitcher ? numeric < 0 : numeric > 0
  return pitcherEdge
    ? { label: 'Pitcher edge', color: '#3fb950' }
    : { label: 'Batter edge', color: '#ff6b6b' }
}

function outcomePct(result, outcome) {
  const item = result?.outcomes?.find(row => row.outcome === outcome)
  return Number(item?.pct || 0)
}

function recommendationScore(result, goal) {
  if (!result) return 0
  const runValue = Number(result.avgRunValue ?? result.expectedRuns ?? 0)
  const wpa = Number(result.winProbChange || 0)
  if (goal === 'out') return Number(result.outRate || 0)
  if (goal === 'run') return -runValue
  if (goal === 'damage') {
    return (-runValue * 100) - (outcomePct(result, 'HR') * 2) - outcomePct(result, 'BB') - outcomePct(result, 'HBP')
  }
  if (goal === 'wpa') return wpa
  return -runValue
}

function sortRecommendations(rows, goal) {
  return [...(rows || [])].sort((a, b) => {
    const scoreDiff = recommendationScore(b, goal) - recommendationScore(a, goal)
    if (scoreDiff !== 0) return scoreDiff
    return Number(b.count || 0) - Number(a.count || 0)
  })
}

function formatRunValue(result) {
  const value = Number(result?.avgRunValue ?? result?.expectedRuns ?? 0)
  return value.toFixed(3)
}

function formatSignedPct(value) {
  const numeric = Number(value || 0)
  return `${numeric > 0 ? '+' : ''}${numeric}%`
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

function Pill({ label, selected, onClick, color, disabled = false }) {
  const c = color || '#f0883e'
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '4px 10px', borderRadius: 4,
        border: `1px solid ${selected ? c : '#30363d'}`,
        background: selected ? `${c}25` : 'transparent',
        color: disabled ? '#484f58' : (selected ? c : '#8b949e'),
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: selected ? 700 : 400,
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

function DiamondBaseSquare({ active, onClick, size = 18 }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, transform: 'rotate(45deg)',
        border: `2px solid ${active ? '#f0883e' : '#30363d'}`,
        background: active ? 'rgba(240,136,62,0.35)' : '#161b22',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s',
      }}
    />
  )
}

function MiniBaseSquare({ active }) {
  return (
    <div style={{
      width: 10, height: 10, transform: 'rotate(45deg)',
      background: active ? '#f0883e' : '#21262d',
      border: `1px solid ${active ? '#f0883e' : '#30363d'}`,
    }} />
  )
}

function BaseDiamond({ bases, onChange }) {
  const toggle = (base) => onChange({ ...bases, [base]: !bases[base] })

  return (
    <div style={{ position: 'relative', width: 100, height: 96 }}>
      <div style={{ position: 'absolute', left: 41, top: 4 }}><DiamondBaseSquare active={bases.second} onClick={() => toggle('second')} /></div>
      <div style={{ position: 'absolute', left: 5, top: 38 }}><DiamondBaseSquare active={bases.third} onClick={() => toggle('third')} /></div>
      <div style={{ position: 'absolute', left: 77, top: 38 }}><DiamondBaseSquare active={bases.first} onClick={() => toggle('first')} /></div>
      <div style={{ position: 'absolute', left: 41, top: 72, width: 18, height: 18, transform: 'rotate(45deg)', border: '2px solid #30363d', background: '#161b22' }} />
      <span style={{ position: 'absolute', left: 39, top: -13, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>2B</span>
      <span style={{ position: 'absolute', left: -17, top: 42, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>3B</span>
      <span style={{ position: 'absolute', left: 99, top: 42, fontSize: 9, color: '#484f58', letterSpacing: '0.05em' }}>1B</span>
    </div>
  )
}

function MiniDiamond({ bases }) {
  return (
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div style={{ position: 'absolute', left: 13, top: 2 }}><MiniBaseSquare active={bases.second} /></div>
      <div style={{ position: 'absolute', left: 2, top: 13 }}><MiniBaseSquare active={bases.third} /></div>
      <div style={{ position: 'absolute', left: 24, top: 13 }}><MiniBaseSquare active={bases.first} /></div>
      <div style={{ position: 'absolute', left: 13, top: 24 }}><MiniBaseSquare active={false} /></div>
    </div>
  )
}

function PitchCard({ rank, result, isTop, selected = false, onSelect }) {
  const isEmpty = !result
  const color = isEmpty ? '#484f58' : pitchTypeColor(result.pitchType)
  const sample = isEmpty ? { label: '-', color: '#484f58' } : sampleSignal(result.count)
  const runValue = isEmpty ? 0 : (result.avgRunValue ?? result.expectedRuns)
  const runValueSignal = valueSignal(runValue, true)
  const wpaColor = isEmpty ? '#484f58' : (Number(result.winProbChange || 0) >= 0 ? '#3fb950' : '#ff6b6b')
  const outRateSignal = isEmpty
    ? { label: '-', color: '#484f58' }
    : result.outRate >= 35
      ? { label: 'High out rate', color: '#3fb950' }
      : result.outRate >= 25
        ? { label: 'Average out rate', color: '#e3b341' }
        : { label: 'Low out rate', color: '#ff6b6b' }

  return (
    <div
      role={isEmpty ? undefined : 'button'}
      tabIndex={isEmpty ? undefined : 0}
      onClick={isEmpty ? undefined : onSelect}
      onKeyDown={event => {
        if (!isEmpty && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onSelect?.()
        }
      }}
      style={{
      background: '#161b22',
      border: `1px solid ${selected ? '#f0883e' : (isTop ? '#1f6feb' : '#21262d')}`,
      borderRadius: 8,
      padding: '16px',
      position: 'relative',
      opacity: isEmpty ? 0.35 : 1,
      cursor: isEmpty ? 'default' : 'pointer',
      boxShadow: selected ? '0 0 0 1px rgba(240,136,62,0.35)' : 'none',
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
          {isEmpty ? '' : pitchTypeLabel(result.pitchType)}
        </span>
      </div>
      {!isEmpty && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: sample.color, border: `1px solid ${sample.color}66`,
          background: `${sample.color}18`, borderRadius: 4,
          padding: '3px 7px', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        }}>
          {sample.label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          {
            label: 'Out Rate',
            help: 'Out rate for this pitch.',
            hint: outRateSignal.label,
            subhint: 'Share of outcomes ending in an out',
            value: isEmpty ? '-' : `${result.outRate}%`,
            color: outRateSignal.color,
          },
          {
            label: 'Run Value',
            help: 'Average runs added per pitch.',
            hint: runValueSignal.label,
            subhint: 'Avg runs added per pitch; lower helps pitcher',
            value: isEmpty ? '-' : runValue.toFixed(2),
            color: runValueSignal.color,
          },
          {
            label: 'WPA',
            help: 'Average win probability change.',
            hint: isEmpty ? '-' : (Number(result.winProbChange || 0) >= 0 ? 'Positive swing' : 'Negative swing'),
            subhint: 'Avg win-probability swing for the current perspective',
            value: isEmpty ? '-' : `${result.winProbChange > 0 ? '+' : ''}${result.winProbChange}%`,
            color: wpaColor,
          },
          {
            label: 'Sample',
            help: 'Number of similar pitches.',
            hint: sample.label,
            value: isEmpty ? '-' : result.count,
            color: sample.color,
          },
        ].map(({ label, help, hint, subhint, value, color: metricColor }) => (
          <div key={label} style={{ background: '#0d1117', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              <Tooltip title={help} placement="top">
                <span style={{ cursor: 'help' }}>{label}</span>
              </Tooltip>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: isEmpty ? '#484f58' : metricColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: isEmpty ? '#6e7681' : metricColor, marginTop: 5, lineHeight: 1.2, fontWeight: 700 }}>
              {hint}
            </div>
            {subhint && (
              <div style={{ fontSize: 9, color: '#6e7681', marginTop: 3, lineHeight: 1.25 }}>
                {subhint}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyResultsNotice({ hasResults }) {
  if (hasResults) return null
  return (
    <div style={{
      border: '1px dashed #30363d',
      borderRadius: 8,
      padding: '18px 20px',
      color: '#8b949e',
      background: '#0d1117',
      marginBottom: 14,
    }}>
      <div style={{
        color: '#e6edf3',
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: '0.08em',
        marginBottom: 6,
      }}>
        No matching historical pitches
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        Try removing a player, count, runner, or pitcher-profile filter to increase the sample.
      </div>
    </div>
  )
}

function PitchDetailPanel({ result, goal }) {
  if (!result) {
    return (
      <div style={{
        marginTop: 16,
        border: '1px dashed #30363d',
        borderRadius: 8,
        padding: 18,
        color: '#6e7681',
        background: '#0d1117',
        textAlign: 'center',
        fontSize: 12,
      }}>
        Select a recommendation to view outcome distribution.
      </div>
    )
  }

  const color = pitchTypeColor(result.pitchType)
  const outcomes = DETAIL_OUTCOMES
    .map(outcome => result.outcomes?.find(item => item.outcome === outcome))
    .filter(Boolean)
  const goalInfo = RECOMMENDATION_GOALS.find(item => item.key === goal) || RECOMMENDATION_GOALS[0]

  return (
    <div style={{
      marginTop: 16,
      background: '#161b22',
      border: '1px solid #21262d',
      borderRadius: 8,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
            <span style={{
              color,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}>
              {pitchTypeLabel(result.pitchType)}
            </span>
          </div>
          <Text style={{ color: '#6e7681', fontSize: 12 }}>
            {goalInfo.title} · {result.count} similar pitches
          </Text>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))', gap: 8, minWidth: 330 }}>
          {[
            { label: 'Out Rate', value: `${result.outRate}%`, color: '#3fb950' },
            { label: 'Run Value', value: formatRunValue(result), color: Number(result.avgRunValue ?? result.expectedRuns ?? 0) > 0 ? '#ff6b6b' : '#3fb950' },
            { label: 'WPA', value: formatSignedPct(result.winProbChange), color: Number(result.winProbChange || 0) >= 0 ? '#3fb950' : '#ff6b6b' },
          ].map(item => (
            <div key={item.label} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '8px 10px', textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{item.label}</div>
              <div style={{ color: item.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {outcomes.map(item => {
          const pct = Number(item.pct || 0)
          return (
            <div key={item.outcome} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 56px', alignItems: 'center', gap: 10 }}>
              <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: 12 }}>{item.outcome}</div>
              <div style={{ height: 10, borderRadius: 999, background: '#0d1117', overflow: 'hidden', border: '1px solid #21262d' }}>
                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, opacity: 0.82 }} />
              </div>
              <div style={{ color: '#8b949e', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'right' }}>{pct}%</div>
            </div>
          )
        })}
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
  const [resultMeta, setResultMeta] = useState(null)
  const [recommendationGoal, setRecommendationGoal] = useState('run')
  const [topK, setTopK] = useState(4)
  const [selectedPitchType, setSelectedPitchType] = useState('')
  const [loading, setLoading] = useState(false)

  const sortedResults = useMemo(
    () => sortRecommendations(results || [], recommendationGoal),
    [results, recommendationGoal]
  )
  const visibleResults = sortedResults.slice(0, topK)
  const selectedResult = sortedResults.find(item => item.pitchType === selectedPitchType) || visibleResults[0] || null
  const currentGoal = RECOMMENDATION_GOALS.find(item => item.key === recommendationGoal) || RECOMMENDATION_GOALS[0]

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
        console.error('Empirical guide metadata failed:', error)
      } finally {
        setMetaLoading(false)
      }
    }
    load()
  }, [])

  const handleAnalyze = async () => {
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

      const response = await fetch(`${API_BASE_URL}/api/pitches/empirical?${params.toString()}`)
      const data = await response.json()
      const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []
      setResults(recommendations)
      setResultMeta(data && typeof data === 'object' ? data : null)
      setSelectedPitchType(sortRecommendations(recommendations, recommendationGoal)[0]?.pitchType || '')
    } catch (error) {
      console.error('Empirical pitch guide failed:', error)
      setResults([])
      setResultMeta(null)
      setSelectedPitchType('')
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
            Pitch Prediction / Empirical Baseline
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
              <Text style={{ display: 'block', color: '#6e7681', fontSize: 11, marginTop: 6 }}>
                Context for result review.
              </Text>

              <Divider style={{ borderColor: '#21262d', margin: '12px 0' }} />
              <SectionLabel>Score</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <InputNumber min={0} max={30} value={scoreUs} onChange={v => setScoreUs(v ?? 0)} style={{ width: 65 }} />
                <span style={{ color: '#484f58', fontSize: 18, lineHeight: '32px', marginBottom: 2 }}>-</span>
                <InputNumber min={0} max={30} value={scoreThem} onChange={v => setScoreThem(v ?? 0)} style={{ width: 65 }} />
              </div>
              <Text style={{ display: 'block', color: '#6e7681', fontSize: 11, marginTop: 6 }}>
                Context for result review.
              </Text>

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
              <Button type="primary" onClick={handleAnalyze} loading={loading} block style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: '0.12em', height: 42 }}>
                Analyze
              </Button>
            </div>
          </Sider>

          <Content style={{ padding: '20px', background: '#0d1117', overflow: 'auto' }}>
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Inning', content: `${inningHalf} ${inning}` },
                { label: 'Score', content: `${scoreUs}-${scoreThem}` },
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

            <div style={{
              background: '#161b22',
              border: '1px solid #21262d',
              borderRadius: 8,
              padding: 16,
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div>
                <Text style={{ fontSize: 10, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Recommendation Goal
                </Text>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                  {RECOMMENDATION_GOALS.map(goal => (
                    <Tooltip key={goal.key} title={goal.help} placement="top">
                      <span>
                        <Pill
                          label={goal.label}
                          selected={recommendationGoal === goal.key}
                          onClick={() => setRecommendationGoal(goal.key)}
                        />
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div style={{ minWidth: 170 }}>
                <Text style={{ fontSize: 10, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Top K
                </Text>
                <div style={{ display: 'flex', gap: 6, marginTop: 9, justifyContent: 'flex-end' }}>
                  {TOP_K_OPTIONS.map(value => (
                    <Pill key={value} label={String(value)} selected={topK === value} onClick={() => setTopK(value)} />
                  ))}
                </div>
              </div>
              <div style={{ flexBasis: '100%', borderTop: '1px solid #21262d', paddingTop: 11 }}>
                <Text style={{ fontSize: 18, color: '#e6edf3', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}>
                  {currentGoal.title}
                </Text>
                <Text style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#6e7681' }}>
                  Empirical results from historical Statcast outcomes · {resultMeta?.total ?? 0} matching pitches
                </Text>
              </div>
            </div>
            {results && results.length === 0 && <EmptyResultsNotice hasResults={false} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {Array.from({ length: topK }).map((_, i) => {
                const result = visibleResults[i] ?? null
                return (
                  <PitchCard
                    key={result?.pitchType || i}
                    rank={i + 1}
                    result={result}
                    isTop={i === 0}
                    selected={Boolean(result && selectedResult?.pitchType === result.pitchType)}
                    onSelect={() => setSelectedPitchType(result.pitchType)}
                  />
                )
              })}
            </div>
            {results && results.length > 0 && (
              <PitchDetailPanel result={selectedResult} goal={recommendationGoal} />
            )}
          </Content>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
