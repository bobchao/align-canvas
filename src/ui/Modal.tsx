import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export function Modal({ open, onClose, title, children, footer, widthClass }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'panel flex max-h-[90vh] w-full flex-col',
          widthClass ?? 'max-w-lg',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-emerald-50">
            {title}
          </h2>
          <button
            type="button"
            className="btn-ghost !p-1.5"
            onClick={onClose}
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
