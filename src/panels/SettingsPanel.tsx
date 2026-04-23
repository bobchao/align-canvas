import { FileInput, MoveHorizontal, MoveVertical, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { KPI_COLOR_LABELS, KPI_COLOR_PALETTE } from '../types';
import { parseSnapshot, type ParsedImport } from '../lib/jsonIO';
import { toast } from '../ui/Toast';

interface Props {
  onClose: () => void;
  onImportChoice: (incoming: ParsedImport) => void;
}

export function SettingsPanel({ onClose, onImportChoice }: Props) {
  const preferences = useGraphStore((s) => s.preferences);
  const setPreferences = useGraphStore((s) => s.setPreferences);
  const colorNames = useGraphStore((s) => s.colorNames);
  const setColorName = useGraphStore((s) => s.setColorName);
  const [colorNameDrafts, setColorNameDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSnapshot(text);
      onImportChoice(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '匯入失敗';
      toast('error', msg);
    }
  };

  return (
    <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            應用設定
          </div>
          <div className="truncate font-semibold text-emerald-50">設定</div>
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
        <section>
          <div className="label">資料</div>
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileInput size={14} />
            匯入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChosen}
          />
        </section>

        <section>
          <div className="label">畫布顯示</div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-emerald-100">
            <input
              type="checkbox"
              className="mt-1 rounded"
              checked={preferences.showKpiCategoryLabels}
              onChange={(e) =>
                setPreferences({ showKpiCategoryLabels: e.target.checked })
              }
            />
            <span>
              在節點上顯示所屬分類名稱
            </span>
          </label>
        </section>

        <section>
          <div className="label">自動排版方向</div>
          <div className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950 px-1 py-1">
            <button
              type="button"
              className={[
                'btn-ghost !p-1.5',
                preferences.layoutDirection === 'LR' ? '!bg-emerald-800' : '',
              ].join(' ')}
              title="水平（左→右）"
              aria-label="水平（左→右）"
              onClick={() => setPreferences({ layoutDirection: 'LR' })}
            >
              <MoveHorizontal size={14} />
            </button>
            <button
              type="button"
              className={[
                'btn-ghost !p-1.5',
                preferences.layoutDirection === 'TB' ? '!bg-emerald-800' : '',
              ].join(' ')}
              title="垂直（上→下）"
              aria-label="垂直（上→下）"
              onClick={() => setPreferences({ layoutDirection: 'TB' })}
            >
              <MoveVertical size={14} />
            </button>
          </div>
        </section>

        <section>
          <div className="label">分類命名</div>
          <div className="space-y-2">
            {KPI_COLOR_PALETTE.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c }}
                  aria-hidden
                />
                <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {KPI_COLOR_LABELS[c] || c}
                </span>
                <input
                  className="input !h-8 text-xs"
                  placeholder={KPI_COLOR_LABELS[c] || c}
                  value={colorNameDrafts[c] ?? colorNames[c] ?? ''}
                  onChange={(e) =>
                    setColorNameDrafts((prev) => ({
                      ...prev,
                      [c]: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    const nextName = (colorNameDrafts[c] ?? colorNames[c] ?? '').trim();
                    setColorName(c, nextName);
                    setColorNameDrafts((prev) => {
                      if (!(c in prev)) return prev;
                      return {
                        ...prev,
                        [c]: nextName,
                      };
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
