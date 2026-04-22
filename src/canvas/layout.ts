import dagre from 'dagre';
import type { KPI, Relation } from '../types';

export type LayoutDirection = 'LR' | 'TB';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

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
  direction: LayoutDirection = 'LR',
): LayoutedPosition[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 48, ranksep: 96, marginx: 24, marginy: 24 });

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
