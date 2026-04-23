import { Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  categoryDisplayLabel,
  kpiDisplayColor,
  kpiEffectivePrimaryColor,
} from '../lib/kpiCategory';
import { useGraphStore } from '../store/useGraphStore';
import { KPI_COLOR_PALETTE } from '../types';
import { toast } from '../ui/Toast';

export function KpiInspector() {
  const selectedKpiId = useGraphStore((s) => s.selectedKpiId);
  const selectedKpiIds = useGraphStore((s) => s.selectedKpiIds);
  const setSelectedKpi = useGraphStore((s) => s.setSelectedKpi);
  const setSelectedKpis = useGraphStore((s) => s.setSelectedKpis);
  const setHighlightSeed = useGraphStore((s) => s.setHighlightSeed);
  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const updateKpi = useGraphStore((s) => s.updateKpi);
  const updateKpiColors = useGraphStore((s) => s.updateKpiColors);
  const removeKpi = useGraphStore((s) => s.removeKpi);
  const removeRelation = useGraphStore((s) => s.removeRelation);
  const colorNames = useGraphStore((s) => s.colorNames);

  const kpi = useMemo(
    () => kpis.find((k) => k.id === selectedKpiId) ?? null,
    [kpis, selectedKpiId],
  );

  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (kpi) {
      setName(kpi.name);
      setNote(kpi.note ?? '');
    }
  }, [kpi]);

  const selectedKpis = useMemo(
    () => kpis.filter((k) => selectedKpiIds.includes(k.id)),
    [kpis, selectedKpiIds],
  );
  const isMultiSelected = selectedKpis.length > 1;

  if (isMultiSelected) {
    return (
      <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              多選模式
            </div>
            <div className="truncate font-semibold text-emerald-50">
              已選取 {selectedKpis.length} 個指標
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost !p-1"
            onClick={() => setSelectedKpis([])}
            aria-label="清除選取"
          >
            <X size={16} />
          </button>
        </header>
        <div className="space-y-4 p-4">
          <div>
            <label className="label">批次設定分類顏色</label>
            <div className="flex flex-wrap gap-2">
                {KPI_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    updateKpiColors(selectedKpiIds, c);
                    toast('success', `已更新 ${selectedKpiIds.length} 個指標分類`);
                  }}
                  className="h-6 w-6 rounded-full border-2 border-transparent transition hover:border-slate-900 dark:hover:border-white"
                  style={{ backgroundColor: c }}
                  aria-label={categoryDisplayLabel(c, colorNames)}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="label">已選取指標</div>
            <ul className="max-h-[300px] space-y-1 overflow-y-auto">
              {selectedKpis.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: kpiDisplayColor(item) }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <button
                    type="button"
                    className="btn-ghost !p-1 text-slate-400"
                    onClick={() =>
                      setSelectedKpis(selectedKpiIds.filter((id) => id !== item.id))
                    }
                    aria-label="移出選取"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    );
  }

  if (!kpi) {
    return (
      <aside className="panel w-[320px] shrink-0 p-4 text-sm text-emerald-200">
        <div className="font-medium text-emerald-50">尚未選取指標</div>
        <p className="mt-2 leading-relaxed">
          點擊畫布上的任一 KPI 節點來編輯內容、Highlight 相關指標或刪除該項。
        </p>
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <div className="font-semibold text-slate-700 dark:text-slate-200">快捷鍵</div>
          <ul className="mt-2 space-y-1">
            <li>
              <kbd className="kbd">Cmd/Ctrl</kbd> + <kbd className="kbd">Z</kbd> 復原
            </li>
            <li>
              <kbd className="kbd">Cmd/Ctrl</kbd> + <kbd className="kbd">Shift</kbd> +{' '}
              <kbd className="kbd">Z</kbd> 重做
            </li>
            <li>
              <kbd className="kbd">Esc</kbd> 取消 Highlight
            </li>
          </ul>
        </div>
      </aside>
    );
  }

  const incoming = relations.filter((r) => r.targetId === kpi.id);
  const outgoing = relations.filter((r) => r.sourceId === kpi.id);

  const commitEdits = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('error', '名稱不能為空');
      setName(kpi.name);
      return;
    }
    const noteTrim = note.trim();
    if (trimmed === kpi.name && (noteTrim || '') === (kpi.note || '')) {
      return;
    }
    updateKpi(kpi.id, {
      name: trimmed,
      note: noteTrim || undefined,
    });
  };

  const handleDelete = () => {
    removeKpi(kpi.id);
    toast('success', `已刪除 ${kpi.name}（可用 Cmd+Z 還原）`);
  };

  const primaryEffective = kpiEffectivePrimaryColor(kpi);
  const secondaries = kpi.secondaryCategoryColors ?? [];

  const labelFor = (c: string) => categoryDisplayLabel(c, colorNames);

  const setPrimary = (c: string) => {
    const nextSec = secondaries.filter((s) => s !== c);
    updateKpi(kpi.id, {
      primaryCategoryColor: c,
      color: c,
      secondaryCategoryColors: nextSec,
    });
  };

  const toggleSecondary = (c: string) => {
    if (c === primaryEffective) {
      toast('info', '此為主分類，請先變更上方主分類色。');
      return;
    }
    if (secondaries.includes(c)) {
      updateKpi(kpi.id, {
        secondaryCategoryColors: secondaries.filter((s) => s !== c),
      });
    } else {
      updateKpi(kpi.id, {
        secondaryCategoryColors: [...secondaries, c],
      });
    }
  };

  const lookupName = (id: string) => kpis.find((x) => x.id === id)?.name ?? '(未知)';

  return (
    <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            KPI 詳情
          </div>
          <div className="truncate font-semibold text-emerald-50">
            {kpi.name}
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost !p-1"
          onClick={() => {
            setSelectedKpi(null);
            setHighlightSeed(null);
          }}
          aria-label="關閉"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="label">名稱</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitEdits}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label">備註</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={commitEdits}
            className="input min-h-[72px] resize-y"
          />
        </div>
        <div>
          <label className="label">主分類</label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            名稱可至「設定 → 分類命名」自訂。
          </p>
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-100">
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-500/50"
              style={{ backgroundColor: primaryEffective }}
              aria-hidden
            />
            <span>
              目前主分類：<span className="font-semibold">{labelFor(primaryEffective)}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KPI_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPrimary(c)}
                title={labelFor(c)}
                className={[
                  'h-6 w-6 rounded-full border-2 transition',
                  primaryEffective === c
                    ? 'border-slate-900 dark:border-white'
                    : 'border-transparent',
                ].join(' ')}
                style={{ backgroundColor: c }}
                aria-label={labelFor(c)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="label">次分類</label>
          <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-slate-200 p-1.5 dark:border-slate-800">
            {KPI_COLOR_PALETTE.map((c) => {
              if (c === primaryEffective) {
                return (
                  <li
                    key={c}
                    className="flex cursor-not-allowed items-center gap-2 rounded px-1 py-0.5 text-xs text-slate-500 opacity-60"
                  >
                    <input type="checkbox" disabled className="rounded" checked={false} readOnly />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    <span className="line-through opacity-80">{labelFor(c)}</span>
                    <span className="text-[10px]">（主分類）</span>
                  </li>
                );
              }
              const on = secondaries.includes(c);
              return (
                <li key={c} className="flex items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-slate-800/40">
                  <input
                    id={`sec-${kpi.id}-${c}`}
                    type="checkbox"
                    className="rounded"
                    checked={on}
                    onChange={() => toggleSecondary(c)}
                  />
                  <label
                    htmlFor={`sec-${kpi.id}-${c}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    <span className="text-emerald-100">{labelFor(c)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <section>
          <div className="label">受哪些指標影響（{incoming.length}）</div>
          {incoming.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">尚無</p>
          ) : (
            <ul className="space-y-1">
              {incoming.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <RelationBadge
                      direction={r.direction}
                      strength={r.strength}
                    />
                    <span className="truncate">{lookupName(r.sourceId)}</span>
                  </span>
                  <button
                    type="button"
                    className="btn-ghost !p-1 text-slate-400 hover:text-rose-600"
                    onClick={() => removeRelation(r.id)}
                    aria-label="刪除關係"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="label">影響哪些指標（{outgoing.length}）</div>
          {outgoing.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">尚無</p>
          ) : (
            <ul className="space-y-1">
              {outgoing.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <RelationBadge
                      direction={r.direction}
                      strength={r.strength}
                    />
                    <span className="truncate">{lookupName(r.targetId)}</span>
                  </span>
                  <button
                    type="button"
                    className="btn-ghost !p-1 text-slate-400 hover:text-rose-600"
                    onClick={() => removeRelation(r.id)}
                    aria-label="刪除關係"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="pt-1">
          <button
            type="button"
            className="btn text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950"
            onClick={handleDelete}
          >
            <Trash2 size={14} /> 刪除
          </button>
        </div>
      </div>
    </aside>
  );
}

function RelationBadge({
  direction,
  strength,
}: {
  direction: 'positive' | 'negative';
  strength: 'direct' | 'indirect';
}) {
  const color = direction === 'positive' ? '#16a34a' : '#dc2626';
  const label =
    (direction === 'positive' ? '+' : '−') +
    (strength === 'direct' ? '直' : '間');
  return (
    <span
      className="inline-flex h-4 min-w-[1.5rem] shrink-0 items-center justify-center rounded px-1 text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
