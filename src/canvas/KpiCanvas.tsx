import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  SelectionMode,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type Node,
  type NodeChange,
  type OnConnectStart,
  type OnConnectEnd,
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
  interactionMode: 'pan' | 'select';
  focusNodeId: string | null;
  onFocusHandled: () => void;
}

export function KpiCanvas({
  onRequestCreateRelation,
  onEditRelation,
  interactionMode,
  focusNodeId,
  onFocusHandled,
}: Props) {
  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);
  const preferences = useGraphStore((s) => s.preferences);
  const highlightSeedId = useGraphStore((s) => s.highlightSeedId);
  const highlightCategoryColor = useGraphStore((s) => s.highlightCategoryColor);
  const selectedKpiIds = useGraphStore((s) => s.selectedKpiIds);
  const setSelectedKpis = useGraphStore((s) => s.setSelectedKpis);
  const setHighlightSeed = useGraphStore((s) => s.setHighlightSeed);
  const updateKpiPosition = useGraphStore((s) => s.updateKpiPosition);
  const commitPositions = useGraphStore((s) => s.commitPositions);

  const rf = useReactFlow();

  /** remember the "before drag" position to build a single undo entry on drag stop */
  const dragStartRef = useRef<Record<string, { x: number; y: number } | undefined>>({});
  const prevNodeCountRef = useRef(0);
  const connectStartRef = useRef<{ nodeId: string | null }>({ nodeId: null });
  const lastFocusedRef = useRef<string | null>(null);
  const lastCategoryFocusRef = useRef<string | null>(null);

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

  // Auto fit only for the initial graph load (first hydrate),
  // so it won't override the "focus newly added node" behavior.
  useEffect(() => {
    if (focusNodeId) return;
    const n = kpis.length;
    const prev = prevNodeCountRef.current;
    prevNodeCountRef.current = n;
    if (n > 0 && prev === 0 && kpis.every((k) => k.position)) {
      // slight delay so React Flow has positioned everything
      const timer = setTimeout(() => {
        rf.fitView({ padding: 0.2, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [kpis, rf, focusNodeId]);

  useEffect(() => {
    if (!focusNodeId) return;
    if (lastFocusedRef.current === focusNodeId) return;
    const timer = setTimeout(() => {
      const node = rf.getNode(focusNodeId);
      if (!node) return;
      lastFocusedRef.current = focusNodeId;
      rf.setCenter(node.position.x + 100, node.position.y + 36, {
        zoom: 1,
        duration: 300,
      });
      onFocusHandled();
    }, 90);
    return () => clearTimeout(timer);
  }, [focusNodeId, onFocusHandled, rf, kpis.length]);

  useEffect(() => {
    if (!highlightCategoryColor) {
      lastCategoryFocusRef.current = null;
      return;
    }
    if (lastCategoryFocusRef.current === highlightCategoryColor) return;
    lastCategoryFocusRef.current = highlightCategoryColor;
    const timer = setTimeout(() => {
      rf.fitView({ padding: 0.2, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [highlightCategoryColor, rf]);

  const highlight = useMemo(() => {
    if (highlightCategoryColor) {
      const nodeIds = new Set(
        kpis.filter((k) => k.color === highlightCategoryColor).map((k) => k.id),
      );
      const edgeIds = new Set(
        relations
          .filter((r) => nodeIds.has(r.sourceId) && nodeIds.has(r.targetId))
          .map((r) => r.id),
      );
      return { nodeIds, edgeIds };
    }
    if (!highlightSeedId) return null;
    return computeHighlight(highlightSeedId, relations);
  }, [highlightCategoryColor, highlightSeedId, kpis, relations]);

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
        },
        className: dimmed ? 'kpi-dimmed' : undefined,
      };
    });
  }, [kpis, highlight]);

  const edges = useMemo<Edge<RelationEdgeData>[]>(() => {
    const positionMap = new Map(
      kpis.map((k) => [k.id, k.position ?? { x: 0, y: 0 }] as const),
    );

    const pickHandles = (sourceId: string, targetId: string) => {
      const source = positionMap.get(sourceId);
      const target = positionMap.get(targetId);
      if (!source || !target) {
        return { sourceHandle: 's-right', targetHandle: 't-left' };
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0
          ? { sourceHandle: 's-right', targetHandle: 't-left' }
          : { sourceHandle: 's-left', targetHandle: 't-right' };
      }
      return dy >= 0
        ? { sourceHandle: 's-bottom', targetHandle: 't-top' }
        : { sourceHandle: 's-top', targetHandle: 't-bottom' };
    };

    return relations.map((r: Relation) => {
      const highlighted = highlight ? highlight.edgeIds.has(r.id) : false;
      const dimmed = highlight ? !highlighted : false;
      const color = r.direction === 'positive' ? '#16a34a' : '#dc2626';
      const { sourceHandle, targetHandle } = pickHandles(r.sourceId, r.targetId);
      return {
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        sourceHandle,
        targetHandle,
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
  }, [relations, highlight, kpis]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let selectionChanged = false;
      const nextSelected = new Set(selectedKpiIds);

      // We only care about position-related changes; selection and others are handled via clicks.
      for (const change of changes) {
        if (change.type === 'select') {
          selectionChanged = true;
          if (change.selected) nextSelected.add(change.id);
          else nextSelected.delete(change.id);
        }
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
      if (selectionChanged) {
        setSelectedKpis(Array.from(nextSelected));
      }
    },
    [nodes, kpis, selectedKpiIds, updateKpiPosition, commitPositions, setSelectedKpis],
  );

  const handleConnectStart: OnConnectStart = useCallback((_, params) => {
    connectStartRef.current = { nodeId: params.nodeId ?? null };
  }, []);

  const handleConnectEnd: OnConnectEnd = useCallback(() => {
    connectStartRef.current = { nodeId: null };
  }, []);

  const handleConnect: OnConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return;
      let sourceId = conn.source;
      let targetId = conn.target;

      const startNodeId = connectStartRef.current.nodeId;
      if (startNodeId && startNodeId !== sourceId && startNodeId === targetId) {
        // In loose mode, React Flow may report reversed source/target.
        sourceId = conn.target;
        targetId = conn.source;
      } else if (
        conn.sourceHandle?.startsWith('t-') ||
        conn.targetHandle?.startsWith('s-')
      ) {
        // Fallback normalization by handle prefix.
        sourceId = conn.target;
        targetId = conn.source;
      }

      if (sourceId === targetId) return;
      onRequestCreateRelation(sourceId, targetId);
    },
    [onRequestCreateRelation],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      onEditRelation(edge.id);
    },
    [onEditRelation],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedKpis([]);
    setHighlightSeed(null);
  }, [setSelectedKpis, setHighlightSeed]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={handleNodesChange}
      onConnectStart={handleConnectStart}
      onConnectEnd={handleConnectEnd}
      onConnect={handleConnect}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      connectionMode={ConnectionMode.Loose}
      deleteKeyCode={null}
      selectionOnDrag={interactionMode === 'select'}
      selectionMode={SelectionMode.Partial}
      multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
      panOnDrag={interactionMode === 'pan' ? true : [2]}
      connectionRadius={26}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        color="#14532d"
        bgColor="#02140d"
      />
      <MiniMap pannable zoomable className="!bg-emerald-950/90" />
      <Controls showInteractive={false} className="!shadow-sm" />
    </ReactFlow>
  );
}
