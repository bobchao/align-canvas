import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { useGraphStore } from '../store/useGraphStore';
import { toast } from '../ui/Toast';
import { KPI_COLOR_PALETTE } from '../types';
import { categoryDisplayLabel } from '../lib/kpiCategory';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BatchAddDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [color, setColor] = useState<string>(KPI_COLOR_PALETTE[0]);
  const batchAdd = useGraphStore((s) => s.batchAddKpis);
  const colorNames = useGraphStore((s) => s.colorNames);

  const handleSubmit = () => {
    const lines = text.split(/\r?\n/);
    const created = batchAdd(lines, color);
    if (created.length === 0) {
      toast('info', t('batchAdd.toast.noneAdded'));
      return;
    }
    toast('success', t('batchAdd.toast.added', { count: created.length }));
    setText('');
    onClose();
  };

  const previewCount = new Set(
    text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase()),
  ).size;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('batchAdd.title')}
      widthClass="max-w-xl"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t('batchAdd.cancel')}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={previewCount === 0}
            onClick={handleSubmit}
          >
            {t('batchAdd.addCount', { count: previewCount })}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">{t('batchAdd.nameLabel')}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('batchAdd.placeholder')}
            className="input min-h-[220px] resize-y font-mono text-[13px]"
            autoFocus
          />
          <p className="mt-1 text-xs text-emerald-300">
            {t('batchAdd.hint')}
          </p>
        </div>
        <div>
          <label className="label">{t('batchAdd.colorLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {KPI_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'h-6 w-6 rounded-full border-2 transition',
                  color === c
                    ? 'border-slate-900 dark:border-white'
                    : 'border-transparent',
                ].join(' ')}
                style={{ backgroundColor: c }}
                aria-label={categoryDisplayLabel(c, colorNames)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
