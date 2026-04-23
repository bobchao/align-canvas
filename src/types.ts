export type RelationDirection = 'positive' | 'negative';
export type RelationStrength = 'direct' | 'indirect';

export interface KPI {
  id: string;
  name: string;
  note?: string;
  /** 與舊版相容；未設定 primary 時，分類/顯示可 fallback 至此 */
  color?: string;
  /** 主要擁有者分類顏色（決定節點主色） */
  primaryCategoryColor?: string;
  /** 其他歸屬分類顏色（多選；突顯任一分類時含主含次都會亮） */
  secondaryCategoryColors?: string[];
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
  /** 在節點上顯示所屬分類名稱（主優先、其餘依 palette 順序） */
  showKpiCategoryLabels: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  layoutDirection: 'LR',
  showKpiCategoryLabels: false,
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

/** 主分類未手動指定時的預設色（palette 第一色：灰） */
export const DEFAULT_KPI_CATEGORY_COLOR = KPI_COLOR_PALETTE[0];

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
