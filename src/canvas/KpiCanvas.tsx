import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnConnect,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { computeHighlight } from '../lib/highlight';
import type { KPI, Relation } from '../types';
import { computeLayout } from './layout';
import { KpiNode, type KpiNodeData } from './KpiNode';
import { RelationEdge, type RelationEdgeData } from './RelationEdge';

const nodeTypes = { kpi: KpiNode };
const edgeTypes = { relation: RelationEdge };

interface Props {
  onRequestCreateRelation: (sourceId: string, targetId: string) => void;
  onEditRelation: (relationId: string) => void;
}

export function KpiCanvas({ onRequestCreateRelation, onEditRelation }: Props) {
  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const preferences = useGraphStore((s) => s.preferences);
  const highlightSeedId = useGraphStore((s) => s.highlightSeedId);
  const selectedKpiId = useGraphStore((s) => s.selectedKpiId);
  const setSelectedKpi = useGraphStore((s) => s.setSelectedKpi);
  const setHighlightSeed = useGraphStore((s) => s.setHighlightSeed);
  const updateKpiPosition = useGraphStore((s) => s.updateKpiPosition);
  const commitPositions = useGraphStore((s) => s.commitPositions);

  const rf = useReactFlow();

  /** remember the "before drag" position to build a single undo entry on drag stop */
  const dragStartRef = useRef<Record<string, { x: number; y: number } | undefined>>({});
  const prevNodeCountRef = useRef(0);

  // Ensure all KPIs have positions (auto-layout for newly added ones).
  useEffect(() => {
    const missing = kpis.filter((k) => !k.position);
    if (missing.length === 0) return;
    const positions = computeLayout(kpis, relations, preferences.layoutDirection);
    for (const p of positions) {
      const k = kpis.find((x) => x.id === p.id);
      if (!k) continue;
      if (!k.position) {
        updateKpiPosition(k.id, { x: p.x, y: p.y });
      }
    }
  }, [kpis, relations, preferences.layoutDirection, updateKpiPosition]);

  // Auto fit when node count jumps up (e.g. after batch add / import / first hydrate).
  useEffect(() => {
    const n = kpis.length;
    const prev = prevNodeCountRef.current;
    prevNodeCountRef.current = n;
    if (n > 0 && n !== prev && kpis.every((k) => k.position)) {
      // slight delay so React Flow has positioned everything
      const timer = setTimeout(() => {
        rf.fitView({ padding: 0.2, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [kpis, rf]);

  const highlight = useMemo(() => {
    if (!highlightSeedId) return null;
    return computeHighlight(highlightSeedId, relations);
  }, [highlightSeedId, relations]);

  const nodes = useMemo<Node<KpiNodeData>[]>(() => {
    return kpis.map((k: KPI) => {
      const highlighted = highlight ? highlight.nodeIds.has(k.id) : false;
      const dimmed = highlight ? !highlighted : false;
      return {
        id: k.id,
        type: 'kpi',
        position: k.position ?? { x: 0, y: 0 },
        data: {
          kpi: k,
          highlighted,
          dimmed,
          selected: selectedKpiId === k.id,
        },
        className: dimmed ? 'kpi-dimmed' : undefined,
        selected: selectedKpiId === k.id,
      };
    });
  }, [kpis, highlight, selectedKpiId]);

  const edges = useMemo<Edge<RelationEdgeData>[]>(() => {
    return relations.map((r: Relation) => {
      const highlighted = highlight ? highlight.edgeIds.has(r.id) : false;
      const dimmed = highlight ? !highlighted : false;
      const color = r.direction === 'positive' ? '#16a34a' : '#dc2626';
      return {
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: 'relation',
        data: {
          direction: r.direction,
          strength: r.strength,
          note: r.note,
          highlighted,
          dimmed,
        },
        className: [
          dimmed ? 'kpi-dimmed' : '',
          highlighted ? 'kpi-highlighted' : '',
        ].join(' '),
        markerEnd: {
          type: r.direction === 'positive' ? MarkerType.ArrowClosed : MarkerType.Arrow,
          color,
          width: 18,
          height: 18,
        },
      };
    });
  }, [relations, highlight]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We only care about position-related changes; selection and others are handled via clicks.
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === true) {
          if (dragStartRef.current[change.id] === undefined) {
            const k = kpis.find((x) => x.id === change.id);
            dragStartRef.current[change.id] = k?.position
              ? { ...k.position }
              : undefined;
          }
        }
      }
      const updated = applyNodeChanges(changes, nodes);
      for (const n of updated) {
        const prev = kpis.find((k) => k.id === n.id);
        if (prev && (prev.position?.x !== n.position.x || prev.position?.y !== n.position.y)) {
          updateKpiPosition(n.id, { x: n.position.x, y: n.position.y });
        }
      }
      const dragEnded = changes.some(
        (c) => c.type === 'position' && c.dragging === false,
      );
      if (dragEnded && Object.keys(dragStartRef.current).length > 0) {
        commitPositions(dragStartRef.current);
        dragStartRef.current = {};
      }
    },
    [nodes, kpis, updateKpiPosition, commitPositions],
  );

  const handleConnect: OnConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      onRequestCreateRelation(conn.source, conn.target);
    },
    [onRequestCreateRelation],
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedKpi(node.id);
    },
    [setSelectedKpi],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      onEditRelation(edge.id);
    },
    [onEditRelation],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedKpi(null);
    setHighlightSeed(null);
  }, [setSelectedKpi, setHighlightSeed]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={handleNodesChange}
      onConnect={handleConnect}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <MiniMap pannable zoomable className="!bg-white/80 dark:!bg-slate-900/80" />
      <Controls showInteractive={false} className="!shadow-sm" />
    </ReactFlow>
  );
}
