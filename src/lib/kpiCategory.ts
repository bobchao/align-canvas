import type { KPI } from '../types';
import {
  DEFAULT_KPI_CATEGORY_COLOR,
  KPI_COLOR_LABELS,
  KPI_COLOR_PALETTE,
} from '../types';

/** 未存主分類欄位時的 effective primary（預設灰）。 */
export function kpiEffectivePrimaryColor(k: KPI): string {
  return k.primaryCategoryColor ?? k.color ?? DEFAULT_KPI_CATEGORY_COLOR;
}

/** 節點上所有歸屬分類（主分類＋次分類，去重、不含空值）。用於分類高亮。 */
export function kpiAllCategoryColors(k: KPI): string[] {
  const primary = kpiEffectivePrimaryColor(k);
  const raw: string[] = [primary];
  for (const c of k.secondaryCategoryColors ?? []) {
    if (c) raw.push(c);
  }
  return Array.from(new Set(raw));
}

/** 顯示用主色（Primary owner）。 */
export function kpiDisplayColor(k: KPI): string {
  return kpiEffectivePrimaryColor(k);
}

/** 主分類兩欄皆空（舊資料）時寫入預設灰。 */
export function withDefaultPrimaryCategory(k: KPI): KPI {
  if (k.color != null || k.primaryCategoryColor != null) return k;
  return {
    ...k,
    color: DEFAULT_KPI_CATEGORY_COLOR,
    primaryCategoryColor: DEFAULT_KPI_CATEGORY_COLOR,
  };
}

export function normalizeKpisDefaultPrimary(kpis: KPI[]): KPI[] {
  return kpis.map(withDefaultPrimaryCategory);
}

/** 次分類數量（用於 +N badge）。 */
export function kpiSecondaryCount(k: KPI): number {
  return (k.secondaryCategoryColors ?? []).length;
}

/** 某分類顏色是否歸屬此 KPI。 */
export function kpiHasCategoryColor(k: KPI, color: string): boolean {
  return kpiAllCategoryColors(k).includes(color);
}

/** 盤點每個分類顏色被幾個 KPI 使用（一個 KPI 可貢獻多個分類各 +1）。 */
export function countKpisByCategoryColor(kpis: KPI[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const k of kpis) {
    for (const c of kpiAllCategoryColors(k)) {
      acc[c] = (acc[c] ?? 0) + 1;
    }
  }
  return acc;
}

const paletteIndex = (c: string) => {
  const i = KPI_COLOR_PALETTE.indexOf(c);
  return i === -1 ? 10_000 : i;
};

/** 畫布／節點顯示：主分類第一，其餘依 palette 灰→紅→… 順序；不屬 palette 的 hex 排在後面。 */
export function orderedCategoryColorsForDisplay(k: KPI): string[] {
  const all = kpiAllCategoryColors(k);
  if (all.length === 0) return [];
  const primary = kpiEffectivePrimaryColor(k);
  if (!all.includes(primary)) {
    return [...all].sort(
      (a, b) => paletteIndex(a) - paletteIndex(b) || a.localeCompare(b),
    );
  }
  const rest = all.filter((c) => c !== primary);
  rest.sort(
    (a, b) => paletteIndex(a) - paletteIndex(b) || a.localeCompare(b),
  );
  return [primary, ...rest];
}

export function categoryDisplayLabel(
  c: string,
  colorNames: Record<string, string>,
): string {
  return colorNames[c] || KPI_COLOR_LABELS[c] || c;
}
