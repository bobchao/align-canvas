import type { GraphSnapshot, KPI, Relation } from '../types';

export function buildSnapshot(
  kpis: KPI[],
  relations: Relation[],
  colorNames: Record<string, string> = {},
): GraphSnapshot {
  return {
    version: 1,
    kpis,
    relations,
    colorNames,
    exportedAt: Date.now(),
  };
}

export function exportToFile(snapshot: GraphSnapshot) {
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  a.href = url;
  a.download = `align-canvas-${yyyy}${mm}${dd}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ParsedImport {
  /** KPI 可含 `primaryCategoryColor` / `secondaryCategoryColors`；舊檔僅有 `color` 仍有效 */
  kpis: KPI[];
  relations: Relation[];
  colorNames: Record<string, string>;
}

export function parseSnapshot(raw: string): ParsedImport {
  const obj = JSON.parse(raw) as unknown;
  if (!obj || typeof obj !== 'object') {
    throw new Error('匯入檔案格式錯誤');
  }
  const snapshot = obj as Partial<GraphSnapshot>;
  if (snapshot.version !== 1) {
    throw new Error(`不支援的檔案版本：${snapshot.version ?? '未知'}`);
  }
  if (!Array.isArray(snapshot.kpis) || !Array.isArray(snapshot.relations)) {
    throw new Error('匯入檔案缺少 kpis 或 relations 欄位');
  }
  for (const k of snapshot.kpis) {
    if (!k || typeof k.id !== 'string' || typeof k.name !== 'string') {
      throw new Error('KPI 資料格式錯誤');
    }
  }
  for (const r of snapshot.relations) {
    if (
      !r ||
      typeof r.id !== 'string' ||
      typeof r.sourceId !== 'string' ||
      typeof r.targetId !== 'string' ||
      (r.direction !== 'positive' && r.direction !== 'negative') ||
      (r.strength !== 'direct' && r.strength !== 'indirect')
    ) {
      throw new Error('Relation 資料格式錯誤');
    }
  }
  return {
    kpis: snapshot.kpis as KPI[],
    relations: snapshot.relations as Relation[],
    colorNames:
      snapshot.colorNames && typeof snapshot.colorNames === 'object'
        ? (snapshot.colorNames as Record<string, string>)
        : {},
  };
}

export function mergeImports(
  existing: { kpis: KPI[]; relations: Relation[]; colorNames: Record<string, string> },
  incoming: ParsedImport,
): ParsedImport {
  const kpiMap = new Map<string, KPI>();
  const relationMap = new Map<string, Relation>();
  for (const k of existing.kpis) kpiMap.set(k.id, k);
  for (const r of existing.relations) relationMap.set(r.id, r);
  for (const k of incoming.kpis) kpiMap.set(k.id, k);
  for (const r of incoming.relations) relationMap.set(r.id, r);
  return {
    kpis: Array.from(kpiMap.values()),
    relations: Array.from(relationMap.values()),
    colorNames: {
      ...existing.colorNames,
      ...incoming.colorNames,
    },
  };
}
