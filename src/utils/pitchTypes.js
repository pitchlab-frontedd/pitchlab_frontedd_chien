export const ALL_PITCH_TYPES = [
  'FF', 'SI', 'SL', 'CH', 'CU', 'FC', 'ST', 'FS',
  'KC', 'SV', 'CS', 'KN', 'FO', 'FA', 'EP', 'SC',
]

export const PITCH_TYPE_LABELS = {
  FF: 'Four Seamer',
  SI: 'Sinker',
  SL: 'Slider',
  CH: 'Changeup',
  CU: 'Curveball',
  FC: 'Cutter',
  ST: 'Sweeper',
  FS: 'Splitter',
  KC: 'Knuckle Curve',
  SV: 'Slurve',
  CS: 'Slow Curve',
  KN: 'Knuckleball',
  FO: 'Forkball',
  FA: 'Fastball',
  EP: 'Eephus',
  SC: 'Screwball',
}

export const PITCH_TYPE_COLORS = {
  FF: '#ff5c7a',
  SI: '#fb923c',
  SL: '#4ade80',
  CH: '#22c55e',
  CU: '#22d3ee',
  FC: '#a78bfa',
  ST: '#f59e0b',
  FS: '#38bdf8',
  KC: '#67e8f9',
  SV: '#c084fc',
  CS: '#7dd3fc',
  KN: '#f9a8d4',
  FO: '#fde68a',
  FA: '#f87171',
  EP: '#bef264',
  SC: '#facc15',
}

export function pitchTypeLabel(code) {
  return PITCH_TYPE_LABELS[code] || code || 'Unknown'
}

export function pitchTypeColor(code) {
  return PITCH_TYPE_COLORS[code] || '#cbd5e1'
}
