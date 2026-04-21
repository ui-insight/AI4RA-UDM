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
import LabeledGroupNode from './LabeledGroupNode';

const nodeTypes = { infra: InfraNode, labeledGroup: LabeledGroupNode };

// Medallion palette aligned with the data-lakehouse shipyard docs.html palette:
// bronze #d97706, silver #64748b, gold #ca8a04, platinum #7c3aed.
const colors = {
  sources: '#475569',
  bronze: '#d97706',
  silver: '#64748b',
  gold: '#ca8a04',
  platinum: '#7c3aed',
  apps: '#0ea5e9',
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
    type: 'labeledGroup',
    data: { label, color },
    position: { x, y },
    style: { width: w, height: h },
  };
}

function buildMedallionDiagram(): { nodes: Node[]; edges: Edge[] } {
  const gw = 170;
  const gh = 280;
  const gap = 30;
  const colX = (i: number) => i * (gw + gap);

  const nodes: Node[] = [
    makeGroup('g_sources', 'Sources', colX(0), 0, gw, gh, colors.sources),
    makeGroup('g_bronze', 'Bronze', colX(1), 0, gw, gh, colors.bronze),
    makeGroup('g_silver', 'Silver', colX(2), 0, gw, gh, colors.silver),
    makeGroup('g_gold', 'Gold — UDM', colX(3), 0, gw, gh, colors.gold),
    makeGroup('g_platinum', 'Platinum', colX(4), 0, gw, gh, colors.platinum),
    makeGroup('g_apps', 'Applications', colX(5), 0, gw, gh, colors.apps),

    makeNode('s1', 'Grants System', '', 15, 40, colors.sources, 'g_sources'),
    makeNode('s2', 'Finance / ERP', '', 15, 110, colors.sources, 'g_sources'),
    makeNode('s3', 'HR System', '', 15, 180, colors.sources, 'g_sources'),

    makeNode('b1', 'Raw Grants', '', 15, 40, colors.bronze, 'g_bronze'),
    makeNode('b2', 'Raw Finance', '', 15, 110, colors.bronze, 'g_bronze'),
    makeNode('b3', 'Raw HR', '', 15, 180, colors.bronze, 'g_bronze'),

    makeNode('sv1', 'Award, Proposal', 'mapped to UDM', 15, 40, colors.silver, 'g_silver'),
    makeNode('sv2', 'Transaction, Fund', 'mapped to UDM', 15, 110, colors.silver, 'g_silver'),
    makeNode('sv3', 'Personnel, Effort', 'mapped to UDM', 15, 180, colors.silver, 'g_silver'),

    makeNode('gold', 'Unified UDM', 'UNION ALL', 15, 110, colors.gold, 'g_gold'),

    makeNode('p1', 'Exec Dashboard View', 'joined / filtered', 15, 40, colors.platinum, 'g_platinum'),
    makeNode('p2', 'PI Portal View', 'joined / filtered', 15, 110, colors.platinum, 'g_platinum'),
    makeNode('p3', 'Compliance View', 'joined / filtered', 15, 180, colors.platinum, 'g_platinum'),

    makeNode('a1', 'Dashboards', '', 15, 40, colors.apps, 'g_apps'),
    makeNode('a2', 'Reports', '', 15, 110, colors.apps, 'g_apps'),
    makeNode('a3', 'Analytics / AI', '', 15, 180, colors.apps, 'g_apps'),
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
    { id: 'e10', source: 'gold', target: 'p1', style: edgeStyle, markerEnd: marker },
    { id: 'e11', source: 'gold', target: 'p2', style: edgeStyle, markerEnd: marker },
    { id: 'e12', source: 'gold', target: 'p3', style: edgeStyle, markerEnd: marker },
    { id: 'e13', source: 'p1', target: 'a1', style: edgeStyle, markerEnd: marker },
    { id: 'e14', source: 'p2', target: 'a2', style: edgeStyle, markerEnd: marker },
    { id: 'e15', source: 'p3', target: 'a3', style: edgeStyle, markerEnd: marker },
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
          The most common pattern uses a medallion (Bronze/Silver/Gold/Platinum) architecture. Institutional
          source systems feed raw data into a Bronze layer. The Silver layer maps each source's fields to UDM
          column names. The Gold layer unions Silver tables across sources into unified UDM tables. The
          Platinum layer provides application-specific views — joins, filters, and aggregations built on Gold —
          that any application can query.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            <LayerCard title="Bronze" color={colors.bronze}
              desc="Raw data extracted from source systems, preserved as-is for auditability. No transformations." />
            <LayerCard title="Silver" color={colors.silver}
              desc="Source-specific views that map local field names to UDM column names. One Silver schema per source system. This is where the UDM crosswalk lives." />
            <LayerCard title="Gold" color={colors.gold}
              desc="Unified UDM tables that combine Silver views across all sources via UNION ALL. Applications query Gold tables without knowing which source system the data came from." />
            <LayerCard title="Platinum" color={colors.platinum}
              desc="Application-specific views built on Gold (or Silver when a single definitive source exists). Joins, filters, and aggregations tailored to a specific dashboard, report, or downstream app." />
          </div>
        </div>
      </div>

      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>
          Crosswalks: Mapping Source Fields to the UDM
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          A <strong>crosswalk</strong> is a declarative mapping between a source system's vocabulary and the
          UDM's — one row per source field listing the target UDM column, any value translation, and
          transformation notes. In a medallion architecture the crosswalk <em>is</em> the Silver layer.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem',
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>Source Column</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>UDM Target</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>Transformation</th>
              </tr>
            </thead>
            <tbody>
              <CrosswalkRow src="grantNumber" tgt="Award.Award_ID" note="direct" />
              <CrosswalkRow src="pi_email" tgt={'ContactDetails.Contact_Value\u00A0(Contact_Type=Email)'} note="pivot to ContactDetails row" />
              <CrosswalkRow src="STATUS_CD = 'A'" tgt="Award.Award_Status = 'Active'" note="value lookup via AllowedValues" />
              <CrosswalkRow src="proj_start (MM/DD/YYYY)" tgt="Proposal.Proposed_Start_Date" note="parse to DATE" />
              <CrosswalkRow src="FOA_NUM" tgt="RFA.RFA_Number" note="synonym match" />
            </tbody>
          </table>
        </div>

        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The UDM supports crosswalk authoring with two first-class fields on every table and column:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <LayerCard title="synonyms" color={colors.silver}
            desc={'Alternate names on every entity — e.g., Award ↔ "Grant, Contract, Agreement". Matchers and LLMs use these to identify equivalent concepts without a hand-built dictionary.'} />
          <LayerCard title="description" color={colors.silver}
            desc="Plain-language column purpose. Combined with the column name, gives LLM/ML matchers enough semantic context to disambiguate near-duplicates like Sponsor vs. Submitting vs. Administering Organization." />
        </div>

        <div style={{
          marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: 6,
          background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontSize: '0.9rem',
        }}>
          <strong>In progress:</strong> AI-assisted / dynamic crosswalk generation — using the{' '}
          <code>synonyms</code> and <code>description</code> fields plus table context to auto-propose
          mappings from a source schema to UDM columns, with confidence scores and human review. See{' '}
          <a href="https://github.com/ui-insight/AI4RA-UDM/issues/33" style={{ color: '#4f46e5' }}>
            issue #33
          </a>.
        </div>
      </div>

      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
          Integration Vocabulary
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Terms that come up repeatedly in data-integration conversations. This glossary lives alongside
          the UDM but isn't part of it — the UDM defines <em>what</em> the canonical schema looks like;
          this vocabulary names the <em>activities and artifacts</em> around mapping other systems to it.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1', width: 180 }}>Term</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>Definition</th>
              </tr>
            </thead>
            <tbody>
              <VocabRow
                term="Crosswalk"
                def="A declarative per-field mapping between a source system's vocabulary and the UDM's, including value translations and transformation notes. In a medallion lakehouse, the crosswalk is the Silver layer."
              />
              <VocabRow
                term="Schema mapping"
                def="The broader design process of deciding how one schema corresponds to another. Crosswalks are the artifacts that record those mapping decisions."
              />
              <VocabRow
                term="Lookup table"
                def={'Static reference data providing code\u2192label or code\u2192definition translations within a single system (e.g., state code \u2192 state name). A crosswalk is specifically about bridging different systems\u2019 conventions, which is why lookup tables are a related-but-distinct concept.'}
              />
              <VocabRow
                term="ETL code"
                def="The executable expression of a crosswalk — the pipeline code (SQL views, dbt models, Python jobs) that physically extracts from the source, transforms per the crosswalk rules, and loads into the UDM-shaped target. The crosswalk itself stays declarative so analysts can read and edit it without touching pipelines."
              />
            </tbody>
          </table>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
          Open a PR or issue to add a term.
        </p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          <LayerCard title="Ingestion" color={colors.bronze}
            desc="Airbyte, Fivetran, custom scripts, API connectors, flat file imports" />
          <LayerCard title="Storage" color={colors.silver}
            desc="MinIO/S3, PostgreSQL, MySQL, SQLite, Snowflake, BigQuery, Parquet files" />
          <LayerCard title="Query Engine" color={colors.gold}
            desc="Dremio, DuckDB, Trino, Spark SQL, native database SQL, MongoDB aggregation" />
          <LayerCard title="App Views" color={colors.platinum}
            desc="Platinum views tailored per app — SQL views, dbt models, materialized views, or semantic layers" />
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

function VocabRow({ term, def }: { term: string; def: string }) {
  return (
    <tr>
      <td style={{
        padding: '0.6rem 0.75rem', borderBottom: '1px solid #e9ecef', verticalAlign: 'top',
        fontWeight: 600, color: '#2c3e50',
      }}>
        {term}
      </td>
      <td style={{
        padding: '0.6rem 0.75rem', borderBottom: '1px solid #e9ecef', verticalAlign: 'top',
        color: '#475569', lineHeight: 1.5,
      }}>
        {def}
      </td>
    </tr>
  );
}

function CrosswalkRow({ src, tgt, note }: { src: string; tgt: string; note: string }) {
  const cell: React.CSSProperties = {
    padding: '0.55rem 0.75rem',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'top',
    color: '#475569',
  };
  const codeStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.82rem',
    background: '#f1f5f9',
    padding: '0.1rem 0.35rem',
    borderRadius: 3,
    color: '#1e293b',
  };
  return (
    <tr>
      <td style={cell}><span style={codeStyle}>{src}</span></td>
      <td style={cell}><span style={codeStyle}>{tgt}</span></td>
      <td style={{ ...cell, color: '#64748b', fontSize: '0.85rem' }}>{note}</td>
    </tr>
  );
}
