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
  if (!incoming) return null;
  const hasCurrent = currentStats.kpis > 0 || currentStats.relations > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="匯入資料"
      widthClass="max-w-md"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          {hasCurrent ? (
            <button type="button" className="btn" onClick={onMerge}>
              合併
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={onOverwrite}>
            {hasCurrent ? '覆蓋' : '載入'}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-emerald-100">
        <p>
          匯入檔案包含 <strong>{incoming.kpis.length}</strong> 個指標與{' '}
          <strong>{incoming.relations.length}</strong> 條關係。
        </p>
        {hasCurrent ? (
          <p className="text-emerald-300">
            目前畫布上已有 {currentStats.kpis} 個指標 / {currentStats.relations} 條關係。
          </p>
        ) : null}
        <ul className="list-inside list-disc space-y-1 text-xs text-emerald-300">
          <li>覆蓋：清除目前資料，以匯入檔取代</li>
          {hasCurrent ? <li>合併：以相同 id 進行覆寫，其餘保留</li> : null}
          <li>匯入後仍可以 Cmd/Ctrl+Z 復原</li>
        </ul>
      </div>
    </Modal>
  );
}
