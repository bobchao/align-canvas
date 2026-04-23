import type { Relation } from '../types';

export interface HighlightResult {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/**
 * Bi-directional BFS. Given a seed node, returns the union of:
 *  - the seed itself
 *  - all ancestors (anyone with a path leading into the seed)
 *  - all descendants (anyone reachable from the seed)
 * Plus every traversed relation edge during the two BFS passes.
 * (This avoids highlighting unrelated "shortcut" edges between two highlighted nodes.)
 */
export function computeHighlight(
  seedId: string,
  relations: Relation[],
): HighlightResult {
  const outgoing = new Map<string, Relation[]>();
  const incoming = new Map<string, Relation[]>();
  for (const r of relations) {
    if (!outgoing.has(r.sourceId)) outgoing.set(r.sourceId, []);
    outgoing.get(r.sourceId)!.push(r);
    if (!incoming.has(r.targetId)) incoming.set(r.targetId, []);
    incoming.get(r.targetId)!.push(r);
  }

  const nodeIds = new Set<string>([seedId]);
  const edgeIds = new Set<string>();

  const bfs = (start: string, nextMap: Map<string, Relation[]>, pick: (r: Relation) => string) => {
    const queue: string[] = [start];
    const seen = new Set<string>([start]);
    while (queue.length) {
      const curr = queue.shift()!;
      const edges = nextMap.get(curr);
      if (!edges) continue;
      for (const e of edges) {
        edgeIds.add(e.id);
        const next = pick(e);
        if (!seen.has(next)) {
          seen.add(next);
          nodeIds.add(next);
          queue.push(next);
        }
      }
    }
  };

  bfs(seedId, outgoing, (r) => r.targetId);
  bfs(seedId, incoming, (r) => r.sourceId);

  return { nodeIds, edgeIds };
}
