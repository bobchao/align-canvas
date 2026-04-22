import {
  Download,
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

interface Props {
  onBatchAdd: () => void;
  onImportChoice: (incoming: { kpis: ReturnType<typeof parseSnapshot>['kpis']; relations: ReturnType<typeof parseSnapshot>['relations'] }) => void;
}

export function Toolbar({ onBatchAdd, onImportChoice }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const preferences = useGraphStore((s) => s.preferences);
  const setPreferences = useGraphStore((s) => s.setPreferences);
  const addKpi = useGraphStore((s) => s.addKpi);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.past.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const commitPositions = useGraphStore((s) => s.commitPositions);
  const updateKpiPosition = useGraphStore((s) => s.updateKpiPosition);

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

  const handleQuickAdd = () => {
    addKpi({ name: `指標 ${kpis.length + 1}` });
  };

  return (
    <header className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-1.5 pr-2 font-semibold text-slate-800 dark:text-slate-100">
        <LayoutDashboard size={16} className="text-brand" />
        <span>Align Canvas</span>
      </div>

      <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

      <button type="button" className="btn-primary" onClick={handleQuickAdd} title="新增單一指標">
        <Plus size={14} /> 新增
      </button>
      <button type="button" className="btn" onClick={onBatchAdd} title="批次新增">
        <ListPlus size={14} /> 批次
      </button>
      <button type="button" className="btn" onClick={handleRelayout} title="重新排版">
        <LayoutDashboard size={14} /> 重新排版
      </button>

      <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

      <button
        type="button"
        className="btn"
        disabled={!canUndo}
        onClick={undo}
        title="復原 (Cmd/Ctrl+Z)"
      >
        <Undo2 size={14} /> 復原
      </button>
      <button
        type="button"
        className="btn"
        disabled={!canRedo}
        onClick={redo}
        title="重做 (Cmd/Ctrl+Shift+Z)"
      >
        <Redo2 size={14} /> 重做
      </button>

      <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

      <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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

      <button type="button" className="btn" onClick={handleExport} title="匯出 JSON">
        <Download size={14} /> 匯出
      </button>
      <button type="button" className="btn" onClick={handleImportClick} title="匯入 JSON">
        <Upload size={14} /> 匯入
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
