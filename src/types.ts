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
  exportedAt: number;
}

export interface Preferences {
  layoutDirection: 'LR' | 'TB';
}

export const DEFAULT_PREFERENCES: Preferences = {
  layoutDirection: 'LR',
};

export const KPI_COLOR_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
];
