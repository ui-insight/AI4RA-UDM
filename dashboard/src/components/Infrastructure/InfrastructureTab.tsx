import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import InfraNode from './InfraNode';

const nodeTypes = { infra: InfraNode };

const colors = {
  sources: '#e74c3c',
  bronze: '#F5A623',
  silver: '#7ED321',
  gold: '#4A90E2',
  apps: '#764ba2',
  udm: '#667eea',
};

function makeNode(id: string, label: string, sub: string, x: number, y: number, color: string, parentId?: string): Node {
  return {
    id,
    type: 'infra',
    data: { label: sub ? `${label}\n${sub}` : label, color },
    position: { x, y },
    ...(parentId ? { parentId, extent: 'parent' as const } : {}),
  };
}

function makeGroup(id: string, label: string, x: number, y: number, w: number, h: number, color: string): Node {
  return {
    id,
    type: 'group',
    data: { label },
    position: { x, y },
    style: {
      width: w,
      height: h,
      background: `${color}10`,
      border: `1.5px dashed ${color}`,
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      color: '#546e7a',
    },
  };
}

function buildMedallionDiagram(): { nodes: Node[]; edges: Edge[] } {
  const gw = 200;
  const gh = 280;
  const gap = 40;

  const nodes: Node[] = [
    makeGroup('g_sources', 'Sources', 0, 0, gw, gh, '#95a5a6'),
    makeGroup('g_bronze', 'Bronze', gw + gap, 0, gw, gh, colors.bronze),
    makeGroup('g_silver', 'Silver', 2 * (gw + gap), 0, gw, gh, colors.silver),
    makeGroup('g_gold', 'Gold — UDM', 3 * (gw + gap), 0, gw, gh, colors.gold),
    makeGroup('g_apps', 'Applications', 4 * (gw + gap), 0, gw, gh, colors.apps),

    makeNode('s1', 'Grants System', '', 20, 40, colors.sources, 'g_sources'),
    makeNode('s2', 'Finance / ERP', '', 20, 110, colors.sources, 'g_sources'),
    makeNode('s3', 'HR System', '', 20, 180, colors.sources, 'g_sources'),

    makeNode('b1', 'Raw Grants', '', 20, 40, colors.bronze, 'g_bronze'),
    makeNode('b2', 'Raw Finance', '', 20, 110, colors.bronze, 'g_bronze'),
    makeNode('b3', 'Raw HR', '', 20, 180, colors.bronze, 'g_bronze'),

    makeNode('sv1', 'Award, Proposal', 'mapped to UDM', 20, 40, colors.silver, 'g_silver'),
    makeNode('sv2', 'Transaction, Fund', 'mapped to UDM', 20, 110, colors.silver, 'g_silver'),
    makeNode('sv3', 'Personnel, Effort', 'mapped to UDM', 20, 180, colors.silver, 'g_silver'),

    makeNode('gold', 'Unified UDM', 'UNION ALL', 20, 110, colors.gold, 'g_gold'),

    makeNode('a1', 'Dashboards', '', 20, 40, colors.apps, 'g_apps'),
    makeNode('a2', 'Reports', '', 20, 110, colors.apps, 'g_apps'),
    makeNode('a3', 'Analytics / AI', '', 20, 180, colors.apps, 'g_apps'),
  ];

  const edgeStyle = { stroke: '#95a5a6', strokeWidth: 2 };
  const marker = { type: 'arrowclosed' as const, color: '#95a5a6' };

  const edges: Edge[] = [
    { id: 'e1', source: 's1', target: 'b1', style: edgeStyle, markerEnd: marker },
    { id: 'e2', source: 's2', target: 'b2', style: edgeStyle, markerEnd: marker },
    { id: 'e3', source: 's3', target: 'b3', style: edgeStyle, markerEnd: marker },
    { id: 'e4', source: 'b1', target: 'sv1', style: edgeStyle, markerEnd: marker, label: 'Map to UDM' },
    { id: 'e5', source: 'b2', target: 'sv2', style: edgeStyle, markerEnd: marker, label: 'Map to UDM' },
    { id: 'e6', source: 'b3', target: 'sv3', style: edgeStyle, markerEnd: marker, label: 'Map to UDM' },
    { id: 'e7', source: 'sv1', target: 'gold', style: edgeStyle, markerEnd: marker },
    { id: 'e8', source: 'sv2', target: 'gold', style: edgeStyle, markerEnd: marker },
    { id: 'e9', source: 'sv3', target: 'gold', style: edgeStyle, markerEnd: marker },
    { id: 'e10', source: 'gold', target: 'a1', style: edgeStyle, markerEnd: marker },
    { id: 'e11', source: 'gold', target: 'a2', style: edgeStyle, markerEnd: marker },
    { id: 'e12', source: 'gold', target: 'a3', style: edgeStyle, markerEnd: marker },
  ];

  return { nodes, edges };
}

function buildDirectDiagram(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    makeNode('sources', 'Source Systems', '', 0, 0, colors.sources),
    makeNode('schema', 'udm_schema.json', 'UDM Definition', 0, 80, colors.udm),
    makeNode('db', 'Your Database', 'MySQL, PostgreSQL, etc.', 280, 40, colors.gold),
    makeNode('apps', 'Dashboards & Reports', '', 560, 40, colors.apps),
  ];

  const edgeStyle = { stroke: '#95a5a6', strokeWidth: 2 };
  const marker = { type: 'arrowclosed' as const, color: '#95a5a6' };

  const edges: Edge[] = [
    { id: 'd1', source: 'schema', target: 'db', label: 'Generate DDL', style: edgeStyle, markerEnd: marker },
    { id: 'd2', source: 'sources', target: 'db', label: 'ETL', style: edgeStyle, markerEnd: marker },
    { id: 'd3', source: 'db', target: 'apps', style: edgeStyle, markerEnd: marker },
  ];

  return { nodes, edges };
}

export default function InfrastructureTab() {
  const medallion = useMemo(() => buildMedallionDiagram(), []);
  const direct = useMemo(() => buildDirectDiagram(), []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
          Infrastructure Patterns
        </h2>
        <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
          The UDM is a specification, not a database. Institutions implement it with whatever technology fits
          their environment. Below are common patterns for integrating the UDM into your data infrastructure.
        </p>

        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>
          Medallion Architecture
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The most common pattern uses a medallion (Bronze/Silver/Gold) architecture. Institutional source
          systems feed raw data into a Bronze layer. The Silver layer maps each source's fields to UDM column
          names. The Gold layer unions Silver tables across sources into unified UDM tables that any application can query.
        </p>

        <div style={{ background: '#f8f9fa', borderRadius: 8, height: 340 }}>
          <ReactFlow
            nodes={medallion.nodes}
            edges={medallion.edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            onInit={(instance: ReactFlowInstance) => {
              setTimeout(() => instance.fitView({ padding: 0.15 }), 50);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e9ecef" gap={20} />
          </ReactFlow>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>Where the UDM Fits</h3>
          <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
            The UDM defines the target schema for the Silver and Gold layers. Use the <code>synonyms</code> field in{' '}
            <a href="https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json" style={{ color: '#667eea' }}>
              udm_schema.json
            </a>{' '}
            to help map your source field names to UDM column names.
          </p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>Layer Responsibilities</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <LayerCard title="Bronze" color={colors.bronze}
              desc="Raw data extracted from source systems, preserved as-is for auditability. No transformations." />
            <LayerCard title="Silver" color={colors.silver}
              desc="Source-specific views that map local field names to UDM column names. One Silver schema per source system. This is where the UDM mapping happens." />
            <LayerCard title="Gold" color={colors.gold}
              desc="Unified UDM tables that combine Silver views across all sources via UNION ALL. Applications query Gold tables without knowing which source system the data came from." />
          </div>
        </div>
      </div>

      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>
          Direct Database Implementation
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          For institutions that want a simpler approach, the UDM can be implemented directly as database tables.
          Use <code>udm_schema.json</code> to generate CREATE TABLE statements for your platform
          (MySQL, PostgreSQL, SQLite, SQL Server) and load data via ETL.
        </p>
        <div style={{ background: '#f8f9fa', borderRadius: 8, height: 200 }}>
          <ReactFlow
            nodes={direct.nodes}
            edges={direct.edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            onInit={(instance: ReactFlowInstance) => {
              setTimeout(() => instance.fitView({ padding: 0.2 }), 50);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e9ecef" gap={20} />
          </ReactFlow>
        </div>
      </div>

      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>Technology Options</h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The UDM is technology-agnostic. Here are common choices for each layer:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <LayerCard title="Ingestion" color={colors.bronze}
            desc="Airbyte, Fivetran, custom scripts, API connectors, flat file imports" />
          <LayerCard title="Storage" color={colors.silver}
            desc="MinIO/S3, PostgreSQL, MySQL, SQLite, Snowflake, BigQuery, Parquet files" />
          <LayerCard title="Query Engine" color={colors.gold}
            desc="Dremio, DuckDB, Trino, Spark SQL, native database SQL, MongoDB aggregation" />
          <LayerCard title="Applications" color={colors.apps}
            desc="Tableau, Power BI, custom dashboards, LLM integrations, REST APIs" />
        </div>
      </div>

      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>Accessing the UDM Programmatically</h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The UDM schema is published as a machine-readable JSON file via GitHub Pages. You can fetch it directly
          in any language or tool — no authentication required.
        </p>
        <div style={{
          background: '#1e1e1e', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem',
          fontFamily: 'monospace', fontSize: '0.85rem', color: '#d4d4d4', overflowX: 'auto',
        }}>
          <div style={{ color: '#6a9955', marginBottom: '0.5rem' }}># Fetch the full UDM schema</div>
          <div>curl https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json</div>
          <div style={{ color: '#6a9955', marginTop: '1rem', marginBottom: '0.5rem' }}># Python — load as a dictionary</div>
          <div><span style={{ color: '#c586c0' }}>import</span> requests</div>
          <div>schema = requests.get(<span style={{ color: '#ce9178' }}>"https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json"</span>).json()</div>
          <div style={{ color: '#6a9955', marginTop: '1rem', marginBottom: '0.5rem' }}># JavaScript — fetch in browser or Node.js</div>
          <div><span style={{ color: '#c586c0' }}>const</span> schema = <span style={{ color: '#c586c0' }}>await</span> fetch(<span style={{ color: '#ce9178' }}>"https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json"</span>)</div>
          <div>{'  '}.then(r =&gt; r.json());</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <LayerCard title="Schema Endpoint" color={colors.udm}
            desc="ui-insight.github.io/AI4RA-UDM/data/udm_schema.json — the complete UDM definition including tables, columns, types, foreign keys, synonyms, and example views." />
          <LayerCard title="Data Dictionary" color={colors.udm}
            desc="ui-insight.github.io/AI4RA-UDM/data/data-dictionary.json — pre-processed table and column metadata for building tools and documentation." />
          <LayerCard title="Relationships" color={colors.udm}
            desc="ui-insight.github.io/AI4RA-UDM/data/relationships.json — all foreign key relationships extracted from the schema, ready for ERD generation or validation." />
        </div>
        <p style={{ color: '#546e7a', marginTop: '1rem', fontSize: '0.9rem' }}>
          These endpoints always reflect the latest version of the UDM. Use them to generate DDL for your database platform,
          build mapping tools, validate data pipelines, or feed schema context to LLMs.
        </p>
      </div>
    </div>
  );
}

function LayerCard({ title, color, desc }: { title: string; color: string; desc: string }) {
  return (
    <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 6, borderLeft: `4px solid ${color}` }}>
      <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>{title}</h4>
      <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>{desc}</p>
    </div>
  );
}
