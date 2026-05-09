import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from '../store/useGraphStore';
import type { Relation, RelationDirection, RelationStrength } from '../types';
import { Trash2, X } from 'lucide-react';
import { toast } from '../ui/Toast';

interface Props {
  relationId: string | null;
  onClose: () => void;
}

export function RelationEditor({ relationId, onClose }: Props) {
  const { t } = useTranslation();
  const updateRelation = useGraphStore((s) => s.updateRelation);
  const removeRelation = useGraphStore((s) => s.removeRelation);
  const relations = useGraphStore((s) => s.relations);
  const kpis = useGraphStore((s) => s.kpis);

  const directionOptions: Array<{ value: RelationDirection; label: string; desc: string }> = [
    { value: 'positive', label: t('relationEditor.positive'), desc: t('relationEditor.positiveDesc') },
    { value: 'negative', label: t('relationEditor.negative'), desc: t('relationEditor.negativeDesc') },
  ];

  const strengthOptions: Array<{ value: RelationStrength; label: string; desc: string }> = [
    { value: 'direct', label: t('relationEditor.direct'), desc: t('relationEditor.directDesc') },
    { value: 'indirect', label: t('relationEditor.indirect'), desc: t('relationEditor.indirectDesc') },
  ];

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
    toast('success', t('relationEditor.toast.deleted'));
    onClose();
  };

  return (
    <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('relationEditor.subtitle')}
          </div>
          <div className="truncate font-semibold text-emerald-50">{t('relationEditor.title')}</div>
        </div>
        <button
          type="button"
          className="btn-ghost !p-1"
          onClick={onClose}
          aria-label={t('relationEditor.closeAriaLabel')}
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50">
          <span className="truncate font-medium text-slate-900 dark:text-slate-100">
            {sourceKpi?.name ?? t('relationEditor.deleted')}
          </span>
          <span className="text-slate-400">→</span>
          <span className="truncate font-medium text-slate-900 dark:text-slate-100">
            {targetKpi?.name ?? t('relationEditor.deleted')}
          </span>
        </div>

        <div>
          <div className="label">{t('relationEditor.direction')}</div>
          <div className="grid grid-cols-2 gap-2">
            {directionOptions.map((opt) => {
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
          <div className="label">{t('relationEditor.strength')}</div>
          <div className="grid grid-cols-2 gap-2">
            {strengthOptions.map((opt) => {
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
          <label className="label">{t('relationEditor.notes')}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => commitNote(note)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="input"
            placeholder={t('relationEditor.notesPlaceholder')}
          />
        </div>

        <div className="pt-1">
          <button
            type="button"
            className="btn text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950"
            onClick={handleDelete}
          >
            <Trash2 size={14} /> {t('relationEditor.delete')}
          </button>
        </div>
      </div>
    </aside>
  );
}
