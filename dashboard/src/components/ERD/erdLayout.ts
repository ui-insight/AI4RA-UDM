import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { DataDictionary, Relationship, HighlightState } from '../../types';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

export function buildERDElements(
  dataDictionary: DataDictionary,
  relationships: Relationship[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 40, edgesep: 20 });

  const tableNames = Object.keys(dataDictionary.tables);

  for (const name of tableNames) {
    g.setNode(name, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const rel of relationships) {
    if (rel.from_table !== rel.to_table) {
      g.setEdge(rel.from_table, rel.to_table);
    }
  }

  Dagre.layout(g);

  const nodes: Node[] = tableNames.map(name => {
    const pos = g.node(name);
    return {
      id: name,
      type: 'tableNode',
      data: { label: name, state: 'none' as HighlightState },
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  const edges: Edge[] = relationships.filter(rel => rel.from_table !== rel.to_table).map((rel, i) => ({
    id: `e-${i}`,
    source: rel.from_table,
    target: rel.to_table,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#95a5a6', strokeWidth: 1.5 },
    markerEnd: { type: 'arrowclosed' as const, color: '#667eea' },
    data: { state: 'none' as HighlightState },
  }));

  return { nodes, edges };
}
