import { Trans, useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import type { ParsedImport } from '../lib/jsonIO';
import type { PersistedState } from '../store/db';

interface Props {
  open: boolean;
  remote: ParsedImport | null;
  local: PersistedState | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UrlImportConfirmDialog({ open, remote, local, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();
  if (!remote || !local) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('urlImportDialog.title')}
      widthClass="max-w-md"
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel}>
            {t('urlImportDialog.cancelButton')}
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            {t('urlImportDialog.confirmButton')}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-emerald-100">
        <p>
          <Trans
            i18nKey="urlImportDialog.remoteStats"
            values={{ kpis: remote.kpis.length, relations: remote.relations.length }}
            components={{ s: <strong /> }}
          />
        </p>
        <p className="rounded-md border border-amber-800/50 bg-amber-950/40 px-3 py-2 text-amber-100/95">
          <Trans
            i18nKey="urlImportDialog.localWarning"
            values={{ kpis: local.kpis.length, relations: local.relations.length }}
            components={{ s: <strong /> }}
          />
        </p>
        <p className="text-xs text-emerald-300">
          {t('urlImportDialog.cancelHint')} <code className="rounded bg-emerald-900/80 px-1 text-emerald-100">?import=</code>
        </p>
      </div>
    </Modal>
  );
}
