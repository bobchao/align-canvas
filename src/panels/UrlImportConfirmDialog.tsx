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
  if (!remote || !local) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="從網址匯入"
      widthClass="max-w-md"
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel}>
            取消（保留本機）
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            確定載入
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-emerald-100">
        <p>
          遠端 JSON 含 <strong>{remote.kpis.length}</strong> 個指標與{' '}
          <strong>{remote.relations.length}</strong> 條關係。
        </p>
        <p className="rounded-md border border-amber-800/50 bg-amber-950/40 px-3 py-2 text-amber-100/95">
          本機已從 IndexedDB 讀到 {local.kpis.length} 個指標 / {local.relations.length} 條關係。
          若確定載入，將<strong>覆寫</strong>本機儲存內容（與工具列匯入的「覆蓋」相同）。
        </p>
        <p className="text-xs text-emerald-300">
          取消則維持本機資料，開啟原因：網址列帶有 <code className="rounded bg-emerald-900/80 px-1 text-emerald-100">?import=</code>
        </p>
      </div>
    </Modal>
  );
}
