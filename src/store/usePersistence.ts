import { useEffect, useRef } from 'react';
import { parseSnapshot } from '../lib/jsonIO';
import {
  fetchTextFromRemoteUrl,
  getUrlImportParam,
  hasPersistedGraphData,
  isSafeRemoteUrlForFetch,
  removeUrlImportParamFromAddressBar,
} from '../lib/urlImportParam';
import { toast } from '../ui/Toast';
import { useGraphStore } from './useGraphStore';
import { debounce, loadPersistedState, savePersistedState } from './db';

/**
 * Hook that hydrates the store from IndexedDB on mount and writes back
 * on store changes (debounced).
 */
export function usePersistence() {
  const hydrated = useGraphStore((s) => s.hydrated);
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;
    (async () => {
      try {
        const persisted = await loadPersistedState();
        const importParam = getUrlImportParam();

        if (importParam) {
          if (!isSafeRemoteUrlForFetch(importParam)) {
            toast('error', '不支援的網址，請使用 http 或 https 的 JSON 連結');
            useGraphStore.getState().hydrate(persisted);
            removeUrlImportParamFromAddressBar();
            return;
          }
          try {
            const raw = await fetchTextFromRemoteUrl(importParam);
            const remote = parseSnapshot(raw);
            const hasLocal = hasPersistedGraphData(persisted);
            if (hasLocal) {
              useGraphStore
                .getState()
                .enterUrlImportStandbyForUrlConflict(persisted, remote);
            } else {
              useGraphStore.getState().hydrate({
                kpis: remote.kpis,
                relations: remote.relations,
                preferences: persisted.preferences,
              });
            }
            removeUrlImportParamFromAddressBar();
          } catch (err) {
            const msg = err instanceof Error ? err.message : '無法從網址讀入 JSON';
            console.error('URL import failed', err);
            toast('error', msg);
            useGraphStore.getState().hydrate(persisted);
            removeUrlImportParamFromAddressBar();
          }
        } else {
          useGraphStore.getState().hydrate(persisted);
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
        useGraphStore.setState({ hydrated: true });
      }
    })();
  }, []);

  useEffect(() => {
    const save = debounce(() => {
      const { kpis, relations, preferences, hydrated: h, urlImportConflict } = useGraphStore.getState();
      if (!h || urlImportConflict) return;
      savePersistedState({ kpis, relations, preferences }).catch((err) => {
        console.error('Failed to persist to IndexedDB', err);
      });
    }, 300);

    const unsub = useGraphStore.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (
        state.kpis !== prev.kpis ||
        state.relations !== prev.relations ||
        state.preferences !== prev.preferences
      ) {
        save();
      }
    });
    return () => {
      unsub();
    };
  }, []);

  return hydrated;
}
