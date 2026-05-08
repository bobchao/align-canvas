import dagre from 'dagre';
import type { KPI, Relation } from '../types';

export type LayoutDirection = 'LR' | 'TB';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

const LAYOUT_SPACING_PRESETS = {
  compact: { nodesep: 64, ranksep: 116 },
  comfortable: { nodesep: 92, ranksep: 152 },
  wide: { nodesep: 128, ranksep: 196 },
} as const;

export interface LayoutedPosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Run dagre layout and return positions.
 * Position coords are the top-left corner for use with React Flow.
 */
export function computeLayout(
  kpis: KPI[],
  relations: Relation[],
  options?: {
    direction?: LayoutDirection;
    spacingPreset?: keyof typeof LAYOUT_SPACING_PRESETS;
  },
): LayoutedPosition[] {
  const direction = options?.direction ?? 'LR';
  const spacingPreset = options?.spacingPreset ?? 'comfortable';
  const spacing = LAYOUT_SPACING_PRESETS[spacingPreset];
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: spacing.nodesep,
    ranksep: spacing.ranksep,
    marginx: 36,
    marginy: 36,
  });

  for (const k of kpis) {
    g.setNode(k.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const r of relations) {
    if (kpis.some((k) => k.id === r.sourceId) && kpis.some((k) => k.id === r.targetId)) {
      g.setEdge(r.sourceId, r.targetId);
    }
  }

  dagre.layout(g);

  return kpis.map((k) => {
    const node = g.node(k.id);
    if (!node) return { id: k.id, x: 0, y: 0 };
    // dagre gives us the center; convert to top-left.
    return {
      id: k.id,
      x: Math.round(node.x - NODE_WIDTH / 2),
      y: Math.round(node.y - NODE_HEIGHT / 2),
    };
  });
}

export const LAYOUT_NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };
