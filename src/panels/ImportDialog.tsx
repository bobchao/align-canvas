import { Trans, useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import type { KPI, Relation } from '../types';

interface Props {
  open: boolean;
  incoming: { kpis: KPI[]; relations: Relation[] } | null;
  currentStats: { kpis: number; relations: number };
  onClose: () => void;
  onOverwrite: () => void;
  onMerge: () => void;
}

export function ImportDialog({
  open,
  incoming,
  currentStats,
  onClose,
  onOverwrite,
  onMerge,
}: Props) {
  const { t } = useTranslation();
  if (!incoming) return null;
  const hasCurrent = currentStats.kpis > 0 || currentStats.relations > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('importDialog.title')}
      widthClass="max-w-md"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t('importDialog.cancel')}
          </button>
          {hasCurrent ? (
            <button type="button" className="btn" onClick={onMerge}>
              {t('importDialog.merge')}
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={onOverwrite}>
            {hasCurrent ? t('importDialog.overwrite') : t('importDialog.load')}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-emerald-100">
        <p>
          <Trans
            i18nKey="importDialog.incomingStats"
            values={{ kpis: incoming.kpis.length, relations: incoming.relations.length }}
            components={{ s: <strong /> }}
          />
        </p>
        {hasCurrent ? (
          <p className="text-emerald-300">
            {t('importDialog.currentStats', { kpis: currentStats.kpis, relations: currentStats.relations })}
          </p>
        ) : null}
        <ul className="list-inside list-disc space-y-1 text-xs text-emerald-300">
          <li>{t('importDialog.overwriteHint')}</li>
          {hasCurrent ? <li>{t('importDialog.mergeHint')}</li> : null}
          <li>{t('importDialog.undoHint')}</li>
        </ul>
      </div>
    </Modal>
  );
}
