import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo, useMemo } from 'react';
import {
  categoryDisplayLabel,
  kpiDisplayColor,
  kpiSecondaryCount,
  orderedCategoryColorsForDisplay,
} from '../lib/kpiCategory';
import { useGraphStore } from '../store/useGraphStore';
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
  const color = kpiDisplayColor(kpi);
  const secondaryN = kpiSecondaryCount(kpi);
  const colorNames = useGraphStore((s) => s.colorNames);
  const showKpiCategoryLabels = useGraphStore(
    (s) => s.preferences.showKpiCategoryLabels,
  );
  const categoryLine = useMemo(() => {
    if (!showKpiCategoryLabels) return '';
    const ordered = orderedCategoryColorsForDisplay(kpi);
    if (ordered.length === 0) return '';
    return ordered
      .map((c) => categoryDisplayLabel(c, colorNames))
      .join(' · ');
  }, [kpi, showKpiCategoryLabels, colorNames]);
  const handleClass =
    '!h-5 !w-5 !border !border-brand/60 !bg-brand/15 !opacity-0 group-hover:!opacity-100 hover:!opacity-100 hover:!bg-brand/35 transition';

  const titleParts = [kpi.note, categoryLine ? `分類：${categoryLine}` : ''].filter(
    (x) => Boolean(x && String(x).trim()),
  );
  const titleAttr = titleParts.length > 0 ? titleParts.join('\n') : undefined;

  return (
    <div
      className={[
        'group relative flex min-h-[72px] w-[200px] max-h-32 items-stretch overflow-hidden rounded-lg border bg-emerald-950 shadow-sm transition',
        selected
          ? 'border-brand ring-2 ring-brand/70 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]'
          : editing
            ? 'border-brand/85 ring-2 ring-brand/60 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
          : highlighted
            ? 'border-brand/70'
            : 'border-emerald-800',
      ].join(' ')}
      title={titleAttr}
    >
      <div
        aria-hidden
        className="w-1.5 min-h-[44px] shrink-0 self-stretch"
        style={{ backgroundColor: color }}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pl-1 pr-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate text-sm font-semibold text-emerald-50">
            {kpi.name}
          </div>
          {!showKpiCategoryLabels && secondaryN > 0 ? (
            <span
              className="shrink-0 rounded bg-emerald-800/80 px-1.5 text-[10px] font-medium text-emerald-200"
              title="另有其他歸屬分類"
            >
              +{secondaryN}
            </span>
          ) : null}
        </div>
        {showKpiCategoryLabels && categoryLine ? (
          <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-emerald-200/90">
            {categoryLine}
          </div>
        ) : null}
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
