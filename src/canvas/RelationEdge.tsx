import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { memo } from 'react';
import type { RelationDirection, RelationStrength } from '../types';

export interface RelationEdgeData extends Record<string, unknown> {
  direction: RelationDirection;
  strength: RelationStrength;
  note?: string;
  routingMode?: 'bezier' | 'smoothstep' | 'step';
  laneOffset?: number;
  highlighted: boolean;
  dimmed: boolean;
  editing: boolean;
}

/**
 * Renders an edge styled by (direction x strength):
 *  - positive: green, arrow head
 *  - negative: red, T-bar head
 *  - direct:   solid stroke
 *  - indirect: dashed stroke
 */
function RelationEdgeImpl(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    selected,
  } = props;
  const data = props.data as RelationEdgeData | undefined;
  const direction: RelationDirection = data?.direction ?? 'positive';
  const strength: RelationStrength = data?.strength ?? 'direct';
  const routingMode = data?.routingMode ?? 'smoothstep';
  const laneOffset = data?.laneOffset ?? 0;
  const highlighted = data?.highlighted ?? false;
  const dimmed = data?.dimmed ?? false;
  const editing = data?.editing ?? false;

  const [path, labelX, labelY] =
    routingMode === 'bezier'
      ? getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius: routingMode === 'step' ? 0 : 16,
          offset: Math.max(16, 24 + Math.abs(laneOffset)),
          centerX: (sourceX + targetX) / 2 + laneOffset,
          centerY: (sourceY + targetY) / 2 + laneOffset * 0.25,
        });

  const color = direction === 'positive' ? '#16a34a' : '#dc2626';
  const strokeDasharray = strength === 'indirect' ? '6 4' : undefined;
  const strokeWidth = editing ? 3.6 : selected || highlighted ? 2.4 : 1.8;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray,
          filter: editing ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.65))' : undefined,
        }}
      />
      {highlighted && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2.8}
          strokeDasharray="8 6"
          strokeLinecap="round"
          opacity={0.75}
          className="edge-flow-animated"
          pointerEvents="none"
        />
      )}
      {data?.note ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              opacity: dimmed ? 0.12 : 1,
              transition: 'opacity 0.2s ease',
            }}
            className="pointer-events-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            title={data.note}
          >
            {data.note.length > 18 ? `${data.note.slice(0, 18)}…` : data.note}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const RelationEdge = memo(RelationEdgeImpl);
