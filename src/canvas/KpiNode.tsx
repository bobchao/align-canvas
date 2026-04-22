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

      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border !border-slate-300 !bg-white dark:!border-slate-600 dark:!bg-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border !border-slate-300 !bg-white dark:!border-slate-600 dark:!bg-slate-800"
      />
      <Handle
        type="target"
        id="t-top"
        position={Position.Top}
        className="!h-2 !w-2 !border !border-slate-300 !bg-white dark:!border-slate-600 dark:!bg-slate-800"
      />
      <Handle
        type="source"
        id="s-bottom"
        position={Position.Bottom}
        className="!h-2 !w-2 !border !border-slate-300 !bg-white dark:!border-slate-600 dark:!bg-slate-800"
      />
    </div>
  );
}

export const KpiNode = memo(KpiNodeImpl);
