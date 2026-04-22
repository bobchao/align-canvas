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
        useGraphStore.getState().setSelectedKpis([]);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (inEditable) return;

        const {
          selectedKpiIds,
          selectedKpiId,
          relations,
          removeKpi,
          setSelectedKpis,
        } = useGraphStore.getState();

        const ids =
          selectedKpiIds.length > 0
            ? [...selectedKpiIds]
            : selectedKpiId
              ? [selectedKpiId]
              : [];
        if (ids.length === 0) return;

        e.preventDefault();

        const idSet = new Set(ids);
        const relatedEdgesCount = relations.filter(
          (r) => idSet.has(r.sourceId) || idSet.has(r.targetId),
        ).length;
        const needsConfirm = ids.length > 1 || relatedEdgesCount > 0;

        if (needsConfirm) {
          const message =
            ids.length > 1
              ? `確定要刪除這 ${ids.length} 個節點嗎？\\n相關連線也會一併刪除（可用 Cmd/Ctrl+Z 復原）。`
              : `此節點目前有 ${relatedEdgesCount} 條關聯連線。\\n確定要刪除嗎？`;
          const confirmed = window.confirm(message);
          if (!confirmed) return;
        }

        for (const id of ids) {
          removeKpi(id);
        }
        setSelectedKpis([]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
