import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useGraphStore } from '../store/useGraphStore';
import type { Relation, RelationDirection, RelationStrength } from '../types';
import { Trash2 } from 'lucide-react';
import { toast } from '../ui/Toast';

export type RelationEditorMode =
  | { kind: 'create'; sourceId: string; targetId: string }
  | { kind: 'edit'; relationId: string }
  | null;

interface Props {
  mode: RelationEditorMode;
  onClose: () => void;
}

const DIRECTION_OPTIONS: Array<{ value: RelationDirection; label: string; desc: string }> = [
  { value: 'positive', label: '正向', desc: '增加來源會推升目標' },
  { value: 'negative', label: '負向', desc: '增加來源會削弱目標' },
];

const STRENGTH_OPTIONS: Array<{ value: RelationStrength; label: string; desc: string }> = [
  { value: 'direct', label: '直接', desc: '實線：影響明確、立即' },
  { value: 'indirect', label: '間接', desc: '虛線：經由其他因素傳遞' },
];

export function RelationEditor({ mode, onClose }: Props) {
  const addRelation = useGraphStore((s) => s.addRelation);
  const updateRelation = useGraphStore((s) => s.updateRelation);
  const removeRelation = useGraphStore((s) => s.removeRelation);
  const relations = useGraphStore((s) => s.relations);
  const kpis = useGraphStore((s) => s.kpis);

  const editing: Relation | undefined = useMemo(() => {
    if (mode?.kind !== 'edit') return undefined;
    return relations.find((r) => r.id === mode.relationId);
  }, [mode, relations]);

  const [direction, setDirection] = useState<RelationDirection>('positive');
  const [strength, setStrength] = useState<RelationStrength>('direct');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (mode?.kind === 'edit' && editing) {
      setDirection(editing.direction);
      setStrength(editing.strength);
      setNote(editing.note ?? '');
    } else if (mode?.kind === 'create') {
      setDirection('positive');
      setStrength('direct');
      setNote('');
    }
  }, [mode, editing]);

  if (!mode) return null;

  const sourceKpi =
    mode.kind === 'create'
      ? kpis.find((k) => k.id === mode.sourceId)
      : kpis.find((k) => k.id === editing?.sourceId);
  const targetKpi =
    mode.kind === 'create'
      ? kpis.find((k) => k.id === mode.targetId)
      : kpis.find((k) => k.id === editing?.targetId);

  const handleSubmit = () => {
    if (mode.kind === 'create') {
      const created = addRelation({
        sourceId: mode.sourceId,
        targetId: mode.targetId,
        direction,
        strength,
        note: note.trim() || undefined,
      });
      if (!created) {
        toast('error', '建立失敗（可能已存在相同方向的關係）');
        return;
      }
      toast('success', '已建立關係');
    } else if (mode.kind === 'edit' && editing) {
      updateRelation(editing.id, {
        direction,
        strength,
        note: note.trim() || undefined,
      });
      toast('success', '已更新關係');
    }
    onClose();
  };

  const handleDelete = () => {
    if (mode.kind === 'edit' && editing) {
      removeRelation(editing.id);
      toast('success', '已刪除關係（可用 Cmd+Z 還原）');
      onClose();
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode.kind === 'create' ? '建立關係' : '編輯關係'}
      widthClass="max-w-lg"
      footer={
        <>
          {mode.kind === 'edit' ? (
            <button
              type="button"
              className="btn text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950"
              onClick={handleDelete}
            >
              <Trash2 size={14} /> 刪除
            </button>
          ) : null}
          <div className="flex-1" />
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            {mode.kind === 'create' ? '建立' : '儲存'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
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
                  onClick={() => setDirection(opt.value)}
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
                  onClick={() => setStrength(opt.value)}
                  className={[
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    active
                      ? 'border-brand bg-brand/10 text-brand-dark dark:text-brand-light'
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
            className="input"
            placeholder="例如：延遲一季、需要行銷投入等"
          />
        </div>
      </div>
    </Modal>
  );
}
