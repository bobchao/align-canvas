import ELK from 'elkjs/lib/elk.bundled.js';
import type { KPI, Relation } from '../types';

const elk = new ELK();

export type LayoutDirection = 'LR' | 'TB';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

const LAYOUT_SPACING_PRESETS = {
  compact: { nodeNode: 64, layerSpacing: 116 },
  comfortable: { nodeNode: 92, layerSpacing: 152 },
  wide: { nodeNode: 128, layerSpacing: 196 },
} as const;

export interface LayoutedPosition {
  id: string;
  x: number;
  y: number;
}

export interface LayoutResult {
  positions: LayoutedPosition[];
  /** Intermediate bend points (no start/end) keyed by relation id. */
  edgeWaypoints: Record<string, { x: number; y: number }[]>;
}

export async function computeLayout(
  kpis: KPI[],
  relations: Relation[],
  options?: {
    direction?: LayoutDirection;
    spacingPreset?: keyof typeof LAYOUT_SPACING_PRESETS;
  },
): Promise<LayoutResult> {
  const direction = options?.direction ?? 'LR';
  const spacingPreset = options?.spacingPreset ?? 'comfortable';
  const spacing = LAYOUT_SPACING_PRESETS[spacingPreset];

  const kpiSet = new Set(kpis.map((k) => k.id));
  const validRelations = relations.filter(
    (r) => kpiSet.has(r.sourceId) && kpiSet.has(r.targetId),
  );

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': String(spacing.nodeNode),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.layerSpacing),
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.padding': '[top=36, left=36, bottom=36, right=36]',
    },
    children: kpis.map((k) => ({ id: k.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: validRelations.map((r) => ({ id: r.id, sources: [r.sourceId], targets: [r.targetId] })),
  };

  const result = await elk.layout(graph);

  const nodeMap = new Map((result.children ?? []).map((n) => [n.id, n]));

  const positions: LayoutedPosition[] = kpis.map((k) => {
    const node = nodeMap.get(k.id);
    if (!node) return { id: k.id, x: 0, y: 0 };
    return { id: k.id, x: Math.round(node.x ?? 0), y: Math.round(node.y ?? 0) };
  });

  const edgeWaypoints: Record<string, { x: number; y: number }[]> = {};
  for (const edge of result.edges ?? []) {
    const section = (edge as { sections?: { bendPoints?: { x: number; y: number }[] }[] }).sections?.[0];
    if (section?.bendPoints?.length) {
      edgeWaypoints[edge.id] = section.bendPoints.map((p) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      }));
    }
  }

  return { positions, edgeWaypoints };
}

export const LAYOUT_NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };
