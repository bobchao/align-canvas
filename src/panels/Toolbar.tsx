import {
  Hand,
  FileOutput,
  ChevronDown,
  MousePointer2,
  Search,
  Settings2,
  LayoutDashboard,
  ListPlus,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from '../store/useGraphStore';
import { buildSnapshot, exportToFile } from '../lib/jsonIO';
import { toast } from '../ui/Toast';
import { computeLayout } from '../canvas/layout';
import { countKpisByCategoryColor } from '../lib/kpiCategory';
import { KPI_COLOR_I18N_KEYS } from '../types';

interface Props {
  onBatchAdd: () => void;
  onQuickAdd: () => void;
  interactionMode: 'pan' | 'select';
  onChangeInteractionMode: (mode: 'pan' | 'select') => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
}

export function Toolbar({
  onBatchAdd,
  onQuickAdd,
  interactionMode,
  onChangeInteractionMode,
  settingsOpen,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation();
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const preferences = useGraphStore((s) => s.preferences);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.past.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const commitPositions = useGraphStore((s) => s.commitPositions);
  const updateKpiPosition = useGraphStore((s) => s.updateKpiPosition);
  const highlightCategoryColor = useGraphStore((s) => s.highlightCategoryColor);
  const setHighlightCategory = useGraphStore((s) => s.setHighlightCategory);
  const colorNames = useGraphStore((s) => s.colorNames);
  const openSearch = useGraphStore((s) => s.openSearch);

  const handleExport = () => {
    if (kpis.length === 0) {
      toast('info', t('toolbar.toast.noData'));
      return;
    }
    exportToFile(buildSnapshot(kpis, relations, colorNames));
    toast('success', t('toolbar.toast.exported'));
  };

  const colorCounts = countKpisByCategoryColor(kpis);

  const highlightOptions = Object.entries(colorCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const handleRelayout = () => {
    if (kpis.length === 0) return;
    const before: Record<string, { x: number; y: number } | undefined> = {};
    for (const k of kpis) before[k.id] = k.position ? { ...k.position } : undefined;
    const positions = computeLayout(kpis, relations, {
      direction: preferences.layoutDirection,
      spacingPreset: preferences.layoutSpacingPreset,
    });
    for (const p of positions) {
      updateKpiPosition(p.id, { x: p.x, y: p.y });
    }
    commitPositions(before);
    toast('success', t('toolbar.toast.relayout'));
  };

  useEffect(() => {
    if (!addMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!addMenuRef.current) return;
      if (addMenuRef.current.contains(event.target as Node)) return;
      setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [addMenuOpen]);

  return (
    <header className="relative z-40 flex shrink-0 items-center gap-1.5 border-b border-emerald-900 bg-emerald-950/90 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1.5 pr-2 font-semibold text-emerald-100 whitespace-nowrap">
        <LayoutDashboard size={16} className="text-emerald-400" />
        <span>Align Canvas</span>
      </div>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <div ref={addMenuRef} className="relative">
        <div className="inline-flex overflow-hidden rounded-md border border-emerald-700 shadow-sm">
          <button
            type="button"
            className="inline-flex items-center bg-emerald-600 px-2 py-1.5 text-white transition hover:bg-emerald-500"
            onClick={onQuickAdd}
            title={t('toolbar.addSingleTitle')}
            aria-label={t('toolbar.addAriaLabel')}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className="inline-flex items-center border-l border-emerald-700 bg-emerald-700/80 px-1.5 text-emerald-50 transition hover:bg-emerald-600"
            onClick={() => setAddMenuOpen((v) => !v)}
            title={t('toolbar.moreOptionsTitle')}
            aria-label={t('toolbar.moreOptionsTitle')}
          >
            <ChevronDown size={13} />
          </button>
        </div>
        {addMenuOpen ? (
          <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[132px] rounded-md border border-emerald-800 bg-emerald-950 p-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-emerald-100 transition hover:bg-emerald-900"
              onClick={() => {
                onBatchAdd();
                setAddMenuOpen(false);
              }}
            >
              <ListPlus size={14} />
              {t('toolbar.batchAdd')}
            </button>
          </div>
        ) : null}
      </div>
      <button type="button" className="btn whitespace-nowrap" onClick={handleRelayout} title={t('toolbar.relayout')} aria-label={t('toolbar.relayout')}>
        <LayoutDashboard size={14} />
        <span className="hidden lg:inline whitespace-nowrap">{t('toolbar.relayout')}</span>
      </button>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <button
        type="button"
        className="btn !px-2"
        disabled={!canUndo}
        onClick={undo}
        title={t('toolbar.undoTitle')}
        aria-label={t('toolbar.undoAriaLabel')}
      >
        <Undo2 size={15} />
      </button>
      <button
        type="button"
        className="btn !px-2"
        disabled={!canRedo}
        onClick={redo}
        title={t('toolbar.redoTitle')}
        aria-label={t('toolbar.redoAriaLabel')}
      >
        <Redo2 size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-emerald-800" />

      <button
        type="button"
        className="btn !px-2"
        onClick={openSearch}
        title={t('toolbar.searchTitle')}
        aria-label={t('toolbar.searchAriaLabel')}
      >
        <Search size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-emerald-800" />
      <div className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950 px-1 py-1">
        <button
          type="button"
          className={[
            'btn-ghost !p-1.5',
            interactionMode === 'select' ? '!bg-emerald-800' : '',
          ].join(' ')}
          title={t('toolbar.selectModeTitle')}
          aria-label={t('toolbar.selectModeTitle')}
          onClick={() => onChangeInteractionMode('select')}
        >
          <MousePointer2 size={14} />
        </button>
        <button
          type="button"
          className={[
            'btn-ghost !p-1.5',
            interactionMode === 'pan' ? '!bg-emerald-800' : '',
          ].join(' ')}
          title={t('toolbar.panModeTitle')}
          aria-label={t('toolbar.panModeTitle')}
          onClick={() => onChangeInteractionMode('pan')}
        >
          <Hand size={14} />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-emerald-800" />
      <label className="flex items-center gap-1.5 text-xs text-emerald-200 whitespace-nowrap">
        <select
          className="input !w-auto !min-w-[160px] !py-1 !pr-7 text-xs"
          value={highlightCategoryColor ?? ''}
          onChange={(e) => setHighlightCategory(e.target.value || null)}
        >
          <option value="">{t('toolbar.highlightCategory')}</option>
          {highlightOptions.map(([color, count]) => {
            const name = colorNames[color] || t(KPI_COLOR_I18N_KEYS[color] ?? color);
            return (
              <option key={color} value={color}>
                {t('toolbar.categoryCount', { name, count })}
              </option>
            );
          })}
        </select>
      </label>

      <div className="flex-1" />
      <button
        type="button"
        className={['btn !px-2', settingsOpen ? '!bg-emerald-800' : ''].join(' ')}
        onClick={onOpenSettings}
        title={t('toolbar.settingsTitle')}
        aria-label={t('toolbar.settingsAriaLabel')}
      >
        <Settings2 size={15} />
      </button>
      <button
        type="button"
        className="btn !px-2 whitespace-nowrap"
        onClick={handleExport}
        title={t('toolbar.exportTitle')}
        aria-label={t('toolbar.exportAriaLabel')}
      >
        <FileOutput size={15} />
        <span className="hidden lg:inline">{t('toolbar.export')}</span>
      </button>
    </header>
  );
}
