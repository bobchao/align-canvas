import { useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';

/**
 * Global keyboard shortcuts:
 *  - Cmd/Ctrl+Z       -> undo
 *  - Cmd/Ctrl+Shift+Z -> redo
 *  - Cmd/Ctrl+Y       -> redo (Windows alt)
 *  - Escape           -> clear highlight / selection
 */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const meta = e.metaKey || e.ctrlKey;

      if (meta && (e.key === 'z' || e.key === 'Z')) {
        if (inEditable && !e.shiftKey) return;
        e.preventDefault();
        if (e.shiftKey) {
          useGraphStore.getState().redo();
        } else {
          useGraphStore.getState().undo();
        }
        return;
      }
      if (meta && (e.key === 'y' || e.key === 'Y')) {
        if (inEditable) return;
        e.preventDefault();
        useGraphStore.getState().redo();
        return;
      }
      if (e.key === 'Escape') {
        useGraphStore.getState().setHighlightSeed(null);
        useGraphStore.getState().setSelectedKpi(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
