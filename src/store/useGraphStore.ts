import { create } from 'zustand';
import type {
  KPI,
  Preferences,
  Relation,
  RelationDirection,
  RelationStrength,
} from '../types';
import { DEFAULT_PREFERENCES } from '../types';
import { newId } from '../lib/ids';
import type { PersistedState } from './db';
import type { ParsedImport } from '../lib/jsonIO';

interface HistoryEntry {
  label: string;
  undo: () => void;
  redo: () => void;
}

interface GraphState {
  kpis: KPI[];
  relations: Relation[];
  preferences: Preferences;
  colorNames: Record<string, string>;

  /** UI-only: currently highlighted seed */
  highlightSeedId: string | null;
  /** UI-only: currently highlighted category color */
  highlightCategoryColor: string | null;
  /** UI-only: inspector selection */
  selectedKpiId: string | null;
  /** UI-only: current multi-selection (box select / shift select) */
  selectedKpiIds: string[];
  /** whether persisted state has been loaded (to avoid saving an empty state) */
  hydrated: boolean;
  /**
   * 從 ?import= 開啟且本機 IndexedDB 已有圖資時顯示確認，此期間不可寫入 IDB，避免以空狀態覆寫。
   */
  urlImportConflict: { remote: ParsedImport; local: PersistedState } | null;

  /** history stacks (not persisted) */
  past: HistoryEntry[];
  future: HistoryEntry[];

  hydrate(payload: {
    kpis: KPI[];
    relations: Relation[];
    preferences: Preferences;
    colorNames?: Record<string, string>;
  }): void;

  setPreferences(patch: Partial<Preferences>): void;

  addKpi(input: { name: string; note?: string; color?: string }): KPI;
  batchAddKpis(names: string[], defaultColor?: string): KPI[];
  updateKpi(id: string, patch: Partial<Pick<KPI, 'name' | 'note' | 'color'>>): void;
  updateKpiPosition(id: string, position: { x: number; y: number }): void;
  /** commit any pending transient positions as a single undoable batch */
  commitPositions(previous: Record<string, { x: number; y: number } | undefined>): void;
  removeKpi(id: string): void;
  updateKpiColors(ids: string[], color: string | undefined): void;

  addRelation(input: {
    sourceId: string;
    targetId: string;
    direction: RelationDirection;
    strength: RelationStrength;
    note?: string;
  }): Relation | null;
  updateRelation(id: string, patch: Partial<Pick<Relation, 'direction' | 'strength' | 'note'>>): void;
  removeRelation(id: string): void;

  setHighlightSeed(id: string | null): void;
  setHighlightCategory(color: string | null): void;
  setColorName(color: string, name: string): void;
  setSelectedKpi(id: string | null): void;
  setSelectedKpis(ids: string[]): void;

  /** imperative replacement used by import */
  replaceAll(
    payload: { kpis: KPI[]; relations: Relation[]; colorNames?: Record<string, string> },
    label?: string,
  ): void;

  clearUrlImportConflict(): void;
  /**
   * 有 ?import= 且本機已有圖：空畫布＋衝突旗標，直到使用者確認還原或載入遠端（此期間禁止 IDB 寫入）。
   */
  enterUrlImportStandbyForUrlConflict(
    local: PersistedState,
    remote: ParsedImport,
  ): void;

  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

const MAX_HISTORY = 100;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;
const NODE_GAP_X = 48;
const NODE_GAP_Y = 36;
const DEFAULT_START_POS = { x: 80, y: 80 };

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function findNonOverlappingPosition(
  existing: KPI[],
  start = DEFAULT_START_POS,
): { x: number; y: number } {
  const occupied = existing
    .filter((k) => k.position)
    .map((k) => ({
      x: k.position!.x,
      y: k.position!.y,
      w: NODE_WIDTH,
      h: NODE_HEIGHT,
    }));
  if (occupied.length === 0) return { ...start };

  // Scan row-by-row for the first slot with no overlap.
  const stepX = NODE_WIDTH + NODE_GAP_X;
  const stepY = NODE_HEIGHT + NODE_GAP_Y;
  for (let row = 0; row < 200; row++) {
    for (let col = 0; col < 40; col++) {
      const candidate = {
        x: start.x + col * stepX,
        y: start.y + row * stepY,
        w: NODE_WIDTH,
        h: NODE_HEIGHT,
      };
      const overlap = occupied.some((r) => rectsOverlap(candidate, r));
      if (!overlap) return { x: candidate.x, y: candidate.y };
    }
  }

  // Fallback, should almost never happen.
  const maxY = Math.max(...occupied.map((r) => r.y));
  return { x: start.x, y: maxY + stepY };
}

export const useGraphStore = create<GraphState>((set, get) => {
  /** push a history entry and clear the redo stack */
  const pushHistory = (entry: HistoryEntry) => {
    set((s) => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), entry],
      future: [],
    }));
  };

  return {
    kpis: [],
    relations: [],
    preferences: DEFAULT_PREFERENCES,
    colorNames: {},
    highlightSeedId: null,
    highlightCategoryColor: null,
    selectedKpiId: null,
    selectedKpiIds: [],
    hydrated: false,
    urlImportConflict: null,
    past: [],
    future: [],

    hydrate({ kpis, relations, preferences, colorNames = {} }) {
      set({
        kpis,
        relations,
        preferences,
        colorNames,
        hydrated: true,
        past: [],
        future: [],
        urlImportConflict: null,
      });
    },

    setPreferences(patch) {
      set((s) => ({ preferences: { ...s.preferences, ...patch } }));
    },

    addKpi({ name, note, color }) {
      const now = Date.now();
      const position = findNonOverlappingPosition(get().kpis);
      const kpi: KPI = {
        id: newId('kpi'),
        name: name.trim(),
        note,
        color,
        position,
        createdAt: now,
        updatedAt: now,
      };
      const apply = () => set((s) => ({ kpis: [...s.kpis, kpi] }));
      const revert = () => set((s) => ({ kpis: s.kpis.filter((k) => k.id !== kpi.id) }));
      apply();
      pushHistory({ label: `新增 ${kpi.name}`, undo: revert, redo: apply });
      return kpi;
    },

    batchAddKpis(names, defaultColor) {
      const now = Date.now();
      const existing = new Set(get().kpis.map((k) => k.name.trim().toLowerCase()));
      const unique = new Map<string, string>();
      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (existing.has(key) || unique.has(key)) continue;
        unique.set(key, name);
      }
      const created: KPI[] = Array.from(unique.values()).map((name) => ({
        id: newId('kpi'),
        name,
        color: defaultColor,
        createdAt: now,
        updatedAt: now,
      }));
      if (created.length === 0) return [];
      const ids = new Set(created.map((k) => k.id));
      const apply = () => set((s) => ({ kpis: [...s.kpis, ...created] }));
      const revert = () => set((s) => ({ kpis: s.kpis.filter((k) => !ids.has(k.id)) }));
      apply();
      pushHistory({
        label: `批次新增 ${created.length} 個指標`,
        undo: revert,
        redo: apply,
      });
      return created;
    },

    updateKpi(id, patch) {
      const prev = get().kpis.find((k) => k.id === id);
      if (!prev) return;
      const next: KPI = { ...prev, ...patch, updatedAt: Date.now() };
      const apply = () =>
        set((s) => ({ kpis: s.kpis.map((k) => (k.id === id ? next : k)) }));
      const revert = () =>
        set((s) => ({ kpis: s.kpis.map((k) => (k.id === id ? prev : k)) }));
      apply();
      pushHistory({ label: `編輯 ${prev.name}`, undo: revert, redo: apply });
    },

    updateKpiPosition(id, position) {
      // silent update, position changes are bundled via commitPositions
      set((s) => ({
        kpis: s.kpis.map((k) => (k.id === id ? { ...k, position } : k)),
      }));
    },

    commitPositions(previous) {
      const ids = Object.keys(previous);
      if (ids.length === 0) return;
      const after: Record<string, { x: number; y: number } | undefined> = {};
      for (const id of ids) {
        after[id] = get().kpis.find((k) => k.id === id)?.position;
      }
      const apply = () =>
        set((s) => ({
          kpis: s.kpis.map((k) => (ids.includes(k.id) ? { ...k, position: after[k.id] } : k)),
        }));
      const revert = () =>
        set((s) => ({
          kpis: s.kpis.map((k) => (ids.includes(k.id) ? { ...k, position: previous[k.id] } : k)),
        }));
      pushHistory({ label: '移動節點', undo: revert, redo: apply });
    },

    removeKpi(id) {
      const state = get();
      const kpi = state.kpis.find((k) => k.id === id);
      if (!kpi) return;
      const affectedRelations = state.relations.filter(
        (r) => r.sourceId === id || r.targetId === id,
      );
      const apply = () =>
        set((s) => {
          const nextKpis = s.kpis.filter((node) => node.id !== id);
          const hasRemainingSameColor =
            !!kpi.color && nextKpis.some((node) => node.color === kpi.color);
          return {
            kpis: nextKpis,
            relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
            selectedKpiId: s.selectedKpiId === id ? null : s.selectedKpiId,
            selectedKpiIds: s.selectedKpiIds.filter((x) => x !== id),
            highlightSeedId: s.highlightSeedId === id ? null : s.highlightSeedId,
            highlightCategoryColor:
              s.highlightCategoryColor === kpi.color && !hasRemainingSameColor
                ? null
                : s.highlightCategoryColor,
          };
        });
      const revert = () =>
        set((s) => ({
          kpis: [...s.kpis, kpi],
          relations: [...s.relations, ...affectedRelations],
        }));
      apply();
      pushHistory({
        label: `刪除 ${kpi.name}`,
        undo: revert,
        redo: apply,
      });
    },

    updateKpiColors(ids, color) {
      const uniqueIds = Array.from(new Set(ids));
      if (uniqueIds.length === 0) return;
      const before = get().kpis
        .filter((k) => uniqueIds.includes(k.id))
        .map((k) => ({ id: k.id, color: k.color, updatedAt: k.updatedAt }));
      if (before.length === 0) return;

      const apply = () =>
        set((s) => ({
          kpis: s.kpis.map((k) =>
            uniqueIds.includes(k.id)
              ? { ...k, color, updatedAt: Date.now() }
              : k,
          ),
        }));
      const revert = () =>
        set((s) => ({
          kpis: s.kpis.map((k) => {
            const prev = before.find((x) => x.id === k.id);
            return prev ? { ...k, color: prev.color, updatedAt: prev.updatedAt } : k;
          }),
        }));
      apply();
      pushHistory({
        label: uniqueIds.length > 1 ? `批次設定 ${uniqueIds.length} 個分類` : '設定分類',
        undo: revert,
        redo: apply,
      });
    },

    addRelation({ sourceId, targetId, direction, strength, note }) {
      if (sourceId === targetId) return null;
      const existing = get().relations.find(
        (r) => r.sourceId === sourceId && r.targetId === targetId,
      );
      if (existing) return null;
      const rel: Relation = {
        id: newId('rel'),
        sourceId,
        targetId,
        direction,
        strength,
        note,
        createdAt: Date.now(),
      };
      const apply = () => set((s) => ({ relations: [...s.relations, rel] }));
      const revert = () =>
        set((s) => ({ relations: s.relations.filter((r) => r.id !== rel.id) }));
      apply();
      pushHistory({ label: '新增關係', undo: revert, redo: apply });
      return rel;
    },

    updateRelation(id, patch) {
      const prev = get().relations.find((r) => r.id === id);
      if (!prev) return;
      const next: Relation = { ...prev, ...patch };
      const apply = () =>
        set((s) => ({ relations: s.relations.map((r) => (r.id === id ? next : r)) }));
      const revert = () =>
        set((s) => ({ relations: s.relations.map((r) => (r.id === id ? prev : r)) }));
      apply();
      pushHistory({ label: '編輯關係', undo: revert, redo: apply });
    },

    removeRelation(id) {
      const prev = get().relations.find((r) => r.id === id);
      if (!prev) return;
      const apply = () =>
        set((s) => ({ relations: s.relations.filter((r) => r.id !== id) }));
      const revert = () => set((s) => ({ relations: [...s.relations, prev] }));
      apply();
      pushHistory({ label: '刪除關係', undo: revert, redo: apply });
    },

    setHighlightSeed(id) {
      set({ highlightSeedId: id, highlightCategoryColor: null });
    },

    setHighlightCategory(color) {
      set({
        highlightCategoryColor: color,
        highlightSeedId: null,
      });
    },

    setColorName(color, name) {
      const trimmed = name.trim();
      set((s) => {
        if (!trimmed) {
          if (!(color in s.colorNames)) return s;
          const rest = { ...s.colorNames };
          delete rest[color];
          return { colorNames: rest };
        }
        if (s.colorNames[color] === trimmed) return s;
        return {
          colorNames: {
            ...s.colorNames,
            [color]: trimmed,
          },
        };
      });
    },

    setSelectedKpi(id) {
      const nextIds = id ? [id] : [];
      const prev = get();
      if (
        prev.selectedKpiId === id &&
        prev.selectedKpiIds.length === nextIds.length &&
        prev.selectedKpiIds.every((x, idx) => x === nextIds[idx])
      ) {
        return;
      }
      set({ selectedKpiId: id, selectedKpiIds: nextIds });
    },

    setSelectedKpis(ids) {
      const unique = Array.from(new Set(ids)).sort();
      const prev = get();
      if (
        prev.selectedKpiIds.length === unique.length &&
        prev.selectedKpiIds.every((x, idx) => x === unique[idx]) &&
        prev.selectedKpiId === (unique.length === 1 ? unique[0] : null)
      ) {
        return;
      }
      set({
        selectedKpiIds: unique,
        selectedKpiId: unique.length === 1 ? unique[0] : null,
      });
    },

    clearUrlImportConflict() {
      set({ urlImportConflict: null });
    },

    enterUrlImportStandbyForUrlConflict(local, remote) {
      set({
        kpis: [],
        relations: [],
        preferences: local.preferences,
        urlImportConflict: { remote, local: local },
        hydrated: true,
        past: [],
        future: [],
        selectedKpiId: null,
        selectedKpiIds: [],
        highlightSeedId: null,
        highlightCategoryColor: null,
      });
    },

    replaceAll({ kpis, relations, colorNames }, label = '匯入資料') {
      const prev = {
        kpis: get().kpis,
        relations: get().relations,
        colorNames: get().colorNames,
      };
      const apply = () =>
        set({
          kpis,
          relations,
          colorNames: colorNames ?? {},
          selectedKpiId: null,
          selectedKpiIds: [],
          highlightSeedId: null,
          highlightCategoryColor: null,
        });
      const revert = () =>
        set({
          kpis: prev.kpis,
          relations: prev.relations,
          colorNames: prev.colorNames,
        });
      apply();
      pushHistory({ label, undo: revert, redo: apply });
    },

    undo() {
      const { past } = get();
      if (past.length === 0) return;
      const entry = past[past.length - 1];
      entry.undo();
      set((s) => ({ past: s.past.slice(0, -1), future: [...s.future, entry] }));
    },

    redo() {
      const { future } = get();
      if (future.length === 0) return;
      const entry = future[future.length - 1];
      entry.redo();
      set((s) => ({ future: s.future.slice(0, -1), past: [...s.past, entry] }));
    },

    canUndo() {
      return get().past.length > 0;
    },

    canRedo() {
      return get().future.length > 0;
    },
  };
});
