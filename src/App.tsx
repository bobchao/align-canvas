import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useState } from 'react';
import { KpiCanvas } from './canvas/KpiCanvas';
import { BatchAddDialog } from './panels/BatchAddDialog';
import { ImportDialog } from './panels/ImportDialog';
import { KpiInspector } from './panels/KpiInspector';
import { RelationEditor, type RelationEditorMode } from './panels/RelationEditor';
import { Toolbar } from './panels/Toolbar';
import { useShortcuts } from './lib/useShortcuts';
import { usePersistence } from './store/usePersistence';
import { useGraphStore } from './store/useGraphStore';
import { ToastViewport, toast } from './ui/Toast';
import { mergeImports, type ParsedImport } from './lib/jsonIO';
import { Plus } from 'lucide-react';

export default function App() {
  const hydrated = usePersistence();
  useShortcuts();

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const replaceAll = useGraphStore((s) => s.replaceAll);
  const addKpi = useGraphStore((s) => s.addKpi);

  const [batchOpen, setBatchOpen] = useState(false);
  const [relationMode, setRelationMode] = useState<RelationEditorMode>(null);
  const [importPreview, setImportPreview] = useState<ParsedImport | null>(null);

  const openCreateRelation = useCallback((sourceId: string, targetId: string) => {
    setRelationMode({ kind: 'create', sourceId, targetId });
  }, []);

  const openEditRelation = useCallback((relationId: string) => {
    setRelationMode({ kind: 'edit', relationId });
  }, []);

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
          onImportChoice={(incoming) => setImportPreview(incoming)}
        />
        <main className="relative flex min-h-0 flex-1 gap-3 p-3">
          <section className="panel relative min-h-0 flex-1 overflow-hidden">
            <KpiCanvas
              onRequestCreateRelation={openCreateRelation}
              onEditRelation={openEditRelation}
            />
            {isEmpty ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="pointer-events-auto panel max-w-sm p-6 text-center">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    開始打造你的 KPI 關係畫布
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    先批次新增一批指標，再拖拉兩個節點之間建立關係，最後點擊指標查看它受誰影響、又影響了誰。
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      className="btn-primary"
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
          <KpiInspector />
        </main>

        <BatchAddDialog open={batchOpen} onClose={() => setBatchOpen(false)} />
        <RelationEditor mode={relationMode} onClose={() => setRelationMode(null)} />
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
            const merged = mergeImports({ kpis, relations }, importPreview);
            replaceAll(merged, '匯入（合併）');
            toast('success', '已合併匯入資料');
            setImportPreview(null);
          }}
        />

        <ToastViewport />
      </div>
    </ReactFlowProvider>
  );
}
