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

export type MetricRole = 'controllable_input' | 'output';

export interface Perspective {
  id: string;
  name: string;
}

/** Sparse: perspectiveId -> kpiId -> role（未出現視為未標記） */
export type PerspectiveMetricRoles = Record<string, Record<string, MetricRole>>;

/** 匯入解析結果（v1 檔解析後 perspectives／metricRoles 為空） */
export interface ParsedImport {
  kpis: KPI[];
  relations: Relation[];
  colorNames: Record<string, string>;
  perspectives: Perspective[];
  metricRoles: PerspectiveMetricRoles;
}

export const GRAPH_SNAPSHOT_VERSION = 2 as const;

export type GraphSnapshot =
  | {
      version: 1;
      kpis: KPI[];
      relations: Relation[];
      colorNames?: Record<string, string>;
      exportedAt: number;
    }
  | {
      version: typeof GRAPH_SNAPSHOT_VERSION;
      kpis: KPI[];
      relations: Relation[];
      colorNames?: Record<string, string>;
      perspectives: Perspective[];
      metricRoles: PerspectiveMetricRoles;
      exportedAt: number;
    };

export interface Preferences {
  layoutDirection: 'LR' | 'TB';
  layoutSpacingPreset: 'compact' | 'comfortable' | 'wide';
  edgeRoutingMode: 'bezier' | 'smoothstep' | 'step';
  /** 在節點上顯示所屬分類名稱（主優先、其餘依 palette 順序） */
  showKpiCategoryLabels: boolean;
  /** 僅在本機 persisted；決定是否在畫布上編輯／顯示視角標記 */
  activePerspectiveId: string | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  layoutDirection: 'LR',
  layoutSpacingPreset: 'comfortable',
  edgeRoutingMode: 'bezier',
  showKpiCategoryLabels: false,
  activePerspectiveId: null,
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

/** Maps color hex codes to i18n translation keys under the "colors" namespace. */
export const KPI_COLOR_I18N_KEYS: Record<string, string> = {
  '#64748b': 'colors.gray',
  '#ef4444': 'colors.red',
  '#f97316': 'colors.orange',
  '#eab308': 'colors.yellow',
  '#22c55e': 'colors.green',
  '#3b82f6': 'colors.blue',
  '#4f46e5': 'colors.indigo',
  '#a855f7': 'colors.purple',
  '#f8fafc': 'colors.white',
};
