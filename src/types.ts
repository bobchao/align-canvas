export type RelationDirection = 'positive' | 'negative';
export type RelationStrength = 'direct' | 'indirect';

export interface KPI {
  id: string;
  name: string;
  note?: string;
  color?: string;
  position?: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  direction: RelationDirection;
  strength: RelationStrength;
  note?: string;
  createdAt: number;
}

export interface GraphSnapshot {
  version: 1;
  kpis: KPI[];
  relations: Relation[];
  colorNames?: Record<string, string>;
  exportedAt: number;
}

export interface Preferences {
  layoutDirection: 'LR' | 'TB';
}

export const DEFAULT_PREFERENCES: Preferences = {
  layoutDirection: 'LR',
};

export const KPI_COLOR_PALETTE = [
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#4f46e5',
  '#a855f7',
  '#f8fafc',
];

export const KPI_COLOR_LABELS: Record<string, string> = {
  '#64748b': '灰',
  '#ef4444': '紅',
  '#f97316': '橙',
  '#eab308': '黃',
  '#22c55e': '綠',
  '#3b82f6': '藍',
  '#4f46e5': '靛',
  '#a855f7': '紫',
  '#f8fafc': '白',
};
