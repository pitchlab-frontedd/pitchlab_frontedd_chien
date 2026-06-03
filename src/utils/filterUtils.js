// 1. 預設過濾器
export const DEFAULT_FILTERS = {
  batterId: '', // 保持空白，讓 App.jsx 載入 API 資料後自動選第一個
  season: [],
  pitcherIds: [],
  pitcherLabels: [],
  pitcherHands: '', // ✅ 這裡你已經正確改成單選字串了！
  batterHand: '',
  pitcherRoles: [],
  pitchTypes: [],
  zones: [],
  counts: [],
  outs: 'All',
  runnerState: 'All',
  runnerBases: { first: false, second: false, third: false },
}

/**
 * 核心翻譯器：將 Statcast 的原始代碼轉換為前端需要的標籤
 * 防止 p.result 找不到的情況
 */
const getResultType = (p) => {
  if (p.type === 'B') return 'ball';
  if (p.description === 'called_strike') return 'called_strike';
  if (p.description?.includes('swinging_strike')) return 'swinging_strike';
  if (p.description === 'foul') return 'foul';
  if (p.type === 'X') {
    // 加上安全判斷，避免 events 為 null 時報錯
    return (p.events && p.events.includes('out')) ? 'in_play_out' : 'in_play_hit';
  }
  return 'other';
};

const HIT_EVENTS = new Set(['single', 'double', 'triple', 'home_run'])
const OUT_EVENTS = new Set([
  'field_out', 'strikeout', 'force_out', 'grounded_into_double_play',
  'fielders_choice', 'fielders_choice_out', 'double_play',
  'sac_fly', 'sac_bunt', 'strikeout_double_play',
])
const AT_BAT_EVENTS = new Set([...HIT_EVENTS, ...OUT_EVENTS, 'field_error'])
const ON_BASE_EVENTS = new Set([...HIT_EVENTS, 'walk', 'intent_walk', 'hit_by_pitch'])
const TOTAL_BASES_BY_EVENT = {
  single: 1,
  double: 2,
  triple: 3,
  home_run: 4,
}
const WOBA_WEIGHTS = {
  walk: 0.69,
  intent_walk: 0.69,
  hit_by_pitch: 0.72,
  single: 0.88,
  double: 1.25,
  triple: 1.58,
  home_run: 2.03,
}

const average = (sum, count, digits = 1) => (
  count > 0 ? +(sum / count).toFixed(digits) : null
)

/**
 * 過濾邏輯：確保 ID 全部轉為字串進行比對，並支援單選投手或打者
 */
export function filterPitches(pitches, filters) {
  // ✨ 修正 1：移除 !filters.batterId 的限制，允許單查投手
  if (!pitches || pitches.length === 0) return [];
  
  return pitches.filter(p => {
    // ✨ 修正 2：確保能正確抓到後端 API 的 ID 欄位，並強制轉為字串
    const bId = String(p.batter || p.batter_id || p.batterId || "");
    const pId = String(p.pitcher || p.pitcher_id || p.pitcherId || "");

    // 1. 比對打者 ID (只有在 filters.batterId 有值時才檢查)
    if (filters.batterId && filters.batterId !== "") {
      if (bId !== String(filters.batterId)) return false;
    }
    
    // 2. 比對年份 (Statcast 原始欄位是 game_date: "2024-04-05")
   const year = p.game_date ? p.game_date.split('-')[0] : null;
    if (filters.season && filters.season !== "") {
      if (year !== filters.season) return false;
    }

    // 3. 比對投手 (只有在左側面板有選擇投手時才檢查)
    if (filters.pitcherIds?.length > 0) {
      if (!filters.pitcherIds.includes(pId)) return false;
    }

    // ✨✨✨ 新增這裡：比對投手左右手 (Pitcher Hand 單選邏輯) ✨✨✨
    if (filters.pitcherHands && filters.pitcherHands !== "") {
      // CSV 裡面的欄位叫 p_throws，值會是 'R' 或 'L'
      if (p.p_throws !== filters.pitcherHands) return false;
    }

    if (filters.batterHand && filters.batterHand !== "") {
      if (p.stand !== filters.batterHand) return false;
    }

    // 4. 比對球種與好球帶
    if (filters.pitchTypes?.length && !filters.pitchTypes.includes(p.pitch_type)) return false;
    if (filters.zones?.length && !filters.zones.includes(p.zone)) return false;
    
    // 5. 比對 Count (balls-strikes)
    if (filters.counts?.length) {
      const currentCount = `${p.balls}-${p.strikes}`;
      if (!filters.counts.includes(currentCount)) return false;
    }

    if (filters.outs && filters.outs !== 'All') {
      if (String(p.outs_when_up) !== String(filters.outs)) return false;
    }

    if (filters.runnerState && filters.runnerState !== 'All') {
      const bases = filters.runnerState === 'Empty'
        ? { first: false, second: false, third: false }
        : filters.runnerBases || {};

      const hasFirst = Number(p.on_1b || 0) > 0;
      const hasSecond = Number(p.on_2b || 0) > 0;
      const hasThird = Number(p.on_3b || 0) > 0;

      if (hasFirst !== Boolean(bases.first)) return false;
      if (hasSecond !== Boolean(bases.second)) return false;
      if (hasThird !== Boolean(bases.third)) return false;
    }

    if (filters.pitcherRole && filters.pitcherRole !== 'All') {
      if (p.role !== filters.pitcherRole) return false;
    }
    
    if (filters.pitcherRoles?.length > 0) {
      if (!filters.pitcherRoles.includes(p.role)) return false;
    }
    // 通過所有過濾條件，保留這顆球！
    return true;
  });
}

// 2. 統計結果分類
export function aggregateByResult(pitches) {
  if (!pitches || pitches.length === 0) return [];
  const ORDER = ['ball', 'called_strike', 'swinging_strike', 'foul', 'in_play_out', 'in_play_hit'];
  const counts = {};
  
  pitches.forEach(p => { 
    const res = getResultType(p);
    counts[res] = (counts[res] || 0) + 1;
  });
  
  return ORDER
    .filter(r => counts[r] > 0)
    .map(r => ({ 
      result: r, 
      count: counts[r], 
      pct: +((counts[r] / pitches.length) * 100).toFixed(1) 
    }));
}

// 3. 統計球種佔比
export function aggregateByPitchType(pitches) {
  if (!pitches || pitches.length === 0) return [];
  const byType = {};
  
  pitches.forEach(p => {
    const type = p.pitch_type || 'Unknown';
    if (!byType[type]) {
      byType[type] = {
        total: 0, ball: 0, called_strike: 0, swinging_strike: 0, foul: 0, in_play_out: 0, in_play_hit: 0,
        rhb: 0, lhb: 0, speedSum: 0, speedCount: 0,
        pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, so: 0, bbe: 0,
        totalBases: 0, wobaNumerator: 0, wobaDenominator: 0, twoStrikePitches: 0, putAway: 0,
      };
    }
    byType[type].total++;
    const rType = getResultType(p);
    if (byType[type][rType] !== undefined) byType[type][rType]++;

    if (p.stand === 'R') byType[type].rhb++;
    if (p.stand === 'L') byType[type].lhb++;

    const speed = Number(p.release_speed ?? p.speed);
    if (Number.isFinite(speed)) {
      byType[type].speedSum += speed;
      byType[type].speedCount++;
    }

    const event = p.events || '';
    if (event) {
      byType[type].pa++;
      if (AT_BAT_EVENTS.has(event)) byType[type].ab++;
      if (HIT_EVENTS.has(event)) byType[type].h++;
      if (event === 'single') byType[type].singles++;
      if (event === 'double') byType[type].doubles++;
      if (event === 'triple') byType[type].triples++;
      if (event === 'home_run') byType[type].hr++;
      if (event === 'strikeout') byType[type].so++;
      byType[type].totalBases += TOTAL_BASES_BY_EVENT[event] || 0;
      byType[type].wobaNumerator += WOBA_WEIGHTS[event] || 0;
      if (ON_BASE_EVENTS.has(event) || AT_BAT_EVENTS.has(event)) byType[type].wobaDenominator++;
    }

    if (['in_play_out', 'in_play_hit'].includes(rType)) byType[type].bbe++;
    if (Number(p.strikes) === 2) {
      byType[type].twoStrikePitches++;
      if (event === 'strikeout') byType[type].putAway++;
    }
  });

  return Object.entries(byType)
    .map(([type, d]) => {
      const swingAttempts = d.swinging_strike + d.foul + d.in_play_out + d.in_play_hit;
      return {
        pitchType: type,
        count: d.total,
        rhb: d.rhb || null,
        lhb: d.lhb || null,
        pct: +((d.total / pitches.length) * 100).toFixed(1),
        mph: average(d.speedSum, d.speedCount, 1),
        pa: d.pa,
        ab: d.ab,
        h: d.h,
        singles: d.singles,
        doubles: d.doubles,
        triples: d.triples,
        hr: d.hr,
        so: d.so,
        bbe: d.bbe,
        ba: average(d.h, d.ab, 3),
        slg: average(d.totalBases, d.ab, 3),
        woba: average(d.wobaNumerator, d.wobaDenominator, 3),
        ballPct: +((d.ball / d.total) * 100).toFixed(1),
        cswPct: +(((d.called_strike + d.swinging_strike) / d.total) * 100).toFixed(1),
        whiffPct: swingAttempts > 0 ? +((d.swinging_strike / swingAttempts) * 100).toFixed(1) : 0,
        putAwayPct: d.twoStrikePitches > 0 ? +((d.putAway / d.twoStrikePitches) * 100).toFixed(1) : 0,
        inPlayPct: +(((d.in_play_out + d.in_play_hit) / d.total) * 100).toFixed(1),
        hitPct: +((d.in_play_hit / d.total) * 100).toFixed(1),
      };
    })
    .sort((a, b) => b.count - a.count);
}

// 4. 統計九宮格數據
export function aggregateByZone(pitches) {
  const byZone = {};
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14].forEach(z => {
    byZone[z] = { total: 0, ball: 0, called_strike: 0, swinging_strike: 0, foul: 0, in_play_out: 0, in_play_hit: 0 };
  })
  
  if (!pitches || pitches.length === 0) return byZone;

  pitches.forEach(p => {
    const res = getResultType(p);
    const z = parseInt(p.zone);
    if (byZone[z]) {
      byZone[z].total++;
      if (byZone[z][res] !== undefined) byZone[z][res]++;
    }
  });

  return Object.fromEntries(
    Object.entries(byZone).map(([zone, d]) => {
      const swingAttempts = d.swinging_strike + d.foul + d.in_play_out + d.in_play_hit;
      return [+zone, {
        ...d,
        whiffRate: swingAttempts > 0 ? d.swinging_strike / swingAttempts : 0,
        outRate: d.total > 0 ? d.in_play_out / d.total : 0,
        foulRate: d.total > 0 ? d.foul / d.total : 0,
      }];
    })
  );
}

// 5. 統計總覽指標
export function getSummaryStats(pitches) {
  if (!pitches || pitches.length === 0) return null;
  const stats = { n: pitches.length, cs: 0, ss: 0, ball: 0, swings: 0, inPlay: 0, hits: 0 };

  pitches.forEach(p => {
    const res = getResultType(p);
    if (res === 'called_strike') stats.cs++;
    if (res === 'swinging_strike') stats.ss++;
    if (res === 'ball') stats.ball++;
    if (['swinging_strike', 'foul', 'in_play_out', 'in_play_hit'].includes(res)) stats.swings++;
    if (['in_play_out', 'in_play_hit'].includes(res)) stats.inPlay++;
    if (res === 'in_play_hit') stats.hits++;
  });

  return {
    total: stats.n,
    strikeRate: +(((stats.n - stats.ball) / stats.n) * 100).toFixed(1),
    swingRate: +((stats.swings / stats.n) * 100).toFixed(1),
    whiffRate: stats.swings > 0 ? +((stats.ss / stats.swings) * 100).toFixed(1) : 0,
    cswRate: +(((stats.cs + stats.ss) / stats.n) * 100).toFixed(1),
    babip: stats.inPlay > 0 ? +((stats.hits / stats.inPlay) * 100).toFixed(1) : 0,
  };
}
