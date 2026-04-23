import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import { KpiCanvas } from './canvas/KpiCanvas';
import { BatchAddDialog } from './panels/BatchAddDialog';
import { ImportDialog } from './panels/ImportDialog';
import { KpiInspector } from './panels/KpiInspector';
import { RelationEditor } from './panels/RelationEditor';
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

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const colorNames = useGraphStore((s) => s.colorNames);
  const replaceAll = useGraphStore((s) => s.replaceAll);
  const addKpi = useGraphStore((s) => s.addKpi);
  const addRelation = useGraphStore((s) => s.addRelation);
  const selectedKpiId = useGraphStore((s) => s.selectedKpiId);
  const selectedKpiIds = useGraphStore((s) => s.selectedKpiIds);
  const setSelectedKpi = useGraphStore((s) => s.setSelectedKpi);
  const setHighlightSeed = useGraphStore((s) => s.setHighlightSeed);
  const urlImportConflict = useGraphStore((s) => s.urlImportConflict);
  const clearUrlImportConflict = useGraphStore((s) => s.clearUrlImportConflict);
  const hydrate = useGraphStore((s) => s.hydrate);

  const [batchOpen, setBatchOpen] = useState(false);
  const [activeRelationId, setActiveRelationId] = useState<string | null>(null);
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
      toast('error', '建立失敗（可能已存在相同方向的關係）');
      return;
    }
    toast('success', '已建立關係');
    setActiveRelationId(created.id);
  }, [addRelation]);

  const openEditRelation = useCallback((relationId: string) => {
    setSelectedKpi(null);
    setHighlightSeed(null);
    setSettingsOpen(false);
    setActiveRelationId(relationId);
  }, [setSelectedKpi, setHighlightSeed]);

  useEffect(() => {
    if (selectedKpiId) {
      setActiveRelationId(null);
      setSettingsOpen(false);
    }
  }, [selectedKpiId]);

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
        載入中…
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
            const created = addKpi({ name: `指標 ${kpis.length + 1}` });
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
            {isEmpty ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto panel max-w-sm p-6 text-center">
                  <h2 className="text-base font-semibold text-emerald-50">
                    開始打造你的 KPI 關係畫布
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-200">
                    先批次新增一批指標，再拖拉兩個節點之間建立關係，最後點擊指標查看它受誰影響、又影響了誰。
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
                      onClick={() => setBatchOpen(true)}
                    >
                      <Plus size={14} /> 批次新增
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        addKpi({ name: '營收' })
                      }
                    >
                      新增範例指標
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
            replaceAll(importPreview, '匯入（覆蓋）');
            toast('success', '已匯入並覆蓋畫布');
            setImportPreview(null);
          }}
          onMerge={() => {
            if (!importPreview) return;
            const merged = mergeImports({ kpis, relations, colorNames }, importPreview);
            replaceAll(merged, '匯入（合併）');
            toast('success', '已合併匯入資料');
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
            });
            toast('info', '已保留本機畫布');
          }}
          onConfirm={() => {
            if (!urlImportConflict) return;
            const { remote } = urlImportConflict;
            replaceAll(remote, '從網址匯入');
            clearUrlImportConflict();
            toast('success', '已從網址匯入並寫入本機');
          }}
        />

        <ToastViewport />
      </div>
    </ReactFlowProvider>
  );
}
