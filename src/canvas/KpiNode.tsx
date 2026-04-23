import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { KPI } from '../types';

export interface KpiNodeData extends Record<string, unknown> {
  kpi: KPI;
  highlighted: boolean;
  dimmed: boolean;
  editing: boolean;
}

function KpiNodeImpl(props: NodeProps) {
  const data = props.data as KpiNodeData;
  const { kpi, highlighted, editing } = data;
  const selected = props.selected;
  const color = kpi.color ?? '#22c55e';
  const handleClass =
    '!h-5 !w-5 !border !border-brand/60 !bg-brand/15 !opacity-0 group-hover:!opacity-100 hover:!opacity-100 hover:!bg-brand/35 transition';

  return (
    <div
      className={[
        'group relative flex h-[72px] w-[200px] items-stretch overflow-hidden rounded-lg border bg-emerald-950 shadow-sm transition',
        selected
          ? 'border-brand ring-2 ring-brand/70 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]'
          : editing
            ? 'border-brand/85 ring-2 ring-brand/60 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
          : highlighted
            ? 'border-brand/70'
            : 'border-emerald-800',
      ].join(' ')}
      title={kpi.note ?? ''}
    >
      <div
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <div className="truncate text-sm font-semibold text-emerald-50">
          {kpi.name}
        </div>
        {kpi.note ? (
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-emerald-200">
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
          className={`${handleClass} kpi-handle`}
        />
      ))}
      {[Position.Left, Position.Right, Position.Top, Position.Bottom].map((position) => (
        <Handle
          key={`target-${position}`}
          id={`t-${position}`}
          type="target"
          position={position}
          className={`${handleClass} kpi-handle`}
        />
      ))}
    </div>
  );
}

export const KpiNode = memo(KpiNodeImpl);
