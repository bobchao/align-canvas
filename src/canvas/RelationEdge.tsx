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
  waypoints?: { x: number; y: number }[];
  highlighted: boolean;
  dimmed: boolean;
  editing: boolean;
}

/**
 * Build a smooth polyline SVG path through an ordered list of points.
 * Corners are rounded with quadratic bezier curves using the given radius.
 */
function buildWaypointPath(
  points: { x: number; y: number }[],
  borderRadius = 16,
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];

    const d1x = p1.x - p0.x;
    const d1y = p1.y - p0.y;
    const d2x = p2.x - p1.x;
    const d2y = p2.y - p1.y;
    const len1 = Math.hypot(d1x, d1y);
    const len2 = Math.hypot(d2x, d2y);

    if (len1 === 0 || len2 === 0) continue;

    const r = Math.min(borderRadius, len1 / 2, len2 / 2);
    const ax = p1.x - (d1x / len1) * r;
    const ay = p1.y - (d1y / len1) * r;
    const bx = p1.x + (d2x / len2) * r;
    const by = p1.y + (d2y / len2) * r;

    d += ` L ${ax} ${ay} Q ${p1.x} ${p1.y} ${bx} ${by}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
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
  const waypoints = data?.waypoints;
  const highlighted = data?.highlighted ?? false;
  const dimmed = data?.dimmed ?? false;
  const editing = data?.editing ?? false;

  let path: string;
  let labelX: number;
  let labelY: number;

  if (waypoints && waypoints.length > 0) {
    const allPoints = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    path = buildWaypointPath(allPoints, 16);
    // Place label near the midpoint segment
    const mid = allPoints[Math.floor(allPoints.length / 2)];
    const next = allPoints[Math.floor(allPoints.length / 2) + 1] ?? mid;
    labelX = (mid.x + next.x) / 2;
    labelY = (mid.y + next.y) / 2;
  } else {
    const result =
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
    [path, labelX, labelY] = result;
  }

  const color = direction === 'positive' ? '#16a34a' : '#dc2626';
  const overlayColor = direction === 'positive' ? '#4ade80' : '#f87171';
  const isDirect = strength === 'direct';
  const strokeDasharray = isDirect ? undefined : '6 4';
  const strokeWidth = editing ? 3.6 : selected || highlighted ? 2.4 : 1.8;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        className={highlighted && !isDirect ? 'edge-flow-animated-indirect' : undefined}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray,
          filter: editing ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.65))' : undefined,
        }}
      />
      {highlighted && isDirect && (
        <path
          d={path}
          fill="none"
          stroke={overlayColor}
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
