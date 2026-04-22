import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useGraphStore } from '../store/useGraphStore';
import { toast } from '../ui/Toast';
import { KPI_COLOR_PALETTE } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BatchAddDialog({ open, onClose }: Props) {
  const [text, setText] = useState('');
  const [color, setColor] = useState<string>(KPI_COLOR_PALETTE[0]);
  const batchAdd = useGraphStore((s) => s.batchAddKpis);

  const handleSubmit = () => {
    const lines = text.split(/\r?\n/);
    const created = batchAdd(lines, color);
    if (created.length === 0) {
      toast('info', '沒有新增任何指標（可能是空白或重複）');
      return;
    }
    toast('success', `已新增 ${created.length} 個指標`);
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
      title="批次新增 KPI 指標"
      widthClass="max-w-xl"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={previewCount === 0}
            onClick={handleSubmit}
          >
            新增 {previewCount} 個指標
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">指標名稱（一行一個）</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'例如：\n年度營收\n新客戶數\n客戶留存率'}
            className="input min-h-[220px] resize-y font-mono text-[13px]"
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            空白行會自動忽略，與現有指標同名者會跳過。
          </p>
        </div>
        <div>
          <label className="label">分類顏色（可於新增後再調整）</label>
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
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
