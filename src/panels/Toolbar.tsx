import {
  Hand,
  Download,
  MousePointer2,
  LayoutDashboard,
  ListPlus,
  Plus,
  Redo2,
  Undo2,
  Upload,
} from 'lucide-react';
import { useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { buildSnapshot, exportToFile, parseSnapshot } from '../lib/jsonIO';
import { toast } from '../ui/Toast';
import { computeLayout } from '../canvas/layout';
import { KPI_COLOR_PALETTE } from '../types';

interface Props {
  onBatchAdd: () => void;
  onQuickAdd: () => void;
  onImportChoice: (incoming: { kpis: ReturnType<typeof parseSnapshot>['kpis']; relations: ReturnType<typeof parseSnapshot>['relations'] }) => void;
  interactionMode: 'pan' | 'select';
  onChangeInteractionMode: (mode: 'pan' | 'select') => void;
}

export function Toolbar({
  onBatchAdd,
  onQuickAdd,
  onImportChoice,
  interactionMode,
  onChangeInteractionMode,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const preferences = useGraphStore((s) => s.preferences);
  const setPreferences = useGraphStore((s) => s.setPreferences);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.past.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const commitPositions = useGraphStore((s) => s.commitPositions);
  const updateKpiPosition = useGraphStore((s) => s.updateKpiPosition);
  const highlightCategoryColor = useGraphStore((s) => s.highlightCategoryColor);
  const toggleHighlightCategory = useGraphStore((s) => s.toggleHighlightCategory);

  const handleExport = () => {
    if (kpis.length === 0) {
      toast('info', '目前沒有資料可匯出');
      return;
    }
    exportToFile(buildSnapshot(kpis, relations));
    toast('success', '已匯出 JSON');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSnapshot(text);
      onImportChoice(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '匯入失敗';
      toast('error', msg);
    }
  };

  const handleRelayout = () => {
    if (kpis.length === 0) return;
    const before: Record<string, { x: number; y: number } | undefined> = {};
    for (const k of kpis) before[k.id] = k.position ? { ...k.position } : undefined;
    const positions = computeLayout(kpis, relations, preferences.layoutDirection);
    for (const p of positions) {
      updateKpiPosition(p.id, { x: p.x, y: p.y });
    }
    commitPositions(before);
    toast('success', '已重新排版');
  };

  return (
    <header className="flex shrink-0 items-center gap-1.5 border-b border-emerald-900 bg-emerald-950/90 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1.5 pr-2 font-semibold text-emerald-100">
        <LayoutDashboard size={16} className="text-emerald-400" />
        <span>Align Canvas</span>
      </div>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <button
        type="button"
        className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-1.5 text-white shadow-sm transition hover:bg-emerald-500"
        onClick={onQuickAdd}
        title="新增單一指標"
        aria-label="新增"
      >
        <Plus size={15} />
      </button>
      <button type="button" className="btn" onClick={onBatchAdd} title="批次新增">
        <ListPlus size={14} /> 批次
      </button>
      <button type="button" className="btn" onClick={handleRelayout} title="重新排版">
        <LayoutDashboard size={14} /> 重新排版
      </button>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <button
        type="button"
        className="btn !px-2"
        disabled={!canUndo}
        onClick={undo}
        title="復原 (Cmd/Ctrl+Z)"
        aria-label="復原"
      >
        <Undo2 size={15} />
      </button>
      <button
        type="button"
        className="btn !px-2"
        disabled={!canRedo}
        onClick={redo}
        title="重做 (Cmd/Ctrl+Shift+Z)"
        aria-label="重做"
      >
        <Redo2 size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <div className="mx-1 h-5 w-px bg-emerald-800" />
      <div className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950 px-1 py-1">
        <button
          type="button"
          className={[
            'btn-ghost !p-1.5',
            interactionMode === 'pan' ? '!bg-emerald-800' : '',
          ].join(' ')}
          title="拖曳畫布模式"
          aria-label="拖曳畫布模式"
          onClick={() => onChangeInteractionMode('pan')}
        >
          <Hand size={14} />
        </button>
        <button
          type="button"
          className={[
            'btn-ghost !p-1.5',
            interactionMode === 'select' ? '!bg-emerald-800' : '',
          ].join(' ')}
          title="框選節點模式"
          aria-label="框選節點模式"
          onClick={() => onChangeInteractionMode('select')}
        >
          <MousePointer2 size={14} />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-emerald-800" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-emerald-300">分類突顯</span>
        <div className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950 px-1.5 py-1">
          {KPI_COLOR_PALETTE.map((c) => {
            const active = highlightCategoryColor === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleHighlightCategory(c)}
                className={[
                  'h-4 w-4 rounded-full border-2 transition',
                  active ? 'border-emerald-50 scale-110' : 'border-transparent opacity-80',
                ].join(' ')}
                style={{ backgroundColor: c }}
                title={active ? '點擊取消突顯' : '突顯此分類'}
                aria-label={active ? `取消突顯分類 ${c}` : `突顯分類 ${c}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mx-1 h-5 w-px bg-emerald-800" />
      <label className="flex items-center gap-1.5 text-xs text-emerald-200">
        <span>排版方向</span>
        <select
          className="input !w-auto !py-1 !pr-7 text-xs"
          value={preferences.layoutDirection}
          onChange={(e) =>
            setPreferences({ layoutDirection: e.target.value as 'LR' | 'TB' })
          }
        >
          <option value="LR">水平（左→右）</option>
          <option value="TB">垂直（上→下）</option>
        </select>
      </label>

      <div className="flex-1" />

      <button
        type="button"
        className="btn !px-2"
        onClick={handleExport}
        title="匯出 JSON"
        aria-label="匯出"
      >
        <Download size={15} />
      </button>
      <button
        type="button"
        className="btn !px-2"
        onClick={handleImportClick}
        title="匯入 JSON"
        aria-label="匯入"
      >
        <Upload size={15} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChosen}
      />
    </header>
  );
}
