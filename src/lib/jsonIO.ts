import type {
  GraphSnapshot,
  KPI,
  MetricRole,
  Perspective,
  PerspectiveMetricRoles,
  Relation,
  ParsedImport,
} from '../types';
import { GRAPH_SNAPSHOT_VERSION } from '../types';

export type { ParsedImport };

function isMetricRole(v: unknown): v is MetricRole {
  return v === 'controllable_input' || v === 'output';
}

function normalizePerspectives(raw: unknown): Perspective[] {
  if (!Array.isArray(raw)) return [];
  const out: Perspective[] = [];
  for (const p of raw) {
    if (
      !p ||
      typeof p !== 'object' ||
      typeof (p as Perspective).id !== 'string' ||
      typeof (p as Perspective).name !== 'string'
    ) {
      throw new Error('perspectives 資料格式錯誤');
    }
    out.push({
      id: (p as Perspective).id.trim(),
      name: (p as Perspective).name.trim(),
    });
  }
  return out;
}

function normalizeMetricRoles(raw: unknown): PerspectiveMetricRoles {
  if (raw == null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('metricRoles 資料格式錯誤');
  }
  const obj = raw as Record<string, unknown>;
  const next: PerspectiveMetricRoles = {};
  for (const perspectiveId of Object.keys(obj)) {
    if (typeof perspectiveId !== 'string' || !perspectiveId) {
      throw new Error('metricRoles 資料格式錯誤');
    }
    const inner = obj[perspectiveId];
    if (inner == null) {
      next[perspectiveId] = {};
      continue;
    }
    if (typeof inner !== 'object' || Array.isArray(inner)) {
      throw new Error('metricRoles 資料格式錯誤');
    }
    const innerMap: Record<string, MetricRole> = {};
    for (const kpiId of Object.keys(inner as object)) {
      const val = (inner as Record<string, unknown>)[kpiId];
      if (!isMetricRole(val)) {
        throw new Error('metricRoles 內含無效的角色值');
      }
      innerMap[kpiId] = val;
    }
    next[perspectiveId] = innerMap;
  }
  return next;
}

export function buildSnapshot(
  kpis: KPI[],
  relations: Relation[],
  colorNames: Record<string, string> = {},
  perspectives: Perspective[] = [],
  metricRoles: PerspectiveMetricRoles = {},
): GraphSnapshot {
  return {
    version: GRAPH_SNAPSHOT_VERSION,
    kpis,
    relations,
    colorNames,
    perspectives,
    metricRoles,
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

export function parseSnapshot(raw: string): ParsedImport {
  const obj = JSON.parse(raw) as unknown;
  if (!obj || typeof obj !== 'object') {
    throw new Error('匯入檔案格式錯誤');
  }
  const snapshot = obj as Partial<GraphSnapshot>;
  const ver = snapshot.version;
  if (ver !== 1 && ver !== GRAPH_SNAPSHOT_VERSION) {
    throw new Error(`不支援的檔案版本：${ver ?? '未知'}`);
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
  let perspectives: Perspective[] = [];
  let metricRoles: PerspectiveMetricRoles = {};
  if (ver === GRAPH_SNAPSHOT_VERSION) {
    perspectives = normalizePerspectives(snapshot.perspectives);
    metricRoles = normalizeMetricRoles(snapshot.metricRoles);
  }
  return {
    kpis: snapshot.kpis as KPI[],
    relations: snapshot.relations as Relation[],
    colorNames:
      snapshot.colorNames && typeof snapshot.colorNames === 'object'
        ? (snapshot.colorNames as Record<string, string>)
        : {},
    perspectives,
    metricRoles,
  };
}

export function mergeImports(
  existing: {
    kpis: KPI[];
    relations: Relation[];
    colorNames: Record<string, string>;
    perspectives: Perspective[];
    metricRoles: PerspectiveMetricRoles;
  },
  incoming: ParsedImport,
): ParsedImport {
  const kpiMap = new Map<string, KPI>();
  const relationMap = new Map<string, Relation>();
  for (const k of existing.kpis) kpiMap.set(k.id, k);
  for (const r of existing.relations) relationMap.set(r.id, r);
  for (const k of incoming.kpis) kpiMap.set(k.id, k);
  for (const r of incoming.relations) relationMap.set(r.id, r);

  const perspectiveById = new Map<string, Perspective>();
  for (const p of existing.perspectives) perspectiveById.set(p.id, p);
  for (const p of incoming.perspectives) perspectiveById.set(p.id, p);

  const mergedRoles: PerspectiveMetricRoles = { ...existing.metricRoles };
  for (const pid of Object.keys(incoming.metricRoles)) {
    mergedRoles[pid] = {
      ...(mergedRoles[pid] ?? {}),
      ...incoming.metricRoles[pid],
    };
  }

  return {
    kpis: Array.from(kpiMap.values()),
    relations: Array.from(relationMap.values()),
    colorNames: {
      ...existing.colorNames,
      ...incoming.colorNames,
    },
    perspectives: Array.from(perspectiveById.values()),
    metricRoles: mergedRoles,
  };
}
