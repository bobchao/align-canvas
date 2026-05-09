import { openDB, type IDBPDatabase } from 'idb';
import type {
  KPI,
  Perspective,
  PerspectiveMetricRoles,
  Preferences,
  Relation,
} from '../types';
import { DEFAULT_PREFERENCES } from '../types';

const DB_NAME = 'align-canvas-db';
const DB_VERSION = 2;

const KPI_STORE = 'kpis';
const REL_STORE = 'relations';
const META_STORE = 'meta';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(KPI_STORE)) {
          db.createObjectStore(KPI_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(REL_STORE)) {
          db.createObjectStore(REL_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export interface PersistedState {
  kpis: KPI[];
  relations: Relation[];
  preferences: Preferences;
  colorNames: Record<string, string>;
  perspectives: Perspective[];
  metricRoles: PerspectiveMetricRoles;
}

export async function loadPersistedState(): Promise<PersistedState> {
  const db = await getDb();
  const [kpis, relations, preferences, colorNames, perspectives, metricRoles] =
    await Promise.all([
      db.getAll(KPI_STORE) as Promise<KPI[]>,
      db.getAll(REL_STORE) as Promise<Relation[]>,
      db.get(META_STORE, 'preferences') as Promise<Preferences | undefined>,
      db.get(META_STORE, 'colorNames') as Promise<Record<string, string> | undefined>,
      db.get(META_STORE, 'perspectives') as Promise<Perspective[] | undefined>,
      db.get(META_STORE, 'metricRoles') as Promise<PerspectiveMetricRoles | undefined>,
    ]);
  return {
    kpis,
    relations,
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
    colorNames: colorNames ?? {},
    perspectives: Array.isArray(perspectives) ? perspectives : [],
    metricRoles:
      metricRoles && typeof metricRoles === 'object' && !Array.isArray(metricRoles)
        ? metricRoles
        : {},
  };
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([KPI_STORE, REL_STORE, META_STORE], 'readwrite');
  const kpiStore = tx.objectStore(KPI_STORE);
  const relStore = tx.objectStore(REL_STORE);
  const metaStore = tx.objectStore(META_STORE);

  await kpiStore.clear();
  await relStore.clear();
  for (const k of state.kpis) await kpiStore.put(k);
  for (const r of state.relations) await relStore.put(r);
  await metaStore.put(state.preferences, 'preferences');
  await metaStore.put(state.colorNames, 'colorNames');
  await metaStore.put(state.perspectives, 'perspectives');
  await metaStore.put(state.metricRoles, 'metricRoles');
  await metaStore.put(Date.now(), 'lastSavedAt');
  await tx.done;
}

export function debounce<T extends (...args: never[]) => unknown>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}
