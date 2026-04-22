import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { KPI } from '../types';

export interface KpiNodeData extends Record<string, unknown> {
  kpi: KPI;
  highlighted: boolean;
  dimmed: boolean;
  selected: boolean;
}

function KpiNodeImpl(props: NodeProps) {
  const data = props.data as KpiNodeData;
  const { kpi, highlighted, selected } = data;
  const color = kpi.color ?? '#6366f1';
  const handleClass =
    '!h-3 !w-3 !border-0 !bg-transparent !opacity-0';

  return (
    <div
      className={[
        'group relative flex h-[72px] w-[200px] items-stretch overflow-hidden rounded-lg border bg-white shadow-sm transition dark:bg-slate-900',
        selected
          ? 'border-brand ring-2 ring-brand/50'
          : highlighted
            ? 'border-brand/70'
            : 'border-slate-200 dark:border-slate-700',
      ].join(' ')}
      title={kpi.note ?? ''}
    >
      <div
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {kpi.name}
        </div>
        {kpi.note ? (
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {kpi.note}
          </div>
        ) : null}
      </div>

      {[Position.Left, Position.Right, Position.Top, Position.Bottom].map((position) => (
        <Handle
          key={`source-${position}`}
          id={`s-${position}`}
          type="source"
          position={position}
          className={handleClass}
        />
      ))}
      {[Position.Left, Position.Right, Position.Top, Position.Bottom].map((position) => (
        <Handle
          key={`target-${position}`}
          id={`t-${position}`}
          type="target"
          position={position}
          className={handleClass}
        />
      ))}
    </div>
  );
}

export const KpiNode = memo(KpiNodeImpl);
