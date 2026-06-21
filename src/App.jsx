import { useState, useMemo, useEffect } from 'react'
import { Layout, Select, ConfigProvider, theme, Typography, Space, Spin, Button } from 'antd'
import { CloseOutlined, FilterOutlined } from '@ant-design/icons'
import FilterPanel from './components/FilterPanel'
import SetTabs from './components/SetTabs'
import SummaryStats from './components/SummaryStats'
import ZoneHeatmap from './components/ZoneHeatmap'
import ResultChart from './components/ResultChart'
import PitchTypeTable from './components/PitchTypeTable'
import TendencyChartGuide from './components/TendencyChartGuide'
import StandardStatsTable from './components/StandardStatsTable'
import PageNavbar from './components/PageNavbar'
import LandingPage from './pages/LandingPage'
import FeaturesPage from './pages/FeaturesPage'
import PitchPredictionPage from './pages/PitchPredictionPage'

import {
  DEFAULT_FILTERS,
  aggregateByResult,
  aggregateByPitchType,
  aggregateByZone,
  getSummaryStats,
} from './utils/filterUtils'
import './App.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const SET_COLORS = ['#fb923c', '#38bdf8', '#4ade80', '#c084fc']
const INITIAL_FILTERS = { ...DEFAULT_FILTERS, batterId: '', pitcherIds: [], pitcherRole: 'All' }

// 定義後端基礎網址。正式站用 Render，本機開發可用 VITE_API_BASE_URL 覆蓋。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://new-baseball-app-backend-fn6w.onrender.com";

const EMPTY_SET_DATA = {
  total: 0,
  summaryStats: null,
  standardStats: null,
  resultData: [],
  pitchTypeData: [],
  zoneData: {},
  pitchZoneData: { total: 0, zones: {}, topCombos: [] },
  pitchLocationData: { total: 0, xRange: [-2.6, 2.6], zRange: [0.4, 5.2], cells: [] },
  outcomeData: { total: 0, outcomes: [], pitchTypeOutcomes: [] },
}

const readCachedOptions = (key) => {
  if (typeof window === 'undefined') return []
  try {
    const cached = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

const writeCachedOptions = (key, value) => {
  if (typeof window === 'undefined' || !Array.isArray(value)) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function HistoricalDataPage({ page, onNavigate }) {
  const [batters, setBatters] = useState(() => readCachedOptions('pitchlab:batters'));
  const [pitchers, setPitchers] = useState(() => readCachedOptions('pitchlab:pitchers'));
  const [setSummaries, setSetSummaries] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [sets, setSets] = useState([
    { id: 1, name: 'Set A', color: SET_COLORS[0], filters: INITIAL_FILTERS },
  ]);
  const [activeSetId, setActiveSetId] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsMode, setStatsMode] = useState('standard');

  // 1. 初始載入
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        setLoading(true);
        const [resBatters, resPitchers] = await Promise.all([
          fetch(`${API_BASE_URL}/api/batters`),
          fetch(`${API_BASE_URL}/api/pitchers`)
        ]);
        const bData = await resBatters.json();
        const pData = await resPitchers.json();

        const nextBatters = Array.isArray(bData) ? bData : [];
        const nextPitchers = Array.isArray(pData) ? pData : [];

        setBatters(nextBatters);
        setPitchers(nextPitchers);
        writeCachedOptions('pitchlab:batters', nextBatters);
        writeCachedOptions('pitchlab:pitchers', nextPitchers);
      } catch (error) {
        console.error("元數據加載失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetaData();
  }, []);

  const activeSet = sets.find(s => s.id === activeSetId);
  const activeFilters = activeSet?.filters || INITIAL_FILTERS;

  // 2. 核心數據抓取：多人使用時只抓後端聚合結果，不把大量逐球資料送到瀏覽器。
  useEffect(() => {
    const controller = new AbortController();

    const fetchSummaryForSet = async (set) => {
      const {
        batterId,
        pitcherIds,
        year,
        pitcherRole,
        pitcherHands,
        batterHand,
        pitchTypes = [],
        zones = [],
        counts = [],
        outs = 'All',
        runnerState = 'All',
        runnerBases = {},
      } = set.filters;

      const pId = pitcherIds?.join(',') || '';
      const bId = batterId || '';

      if (!pId && !bId) return EMPTY_SET_DATA;

      const params = new URLSearchParams({
        year: year || 'ALL',
        pitcherId: pId,
        batterId: bId,
        pitcherRole: pitcherRole || 'All',
        pitchType: pitchTypes.join(','),
        zone: zones.join(','),
        pitcherHand: pitcherHands || '',
        batterHand: batterHand || '',
      });

      if (outs && outs !== 'All') {
        params.set('outs', outs);
      }

      if (runnerState && runnerState !== 'All') {
        const bases = runnerState === 'Empty'
          ? { first: false, second: false, third: false }
          : runnerBases;

        params.set('on1b', bases?.first ? '1' : '0');
        params.set('on2b', bases?.second ? '1' : '0');
        params.set('on3b', bases?.third ? '1' : '0');
      }

      if (counts?.length > 0) {
        const [balls, strikes] = String(counts[0]).split('-');
        if (balls !== undefined) params.set('balls', balls);
        if (strikes !== undefined) params.set('strikes', strikes);
      }

      const response = await fetch(`${API_BASE_URL}/api/pitches/summary?${params.toString()}`, {
        signal: controller.signal,
      });
      const outcomesPromise = fetch(`${API_BASE_URL}/api/pitches/outcomes?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(res => res.ok ? res.json() : EMPTY_SET_DATA.outcomeData)
        .catch(() => EMPTY_SET_DATA.outcomeData);

      if (!response.ok) {
        const fallback = await fetch(`${API_BASE_URL}/api/pitches?${params.toString()}`, {
          signal: controller.signal,
        });
        const pitches = await fallback.json();
        const rows = Array.isArray(pitches) ? pitches : [];
        const outcomeData = await outcomesPromise;
        return {
          total: rows.length,
          summaryStats: getSummaryStats(rows),
          standardStats: null,
          resultData: aggregateByResult(rows),
          pitchTypeData: aggregateByPitchType(rows),
          zoneData: aggregateByZone(rows),
          outcomeData,
        };
      }
      const [data, outcomeData] = await Promise.all([response.json(), outcomesPromise]);
      return data && typeof data === 'object' ? { ...data, outcomeData } : EMPTY_SET_DATA;
    };

    const fetchAllSummaries = async () => {
      setDataLoading(true);
      try {
        const entries = await Promise.all(
          sets.map(async (set) => [set.id, await fetchSummaryForSet(set)])
        );
        setSetSummaries(Object.fromEntries(entries));
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error("數據更新失敗:", e);
          setSetSummaries({});
        }
      } finally {
        if (!controller.signal.aborted) setDataLoading(false);
      }
    };

    fetchAllSummaries();
    return () => controller.abort();
  }, [sets]);
  

  const availableBatters = useMemo(() => {
    return batters;
  }, [batters]);

  const availablePitchers = useMemo(() => {
    return pitchers;
  }, [pitchers]);

  const updateActiveFilters = (updater) => {
    setSets(prev => prev.map(s =>
      s.id === activeSetId
        ? { ...s, filters: typeof updater === 'function' ? updater(s.filters) : { ...s.filters, ...updater } }
        : s
    ));
  };

  const changeBatter = (val) => {
    updateActiveFilters({ batterId: val ? String(val) : '' });
  };

  const addSet = () => {
    if (sets.length >= 4) return;
    const newId = Date.now();
    setSets(prev => [...prev, { 
      id: newId, 
      name: `Set ${String.fromCharCode(65 + prev.length)}`, 
      color: SET_COLORS[prev.length], 
      filters: { ...INITIAL_FILTERS, batterId: activeFilters.batterId } 
     }]);
    setActiveSetId(newId);
  };

  const removeSet = (id) => {
    setSets(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSetId === id) setActiveSetId(next[0]?.id);
      return next;
    });
  };

  const setsData = useMemo(() => {
    return sets.map(set => {
      const summary = setSummaries[set.id] || EMPTY_SET_DATA;
      return {
        ...set,
        total: summary.total || 0,
        summaryStats: summary.summaryStats,
        standardStats: summary.standardStats,
        resultData: summary.resultData || [],
        pitchTypeData: summary.pitchTypeData || [],
        zoneData: summary.zoneData || {},
        pitchZoneData: summary.pitchZoneData || EMPTY_SET_DATA.pitchZoneData,
        pitchLocationData: summary.pitchLocationData || EMPTY_SET_DATA.pitchLocationData,
        outcomeData: summary.outcomeData || EMPTY_SET_DATA.outcomeData,
      };
    });
  }, [sets, setSummaries]);

  const activeSetData = setsData.find(s => s.id === activeSetId);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#fb923c',
          colorBgContainer: '#1f2937',
          colorBgElevated: '#273449',
          colorBgLayout: '#111827',
          colorBorder: '#475569',
          colorBorderSecondary: '#334155',
          colorText: '#f8fafc',
          colorTextSecondary: '#cbd5e1',
          fontFamily: 'Helvetica, Arial, system-ui, sans-serif',
          borderRadius: 6,
        },
        components: {
          Table: { headerBg: '#273449', rowHoverBg: '#273449' },
          Select: { optionSelectedBg: '#273449' },
        },
      }}
    >
      <>
        <PageNavbar page={page} onNavigate={onNavigate} />
      <Layout style={{ minHeight: '100vh', background: '#111c2b' }}>
        <Header className="history-topbar" style={{
          display: 'flex', alignItems: 'center', gap: 32,
          padding: '0 24px', background: '#162235',
          borderBottom: '1px solid #2f4058', height: 54, position: 'sticky', top: 56, zIndex: 99,
        }}>
          <Space className="history-batter-control" size={8} align="center">
            <Text style={{ color: '#c1ccda', fontSize: 14, textTransform: 'uppercase', fontWeight: 700 }}>Batter</Text>
            <Select
              allowClear
              showSearch
              value={activeFilters.batterId || undefined}
              onChange={changeBatter}
              placeholder="Select a player or leave blank"
              style={{ width: 260 }}
              options={availableBatters.map(b => ({ value: String(b.id), label: b.name }))}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              loading={loading && availableBatters.length === 0}
              variant="borderless"
            />
          </Space>

          <Button
            className="mobile-filter-button"
            icon={<FilterOutlined />}
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </Button>

          <div className="history-backend-status" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dataLoading && <Spin size="small" style={{ marginRight: 8 }} />}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: loading ? '#f0883e' : '#3fb950' }} />
            <Text style={{ color: '#c1ccda', fontSize: 13, fontWeight: 600 }}>{loading ? 'API CONNECTING...' : 'LIVE BACKEND'}</Text>
          </div>
        </Header>

        <Layout style={{ background: '#111c2b' }}>
          <div
            className={`mobile-filter-backdrop ${filtersOpen ? 'is-open' : ''}`}
            onClick={() => setFiltersOpen(false)}
          />
          <Sider
            className={`history-filter-sider ${filtersOpen ? 'is-open' : ''}`}
            width={300}
            style={{ background: '#142033', borderRight: '1px solid #2f4058', height: 'calc(100vh - 110px)', overflow: 'auto', position: 'sticky', top: 110 }}
          >
            <div className="mobile-filter-drawer-header">
              <Text style={{ color: '#e6edf3', fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>Filters</Text>
              <Button type="text" icon={<CloseOutlined />} onClick={() => setFiltersOpen(false)} />
            </div>
            <SetTabs sets={sets} activeSetId={activeSetId} onSelect={setActiveSetId} onAdd={addSet} onRemove={removeSet} />
            {activeSet && (
              <FilterPanel
                filters={activeFilters}
                pitchers={availablePitchers} 
                loadingPitchers={loading && availablePitchers.length === 0}
                onChange={updateActiveFilters}
                onReset={() => updateActiveFilters(INITIAL_FILTERS)}
              />
            )}
          </Sider>

          <Content className="history-content" style={{ padding: '20px', background: '#111c2b', minHeight: 'calc(100vh - 110px)', overflow: 'auto' }}>
            <div className="stats-mode-tabs" role="tablist" aria-label="Statistics view">
              <button
                type="button"
                className={statsMode === 'standard' ? 'is-active' : ''}
                onClick={() => setStatsMode('standard')}
              >
                Standard
              </button>
              <button
                type="button"
                className={statsMode === 'advanced' ? 'is-active' : ''}
                onClick={() => setStatsMode('advanced')}
              >
                Advanced
              </button>
            </div>
            {statsMode === 'standard' ? (
              <StandardStatsTable data={activeSetData?.pitchTypeData || []} filters={activeFilters} standardStats={activeSetData?.standardStats} />
            ) : (
              <>
                <SummaryStats setsData={setsData} />
                <div className="history-visual-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 16 }}>
                  <ZoneHeatmap zoneData={activeSetData?.zoneData} totalPitches={activeSetData?.total || 0} setColor={activeSet?.color} setName={activeSet?.name} />
                  <ResultChart setsData={setsData} />
                </div>
                <TendencyChartGuide
                  pitchZoneData={activeSetData?.pitchZoneData}
                  pitchLocationData={activeSetData?.pitchLocationData}
                  filters={activeFilters}
                />
                <PitchTypeTable data={activeSetData?.pitchTypeData || []} outcomeData={activeSetData?.outcomeData} filters={activeFilters} />
              </>
            )}
          </Content>
        </Layout>
      </Layout>
      </>
    </ConfigProvider>
  )
}

export default function App() {
  const [page, setPage] = useState('home')

  if (page === 'home') {
    return <LandingPage onNavigate={setPage} />
  }

  if (page === 'features') {
    return <FeaturesPage page={page} onNavigate={setPage} />
  }

  if (page === 'prediction') {
    return <PitchPredictionPage page={page} onNavigate={setPage} />
  }

  return <HistoricalDataPage page={page} onNavigate={setPage} />
}
