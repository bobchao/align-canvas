import { useEffect, useRef } from 'react';
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
        const payload = await loadPersistedState();
        useGraphStore.getState().hydrate(payload);
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
        useGraphStore.setState({ hydrated: true });
      }
    })();
  }, []);

  useEffect(() => {
    const save = debounce(() => {
      const { kpis, relations, preferences, hydrated: h } = useGraphStore.getState();
      if (!h) return;
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
