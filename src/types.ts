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
  '#22c55e',
  '#16a34a',
  '#0d9488',
  '#0ea5e9',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
];
