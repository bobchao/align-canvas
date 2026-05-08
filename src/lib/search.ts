import type { KPI, Relation } from '../types';

export interface SearchHits {
  /** Nodes whose name or note matches the query. */
  nodeIds: Set<string>;
  /**
   * Edges to highlight. Includes:
   *  - edges incident to a matched node (so the structural context stays visually connected), and
   *  - edges whose note itself matches the query (these are the "edge-note-only" hits).
   */
  edgeIds: Set<string>;
  /** How many KPI nodes matched by name or note. */
  nodeHitCount: number;
  /** How many relation edges matched by their note (edge-only hits). */
  edgeNoteHitCount: number;
}

const EMPTY: SearchHits = {
  nodeIds: new Set(),
  edgeIds: new Set(),
  nodeHitCount: 0,
  edgeNoteHitCount: 0,
};

/**
 * Compute search highlight hits for a given query.
 *
 * Rules (locked by design):
 *  - Match is case-insensitive substring on the *trimmed* query.
 *  - A node matches when `kpi.name` or `kpi.note` contains the query. Matched
 *    nodes' incident relations are also added to `edgeIds`, so the visible
 *    sub-graph stays connected (mirrors the seed-highlight feel).
 *  - A relation matches when `relation.note` contains the query. In that case
 *    only the edge id is added; the two endpoint nodes stay dimmed unless they
 *    independently match by name/note.
 *
 * Empty/whitespace-only queries return empty sets so the canvas renders normally.
 */
export function computeSearchHits(
  query: string,
  kpis: KPI[],
  relations: Relation[],
): SearchHits {
  const needle = query.trim().toLowerCase();
  if (!needle) return EMPTY;

  const nodeIds = new Set<string>();
  for (const k of kpis) {
    const haystack = `${k.name ?? ''}\n${k.note ?? ''}`.toLowerCase();
    if (haystack.includes(needle)) {
      nodeIds.add(k.id);
    }
  }

  const edgeIds = new Set<string>();
  let edgeNoteHitCount = 0;
  for (const r of relations) {
    const noteHit =
      typeof r.note === 'string' && r.note.toLowerCase().includes(needle);
    const incidentHit = nodeIds.has(r.sourceId) || nodeIds.has(r.targetId);
    if (noteHit) {
      edgeIds.add(r.id);
      edgeNoteHitCount += 1;
    } else if (incidentHit) {
      edgeIds.add(r.id);
    }
  }

  return {
    nodeIds,
    edgeIds,
    nodeHitCount: nodeIds.size,
    edgeNoteHitCount,
  };
}
