import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type NodeMouseHandler,
  type ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from './TableNode';
import { buildERDElements } from './erdLayout';
import type { DataDictionary, Relationship, HighlightState } from '../../types';

const nodeTypes = { tableNode: TableNode };

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
}

export default function ERDTab({ dataDictionary, relationships }: Props) {
  const initial = useMemo(
    () => buildERDElements(dataDictionary, relationships),
    [dataDictionary, relationships],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const applyHighlight = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, state: 'none' as HighlightState } })));
      setEdges(eds => eds.map(e => ({
        ...e,
        style: { stroke: '#95a5a6', strokeWidth: 1.5, opacity: 1 },
        markerEnd: { type: 'arrowclosed' as const, color: '#667eea' },
        data: { ...e.data, state: 'none' as HighlightState },
      })));
      return;
    }

    const parentIds = new Set(
      relationships.filter(r => r.from_table === nodeId).map(r => r.to_table),
    );
    const childIds = new Set(
      relationships.filter(r => r.to_table === nodeId).map(r => r.from_table),
    );

    setNodes(nds => nds.map(n => {
      let state: HighlightState = 'dim';
      if (n.id === nodeId) state = 'selected';
      else if (parentIds.has(n.id)) state = 'parent';
      else if (childIds.has(n.id)) state = 'child';
      return { ...n, data: { ...n.data, state } };
    }));

    setEdges(eds => eds.map(e => {
      const isParentEdge = e.source === nodeId && parentIds.has(e.target);
      const isChildEdge = e.target === nodeId && childIds.has(e.source);
      if (isParentEdge) {
        return {
          ...e,
          style: { stroke: '#4A90E2', strokeWidth: 2.5, opacity: 1 },
          markerEnd: { type: 'arrowclosed' as const, color: '#4A90E2' },
          data: { ...e.data, state: 'parent' as HighlightState },
        };
      }
      if (isChildEdge) {
        return {
          ...e,
          style: { stroke: '#e67e22', strokeWidth: 2.5, opacity: 1 },
          markerEnd: { type: 'arrowclosed' as const, color: '#e67e22' },
          data: { ...e.data, state: 'child' as HighlightState },
        };
      }
      return {
        ...e,
        style: { stroke: '#95a5a6', strokeWidth: 1.5, opacity: 0.1 },
        markerEnd: { type: 'arrowclosed' as const, color: '#667eea', width: 10, height: 10 },
        data: { ...e.data, state: 'dim' as HighlightState },
      };
    }));
  }, [relationships, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
      applyHighlight(null);
    } else {
      setSelectedNodeId(node.id);
      applyHighlight(node.id);
    }
  }, [selectedNodeId, applyHighlight]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    applyHighlight(null);
  }, [applyHighlight]);

  return (
    <div style={{ padding: '1rem', background: 'white' }}>
      <div style={{
        marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: 4,
      }}>
        <p style={{ margin: '0 0 0.75rem 0', color: '#546e7a' }}>
          Interactive Entity Relationship Diagram showing table relationships and foreign keys.{' '}
          <strong>Click any table</strong> to highlight its relationships. Drag nodes to rearrange.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <LegendItem bg="#f0e6ff" border="#764ba2" label="Selected Table" />
          <LegendItem bg="#e3f2fd" border="#4A90E2" label="Parents (this table references)" />
          <LegendItem bg="#fff3e0" border="#e67e22" label="Children (reference this table)" />
        </div>
      </div>
      <div style={{
        width: '100%', height: 'calc(100vh - 280px)',
        background: 'white', border: '1px solid #e9ecef', borderRadius: 8,
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          onInit={(instance: ReactFlowInstance) => {
            setTimeout(() => instance.fitView({ padding: 0.15 }), 50);
          }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background color="#e9ecef" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

function LegendItem({ bg, border, label }: { bg: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        width: 16, height: 16, background: bg, border: `2px solid ${border}`, borderRadius: 3,
      }} />
      <span style={{ color: '#546e7a', fontSize: '0.9rem' }}>{label}</span>
    </div>
  );
}
