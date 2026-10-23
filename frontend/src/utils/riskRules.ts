export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel';

export interface RiskMeta {
  level: RiskLevel;
  score: number;
  color: string;
  badgeClass: string;
  description: string;
}

export const RISK_DEFINITIONS: Record<RiskLevel, RiskMeta> = {
  Low: {
    level: 'Low',
    score: 1,
    color: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Safe driving conditions with minimal atmospheric hazard.',
  },
  Moderate: {
    level: 'Moderate',
    score: 2,
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Noticeable weather impact. Increased stopping distance and minor steering adjustments needed.',
  },
  High: {
    level: 'High',
    score: 3,
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Hazardous conditions. Reduced visibility, hydroplaning, or moderate crosswind gusts.',
  },
  Severe: {
    level: 'Severe',
    score: 4,
    color: '#f97316',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Extremely hazardous. High rollover danger or near-zero traction.',
  },
  'No Travel': {
    level: 'No Travel',
    score: 5,
    color: '#ef4444',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    description: 'Road shutdown or imminent rollover risk. Commercial truck operations should halt.',
  },
};

export const CONDITION_THRESHOLDS = {
  wind_mph: [
    { level: 'Low' as RiskLevel, range: '< 25 mph' },
    { level: 'Moderate' as RiskLevel, range: '25–34 mph' },
    { level: 'High' as RiskLevel, range: '35–44 mph' },
    { level: 'Severe' as RiskLevel, range: '45–54 mph' },
    { level: 'No Travel' as RiskLevel, range: '≥ 55 mph' },
  ],
  rain_in_hr: [
    { level: 'Low' as RiskLevel, range: '< 0.10 in/hr' },
    { level: 'Moderate' as RiskLevel, range: '0.10–0.25 in/hr' },
    { level: 'High' as RiskLevel, range: '0.25–0.50 in/hr' },
    { level: 'Severe' as RiskLevel, range: '0.50–1.00 in/hr' },
    { level: 'No Travel' as RiskLevel, range: '> 1.00 in/hr' },
  ],
  snow_in_hr: [
    { level: 'Low' as RiskLevel, range: '< 0.5 in/hr' },
    { level: 'Moderate' as RiskLevel, range: '0.5–1.0 in/hr' },
    { level: 'High' as RiskLevel, range: '1.0–2.0 in/hr' },
    { level: 'Severe' as RiskLevel, range: '2.0–3.0 in/hr' },
    { level: 'No Travel' as RiskLevel, range: '> 3.0 in/hr' },
  ],
};

export const LOAD_RULES = [
  {
    id: 'rule_55_any',
    label: '≥ 55 mph Wind',
    rule: 'No Travel for any load',
  },
  {
    id: 'rule_45_30k',
    label: '45–54 mph Wind + > 30,000 lb',
    rule: 'Escalates to No Travel',
  },
  {
    id: 'rule_35_40k',
    label: '35–44 mph Wind + > 40,000 lb',
    rule: 'Escalates to Severe',
  },
];
