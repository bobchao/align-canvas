import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KpiCanvas } from './canvas/KpiCanvas';
import { BatchAddDialog } from './panels/BatchAddDialog';
import { ImportDialog } from './panels/ImportDialog';
import { KpiInspector } from './panels/KpiInspector';
import { RelationEditor } from './panels/RelationEditor';
import { SearchBar } from './panels/SearchBar';
import { SettingsPanel } from './panels/SettingsPanel';
import { Toolbar } from './panels/Toolbar';
import { useShortcuts } from './lib/useShortcuts';
import { usePersistence } from './store/usePersistence';
import { useGraphStore } from './store/useGraphStore';
import { ToastViewport, toast } from './ui/Toast';
import { mergeImports, type ParsedImport } from './lib/jsonIO';
import { Plus } from 'lucide-react';
import { UrlImportConfirmDialog } from './panels/UrlImportConfirmDialog';

export default function App() {
  const hydrated = usePersistence();
  useShortcuts();
  const { t } = useTranslation();

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const colorNames = useGraphStore((s) => s.colorNames);
  const perspectives = useGraphStore((s) => s.perspectives);
  const metricRoles = useGraphStore((s) => s.metricRoles);
  const replaceAll = useGraphStore((s) => s.replaceAll);
  const addKpi = useGraphStore((s) => s.addKpi);
  const addRelation = useGraphStore((s) => s.addRelation);
  const selectedKpiId = useGraphStore((s) => s.selectedKpiId);
  const selectedKpiIds = useGraphStore((s) => s.selectedKpiIds);
  const setSelectedKpi = useGraphStore((s) => s.setSelectedKpi);
  const setHighlightSeed = useGraphStore((s) => s.setHighlightSeed);
  const activeRelationId = useGraphStore((s) => s.activeRelationId);
  const setActiveRelationId = useGraphStore((s) => s.setActiveRelationId);
  const urlImportConflict = useGraphStore((s) => s.urlImportConflict);
  const clearUrlImportConflict = useGraphStore((s) => s.clearUrlImportConflict);
  const hydrate = useGraphStore((s) => s.hydrate);
  const searchOpen = useGraphStore((s) => s.searchOpen);

  const [batchOpen, setBatchOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedImport | null>(null);
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('select');
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openCreateRelation = useCallback((sourceId: string, targetId: string) => {
    const created = addRelation({
      sourceId,
      targetId,
      direction: 'positive',
      strength: 'direct',
    });
    if (!created) {
      toast('error', t('app.toast.relationCreateFailed'));
      return;
    }
    toast('success', t('app.toast.relationCreated'));
    setSelectedKpi(null);
    setHighlightSeed(null);
    setSettingsOpen(false);
    setActiveRelationId(created.id);
  }, [addRelation, setActiveRelationId, setHighlightSeed, setSelectedKpi, t]);

  const openEditRelation = useCallback((relationId: string) => {
    setSelectedKpi(null);
    setHighlightSeed(null);
    setSettingsOpen(false);
    setActiveRelationId(relationId);
  }, [setSelectedKpi, setHighlightSeed, setActiveRelationId]);

  useEffect(() => {
    return useGraphStore.subscribe((state, prev) => {
      if (
        state.selectedKpiId &&
        state.selectedKpiId !== prev.selectedKpiId
      ) {
        setSettingsOpen(false);
      }
    });
  }, []);

  useEffect(() => {
    const inKpiDetailPanel =
      !settingsOpen && !activeRelationId && selectedKpiIds.length === 1;
    if (inKpiDetailPanel) {
      setHighlightSeed(selectedKpiIds[0]);
    } else {
      setHighlightSeed(null);
    }
  }, [settingsOpen, activeRelationId, selectedKpiIds, setHighlightSeed]);

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        {t('app.loading')}
      </div>
    );
  }

  const isEmpty = kpis.length === 0;

  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-col">
        <Toolbar
          onBatchAdd={() => setBatchOpen(true)}
          onQuickAdd={() => {
            const created = addKpi({ name: t('app.quickAddName', { number: kpis.length + 1 }) });
            setFocusNodeId(created.id);
            setSelectedKpi(created.id);
          }}
          interactionMode={interactionMode}
          onChangeInteractionMode={setInteractionMode}
          settingsOpen={settingsOpen}
          onOpenSettings={() => {
            setSettingsOpen(true);
            setActiveRelationId(null);
            setSelectedKpi(null);
            setHighlightSeed(null);
          }}
        />
        <main className="relative flex min-h-0 flex-1 gap-3 p-3">
          <section className="panel relative min-h-0 flex-1 overflow-hidden">
            <KpiCanvas
              onRequestCreateRelation={openCreateRelation}
              onEditRelation={openEditRelation}
              onClearRelationFocus={() => setActiveRelationId(null)}
              activeRelationId={activeRelationId}
              interactionMode={interactionMode}
              focusNodeId={focusNodeId}
              onFocusHandled={() => setFocusNodeId(null)}
            />
            {searchOpen ? <SearchBar /> : null}
            {isEmpty ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto panel max-w-sm p-6 text-center">
                  <h2 className="text-base font-semibold text-emerald-50">
                    {t('app.emptyState.title')}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-200">
                    {t('app.emptyState.desc')}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
                      onClick={() => setBatchOpen(true)}
                    >
                      <Plus size={14} /> {t('app.emptyState.batchAdd')}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => addKpi({ name: t('app.exampleKpiName') })}
                    >
                      {t('app.emptyState.addExample')}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          {settingsOpen ? (
            <SettingsPanel
              onClose={() => setSettingsOpen(false)}
              onImportChoice={(incoming) => setImportPreview(incoming)}
            />
          ) : activeRelationId && !selectedKpiId ? (
            <RelationEditor
              relationId={activeRelationId}
              onClose={() => setActiveRelationId(null)}
            />
          ) : (
            <KpiInspector />
          )}
        </main>

        <BatchAddDialog open={batchOpen} onClose={() => setBatchOpen(false)} />
        <ImportDialog
          open={!!importPreview}
          incoming={importPreview}
          currentStats={{ kpis: kpis.length, relations: relations.length }}
          onClose={() => setImportPreview(null)}
          onOverwrite={() => {
            if (!importPreview) return;
            replaceAll(importPreview, t('app.historyLabel.importOverwrite'));
            toast('success', t('app.toast.importOverwrite'));
            setImportPreview(null);
          }}
          onMerge={() => {
            if (!importPreview) return;
            const merged = mergeImports(
              { kpis, relations, colorNames, perspectives, metricRoles },
              importPreview,
            );
            replaceAll(merged, t('app.historyLabel.importMerge'));
            toast('success', t('app.toast.importMerge'));
            setImportPreview(null);
          }}
        />
        <UrlImportConfirmDialog
          open={!!urlImportConflict}
          remote={urlImportConflict?.remote ?? null}
          local={urlImportConflict?.local ?? null}
          onCancel={() => {
            if (!urlImportConflict) return;
            const { local } = urlImportConflict;
            hydrate({
              kpis: local.kpis,
              relations: local.relations,
              preferences: local.preferences,
              colorNames: local.colorNames,
              perspectives: local.perspectives,
              metricRoles: local.metricRoles,
            });
            toast('info', t('app.toast.keptLocal'));
          }}
          onConfirm={() => {
            if (!urlImportConflict) return;
            const { remote } = urlImportConflict;
            replaceAll(remote, t('app.historyLabel.importFromUrl'));
            clearUrlImportConflict();
            toast('success', t('app.toast.importedFromUrl'));
          }}
        />

        <ToastViewport />
      </div>
    </ReactFlowProvider>
  );
}
