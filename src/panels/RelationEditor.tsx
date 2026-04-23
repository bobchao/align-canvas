import { useEffect, useMemo, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type { Relation, RelationDirection, RelationStrength } from '../types';
import { Trash2, X } from 'lucide-react';
import { toast } from '../ui/Toast';

interface Props {
  relationId: string | null;
  onClose: () => void;
}

const DIRECTION_OPTIONS: Array<{ value: RelationDirection; label: string; desc: string }> = [
  { value: 'positive', label: '正向', desc: '增加來源會推升目標' },
  { value: 'negative', label: '負向', desc: '增加來源會削弱目標' },
];

const STRENGTH_OPTIONS: Array<{ value: RelationStrength; label: string; desc: string }> = [
  { value: 'direct', label: '直接', desc: '影響明確、立即' },
  { value: 'indirect', label: '間接', desc: '經由其他因素傳遞' },
];

export function RelationEditor({ relationId, onClose }: Props) {
  const updateRelation = useGraphStore((s) => s.updateRelation);
  const removeRelation = useGraphStore((s) => s.removeRelation);
  const relations = useGraphStore((s) => s.relations);
  const kpis = useGraphStore((s) => s.kpis);

  const editing: Relation | undefined = useMemo(() => {
    if (!relationId) return undefined;
    return relations.find((r) => r.id === relationId);
  }, [relationId, relations]);

  const [direction, setDirection] = useState<RelationDirection>('positive');
  const [strength, setStrength] = useState<RelationStrength>('direct');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editing) {
      setDirection(editing.direction);
      setStrength(editing.strength);
      setNote(editing.note ?? '');
    }
  }, [editing]);

  if (!editing) return null;

  const sourceKpi =
    kpis.find((k) => k.id === editing.sourceId);
  const targetKpi =
    kpis.find((k) => k.id === editing.targetId);

  const setDirectionAndSave = (value: RelationDirection) => {
    setDirection(value);
    updateRelation(editing.id, { direction: value });
  };

  const setStrengthAndSave = (value: RelationStrength) => {
    setStrength(value);
    updateRelation(editing.id, { strength: value });
  };

  const commitNote = (nextNote: string) => {
    const trimmed = nextNote.trim();
    const normalized = trimmed || undefined;
    if ((editing.note ?? undefined) === normalized) return;
    updateRelation(editing.id, { note: normalized });
  };

  const handleDelete = () => {
    removeRelation(editing.id);
    toast('success', '已刪除關係（可用 Cmd+Z 還原）');
    onClose();
  };

  return (
    <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            關係詳情
          </div>
          <div className="truncate font-semibold text-emerald-50">編輯關係</div>
        </div>
        <button
          type="button"
          className="btn-ghost !p-1"
          onClick={onClose}
          aria-label="關閉"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50">
          <span className="truncate font-medium text-slate-900 dark:text-slate-100">
            {sourceKpi?.name ?? '(已刪除)'}
          </span>
          <span className="text-slate-400">→</span>
          <span className="truncate font-medium text-slate-900 dark:text-slate-100">
            {targetKpi?.name ?? '(已刪除)'}
          </span>
        </div>

        <div>
          <div className="label">影響方向</div>
          <div className="grid grid-cols-2 gap-2">
            {DIRECTION_OPTIONS.map((opt) => {
              const active = direction === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDirectionAndSave(opt.value)}
                  className={[
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    active
                      ? opt.value === 'positive'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                        : 'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="mt-0.5 text-xs opacity-80">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="label">影響強度</div>
          <div className="grid grid-cols-2 gap-2">
            {STRENGTH_OPTIONS.map((opt) => {
              const active = strength === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStrengthAndSave(opt.value)}
                  className={[
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    active
                      ? opt.value === 'direct'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                        : 'border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="mt-0.5 text-xs opacity-80">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">備註（選填）</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => commitNote(note)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="input"
            placeholder="例如：延遲一季、需要行銷投入等"
          />
        </div>

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
