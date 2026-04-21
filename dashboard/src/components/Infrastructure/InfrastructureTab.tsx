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
          Integration Glossary
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Terms that come up repeatedly in data-integration conversations. This glossary lives alongside
          the UDM but isn't part of it — the UDM defines <em>what</em> the canonical schema looks like;
          this glossary names the <em>activities and artifacts</em> around mapping other systems to it.
          (Distinct from a <em>controlled vocabulary</em>, which is a curated list of allowed values
          for a specific field — in the UDM those live in the <code>AllowedValues</code> table.)
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1', width: 180 }}>Term</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1', width: 180 }}>Tags</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>Definition</th>
              </tr>
            </thead>
            <tbody>
              <VocabRow
                term="Crosswalk"
                tags={['Data Integration']}
                def="A declarative per-field mapping between a source system's vocabulary and the UDM's, including value translations and transformation notes. In a medallion lakehouse, the crosswalk is the Silver layer."
              />
              <VocabRow
                term="Schema mapping"
                tags={['Data Integration']}
                def="The broader design process of deciding how one schema corresponds to another. Crosswalks are the artifacts that record those mapping decisions."
              />
              <VocabRow
                term="Lookup table"
                tags={['Data Integration', 'Data Fundamentals']}
                def={'Static reference data providing code\u2192label or code\u2192definition translations within a single system (e.g., state code \u2192 state name). A crosswalk is specifically about bridging different systems\u2019 conventions, which is why lookup tables are a related-but-distinct concept.'}
              />
              <VocabRow
                term="ETL code"
                tags={['Data Integration']}
                def="The executable expression of a crosswalk — the pipeline code (SQL views, dbt models, Python jobs) that physically extracts from the source, transforms per the crosswalk rules, and loads into the UDM-shaped target. The crosswalk itself stays declarative so analysts can read and edit it without touching pipelines."
              />
              <VocabRow
                term="Playbook"
                tags={['Data Governance']}
                def={'A documented, repeatable procedure for accomplishing a recurring task — e.g., "onboard a new source system to the UDM," "run quarterly compliance reporting," or "add a new controlled-vocabulary value." Playbooks combine the tools (crosswalks, ETL, checklists), the ordered steps, the responsible roles, and the acceptance criteria. They operationalize governance that would otherwise live only in people\u2019s heads.'}
              />
              <VocabRow
                term="Award"
                tags={['Research Admin']}
                def={'The formal instrument by which a sponsor commits funds to an institution for a specific project — the transition from "we proposed this" to "we are doing this with their money." Awards take multiple legal forms with different expectations about sponsor control and reporting: a grant (sponsor funds the work but does not direct it day-to-day), a cooperative agreement (sponsor is substantially involved in the work), a contract (sponsor specifies deliverables and accepts work product), and a subaward (a portion of an award passed through from a prime recipient). Every award has a project period — the overall funded window — and is typically broken into budget periods (usually annual) within which the PI can move money among categories. Sponsors often obligate funds period-by-period rather than releasing the entire commitment up front, which is why the distinction between total awarded and currently available matters for financial management. In the UDM, Award is the central post-award entity: it links back to the Proposal it originated from, out to Personnel via ProjectRole, and down to ProposalBudget / AwardBudget / Transaction records for the money.'}
              />
              <VocabRow
                term="Sponsored Projects"
                tags={['Research Admin']}
                def={'Research, training, public-service, and instructional activities that are funded by an external sponsor through a formal award. The term is both an activity category and an organizational one: "Office of Sponsored Projects" (OSP) or "Sponsored Programs Administration" (SPA) is the institutional unit responsible for handling the full lifecycle — proposal review, award negotiation, compliance, post-award financial oversight, and closeout. Distinguished from (a) unsponsored research funded by internal institutional dollars, which follows a different governance path; (b) gifts and philanthropy, which are handled by advancement offices with far less compliance overhead; and (c) commercial service contracts and fee-for-service arrangements, which may not qualify as sponsored research at all. The distinction matters because Uniform Guidance, F&A recovery, effort certification, and most of the compliance apparatus apply specifically to Sponsored Projects — not to every dollar that happens to fund research activity.'}
              />
              <VocabRow
                term="Sponsor"
                tags={['Research Admin']}
                def={'The external entity that funds a project — a federal agency (NSF, NIH, DOE, DOD, NASA, USDA, etc.), a state agency, a private foundation, an industry partner, a non-profit, or another university acting as a prime on a pass-through award. The sponsor owns the terms and conditions of the award and is the audience for sponsor-facing reports (progress reports, financial reports, closeout). Distinct from the submitting organization (who prepared the proposal) and the administering organization (who manages the finances on the awardee side). On pass-through funding, the direct sponsor is the entity your institution receives money from; the prime sponsor is the original source of the funds — both matter for reporting and compliance. In the UDM, sponsors are captured in the Organization table with Organization_Type = "Sponsor".'}
              />
              <VocabRow
                term="Sponsor PI vs. Internal PI"
                tags={['Research Admin']}
                def={'The Principal Investigator role is recognized in two overlapping but distinct ways that often — but not always — resolve to the same person. (1) Sponsor PI: the individual the funding sponsor recognizes on the award — the name the sponsor will accept on progress reports, no-cost extensions, and correspondence. Governed by the sponsor\u2019s own eligibility rules. (2) Internal PI (PI of Record): the individual the institution recognizes as PI for internal accountability — budget owner, compliance responsibility, effort commitments, departmental reporting. Governed by the institution\u2019s PI-eligibility policy. Divergences are normal and institutionally important: on subawards, the prime has a sponsor PI while the subrecipient institution names its own Sub PI / Internal PI for its portion of the work; when institutional PI-eligibility rules are stricter than the sponsor\u2019s, a researcher may be named to the sponsor but require an eligible faculty PI of record internally; on team-science awards with multiple PIs, NIH may recognize a specific Contact PI that differs from the institution\u2019s internal lead. Systems that conflate the two roles tend to lose the institutional accountability trail.'}
              />
              <VocabRow
                term="Sponsor expenditures"
                tags={['Research Admin']}
                def={'Money spent from externally sponsored awards — also called "extramural expenditures" or "awarded funds spent." Tied to specific awards via fund/account codes, reported to the sponsor on their required forms (FFR, invoices, closeout reports). Directly observable from Transaction records linked to Award.'}
              />
              <VocabRow
                term="Research expenditures"
                tags={['Research Admin']}
                def={'The broader figure used for NSF HERD (Higher Education Research and Development) reporting, Carnegie classification, and institutional ranking. Includes all funds spent on research activity regardless of source — sponsor awards, institutional funds, cost share, and direct departmental research dollars. Research expenditures ≥ sponsor expenditures by definition, and reconciling them requires knowing which Projects / Transactions count as "research" vs. instruction/service/admin.'}
              />
              <VocabRow
                term="Data ownership"
                tags={['Data Governance']}
                def={'A named responsibility — "when something is wrong with this dataset, table, or column, who is responsible for fixing it, answering questions about its meaning, and approving changes to it?" Ownership is about accountability and escalation, not blame. A clear owner removes ambiguity when problems surface and gives downstream consumers a known point of contact. In practice, ownership can sit with a person, a role, or a small team; what matters is that it is named and discoverable, and that the owner has the authority to act.'}
              />
              <VocabRow
                term="Data custodian"
                tags={['Data Governance']}
                def={'The role responsible for the operational care of a dataset — storage, backups, access provisioning, technical maintenance, security controls, and day-to-day availability. Custodians are typically IT, DBA, or platform teams; they implement what the owner decides but are not the source of truth on meaning or business rules. Distinct from the data owner (who decides what the data means and what changes are allowed) and from a data steward (who curates meaning and quality on the business side). A dataset can have one owner, one custodian, and one or more stewards — splitting these roles is usually what makes governance tractable at scale.'}
              />
              <VocabRow
                term="Data governance"
                tags={['Data Governance']}
                def={'Per IBM: "the data management discipline that focuses on the quality, security and availability of an organization\u2019s data. More specifically, data governance helps ensure data integrity and data security by defining and implementing policies, standards and procedures for data collection, ownership, storage, processing and use." IBM frames the governance function as "rather like an air traffic control hub" that ensures verified data flows through secured pipelines to trusted endpoints. In the UDM context, data governance is the umbrella under which ownership, custodianship, stewardship, playbooks, policies, and SOPs all sit — it is how institutions make decisions about their data repeatable, auditable, and shared. (Source: IBM, "What is Data Governance?")'}
              />
              <VocabRow
                term="Data dictionary"
                tags={['Data Fundamentals', 'Data Governance']}
                def={'A catalog describing the data in a system. A data dictionary is not a nice-to-have — without one, data is effectively unusable, because consumers cannot tell what any given field means, what it is for, or whether they are comparing like with like. At minimum, a usable data dictionary captures five things for every column: (1) Meaning — a plain-language description of what the value represents; (2) Purpose — what the data is for: why it is collected, who uses it, which business decisions or reports depend on it; (3) Data type — the storage specification (VARCHAR, INT, DATE, DECIMAL, etc.) that constrains valid values and operations; (4) Constraints — required/optional, uniqueness, allowed values, range limits, and sensitivity flags (PII, export-controlled); (5) Relationships — how this field connects to other data, including foreign keys, synonyms, and cross-references to related columns. In this repository, the machine-readable data dictionary is published at data/data-dictionary.json and powers the Data Dictionary tab on this site.'}
              />
              <VocabRow
                term="Data type"
                tags={['Data Fundamentals']}
                def={'The specification of what kind of value a column holds — VARCHAR(100) for short strings, TEXT for long narrative, INT for integers, DECIMAL(18,2) for currency, DATE / TIMESTAMP for time, BOOLEAN for true/false, and so on. Data types constrain both storage and valid operations (you can add two INTs; you can\u2019t add two TEXTs meaningfully). Matching source types to UDM types — and handling coercions like "MM/DD/YYYY string \u2192 DATE" or "VARCHAR code \u2192 INT foreign-key via AllowedValues" — is one of the core concerns a crosswalk has to record. Type mismatches caught at crosswalk time are cheap; the same mismatch caught at load time is expensive.'}
              />
              <VocabRow
                term="CI/CD"
                tags={['Software Practice']}
                def={'Continuous Integration and Continuous Delivery (sometimes Continuous Deployment) — the practice of automating build, test, and release of software every time a change is committed. CI runs the build and test suite on each commit so regressions are caught within minutes instead of at release time; CD automates packaging and deploying those tested artifacts to the target environment, with or without a human approval gate. For the UDM specifically, the CI/CD pipeline lives in .github/workflows/: on every push to main, GitHub Actions regenerates the derived JSON endpoints (data-dictionary.json, relationships.json) from udm_schema.json, rebuilds the dashboard, and publishes to GitHub Pages. This is why the site and the SSOT stay in sync without manual steps, and why a broken commit is visible quickly.'}
              />
              <VocabRow
                term="Metadata"
                tags={['Data Fundamentals', 'Data Governance']}
                def={'Data about data. Where a data row captures a fact about the world (this award was for $500,000), metadata captures facts about the data itself — its type, source, lineage, ownership, freshness, classification, retention rules, and meaning. The UDM\u2019s data dictionary is metadata. So is a crosswalk, a data-type specification, a PII flag, an allowed-values list, a foreign-key relationship, and a last-updated timestamp. Metadata is what makes data interpretable without context — the difference between a column of numbers and a column of dollars as of Q2 2026, owned by the Office of Research, refreshed nightly. Systems that neglect metadata tend to re-derive the same institutional knowledge over and over; systems that treat metadata as a first-class artifact (like this site does) amortize that knowledge across every consumer.'}
              />
              <VocabRow
                term="Business definition"
                tags={['Data Fundamentals', 'Data Governance']}
                def={'The plain-language explanation of what a data element means expressed in terms the business actually uses, as opposed to its technical or database-level specification. A business definition of Award_Status_Date would be "the date on which the award\u2019s current status took effect" — not "TIMESTAMP column, nullable, default NULL." Business definitions are what turn a raw schema into a data dictionary. They are written by, or validated by, the people who make decisions with the data — not just the people who store it. When the business definition and the technical definition disagree, the business definition is usually right and the technical implementation needs updating; when no business definition exists, the column is almost always being misused somewhere.'}
              />
              <VocabRow
                term="IACUC"
                tags={['Compliance']}
                def={'Institutional Animal Care and Use Committee — a federally mandated committee at any research institution that uses vertebrate animals in research, teaching, or testing. The IACUC reviews and approves animal-use protocols before the work may begin, monitors ongoing compliance through semi-annual program reviews and facility inspections, and has the authority to suspend or terminate research that deviates from an approved protocol. IACUC is required by the Public Health Service Policy on Humane Care and Use of Laboratory Animals (PHS Policy), the Animal Welfare Act (AWA), and USDA regulations. Membership composition is prescribed by PHS Policy IV.A.3: at minimum a veterinarian with program responsibility, a practicing scientist experienced in animal research, a non-scientist member, and a community member not otherwise affiliated with the institution. In the UDM, IACUC protocol tracking lives in the ComplianceRequirement table; see also sibling committees IRB (human subjects) and IBC (biosafety / recombinant DNA).'}
              />
              <VocabRow
                term="IRB"
                tags={['Compliance']}
                def={'Institutional Review Board — a federally mandated committee that reviews and approves research involving human subjects before the work may begin, and monitors ongoing studies for compliance with the approved protocol and for any new risks to participants. Required by the Federal Policy for the Protection of Human Subjects (the Common Rule, 45 CFR 46) and, for FDA-regulated research, by 21 CFR 50 / 56. The IRB\u2019s charge is to ensure that risks to participants are minimized, that risks are reasonable relative to anticipated benefits, that informed consent is appropriately obtained and documented, and that additional safeguards are in place for vulnerable populations (children, prisoners, pregnant women, cognitively impaired individuals, and economically or educationally disadvantaged persons). Membership composition is prescribed by 45 CFR 46.107: at least five members of varying backgrounds, including at least one scientist, one non-scientist, and one member not otherwise affiliated with the institution. In the UDM, IRB protocol tracking lives in the ComplianceRequirement table; see also sibling committees IACUC (animal research) and IBC (biosafety / recombinant DNA).'}
              />
              <VocabRow
                term="Schema"
                tags={['Data Fundamentals']}
                def={'The formal description of the structure of a database or dataset — which tables (or collections / entities) exist, what columns each one has, what data types those columns hold, what constraints apply (required, unique, value ranges), and how the tables relate to each other via foreign keys. A schema is about structure, not content; two databases can share a schema and hold completely different data. The UDM is itself a schema — the "S" is implicit in the name — published as udm_schema.json so other systems can adopt it directly. In SQL, "schema" is also used in a narrower namespacing sense (e.g., lakehouse.bronze.banner, lakehouse.gold.Award); in a medallion lakehouse each layer is typically a SQL schema containing its own views. Distinct from data (the values in the tables), from the data dictionary (the descriptive metadata about the schema), and from schema mapping (the process of connecting one schema to another).'}
              />
              <VocabRow
                term="View"
                tags={['Data Integration']}
                def={'A named, saved query that behaves like a virtual table. A view has no storage of its own — it is just the SQL query definition; every time someone queries the view, the underlying query is executed against the current source data and returns fresh results. Views are cheap to create and always current, which makes them the default choice for transformation layers where correctness matters more than query speed. In a UDM-based lakehouse, Silver (per-source UDM mappings) and Gold (union across sources) are typically implemented as plain views — they re-execute over whatever Bronze holds right now, so newly ingested Bronze data is visible to applications immediately.'}
              />
              <VocabRow
                term="Materialized view"
                tags={['Data Integration']}
                def={'A view whose result set is physically stored (materialized) on disk — part query definition, part cached table. Materialized views are faster to query than plain views because the transformation has already been executed and the answer is sitting there ready to read. The tradeoff is staleness: because the cache was computed at some earlier point in time, the materialized view can drift from the underlying source data and must be refreshed — either on a schedule, on a trigger, or on demand. Materialized views are the right choice when the query is expensive (large joins, aggregations over millions of rows) and the data does not need to be real-time. In a UDM lakehouse, Platinum application-specific views are often materialized so dashboards render instantly; Silver and Gold usually stay as plain views to avoid refresh complexity.'}
              />
              <VocabRow
                term="Foreign key / parent-child relationship"
                tags={['Data Fundamentals']}
                def={'A foreign key is a column (or combination of columns) in one table whose value must match an existing primary-key value in another table — it is the mechanism that enforces a relationship between two tables at the database level. The parent/child terminology follows from which side of the relationship each row sits on: the table being referenced is the parent, the table carrying the foreign-key column is the child. Example in the UDM: ProposalBudget.Proposal_ID references Proposal.Proposal_ID, so Proposal is the parent and ProposalBudget is the child — one proposal has many budget line items, every budget line item belongs to exactly one proposal, and the database will refuse to create a budget row pointing at a non-existent proposal. Foreign keys are also what make joins meaningful — without them, two tables are just side-by-side lists. The "Parents" and "Children" columns on the Data Dictionary tab are derived directly from the foreign keys declared in udm_schema.json. Delete-time behavior (CASCADE, SET NULL, RESTRICT) controls what happens when a parent row is removed and is part of the relationship contract, not an afterthought.'}
              />
              <VocabRow
                term="Stored procedure"
                tags={['Data Integration']}
                def={'A named block of SQL (plus procedural control flow — variables, loops, conditionals, error handling) stored in the database and invoked like a function. Stored procedures differ from views in two important ways: they can contain multiple statements executed in sequence (insert, update, commit, etc.) rather than just returning a result set, and they are called explicitly rather than queried. Typical uses are multi-step transactions that must succeed or fail atomically, data-modification workflows with validation logic, and encapsulation of business rules close to the data. Stored procedures live inside a specific database engine and use vendor-specific syntax (T-SQL in SQL Server, PL/pgSQL in PostgreSQL, PL/SQL in Oracle), which makes them less portable than SQL views or application code. In a UDM lakehouse the transformation layer is usually expressed as views, dbt models, or Python jobs rather than stored procedures, but stored procedures remain common in legacy ERP / ERA source systems whose data we end up mapping.'}
              />
              <VocabRow
                term="ERA (Electronic Research Administration)"
                tags={['Systems', 'Research Admin']}
                def={'The umbrella term for the class of institutional software systems that support the full research-administration lifecycle: proposal preparation and routing, sponsor submission, compliance protocol management, award setup, post-award tracking, subaward administration, and reporting. ERA systems are what an OSP and its PIs actually log into day-to-day. Examples include Kuali Research, Cayuse, InfoEd, Streamlyne, NOVELUS, and locally built systems such as OpenERA. ERA systems are distinct from sponsor-side portals (Research.gov, eRA Commons, Grants.gov, NSPIRES) — sponsor portals are the external target of submissions; an ERA is the institution\u2019s own workspace for preparing, reviewing, and tracking them. In a UDM-based lakehouse, the institutional ERA is typically the single largest source-system feeding Bronze, and the one whose field names need the most crosswalk work.'}
              />
              <VocabRow
                term="ERP (Enterprise Resource Planning)"
                tags={['Systems']}
                def={'The institution\u2019s core administrative system — the system of record for financials (general ledger, fund / org / account / program structure, budgets, transactions), HR (personnel, appointments, effort, payroll), procurement, and student records when the institution has one. Examples: Ellucian Banner, Oracle PeopleSoft, Workday, SAP, Oracle Cloud ERP. For research administration, the ERP is where sponsor expenditures are ultimately recorded, where the authoritative fund/index/account codes live, and where effort data originates. Post-award reconciliation is mostly a matter of comparing ERA records against ERP transactions. In a UDM-based lakehouse, the ERP is a second major source-system alongside the ERA; Bronze typically captures at least the transaction ledger, chart-of-accounts segments, and personnel appointment data from the ERP.'}
              />
              <VocabRow
                term="Data lineage"
                tags={['Data Governance', 'Data Fundamentals']}
                def={'The documented path a value takes from its origin through every transformation to its final point of use — what system it came from, which crosswalk rules rewrote it, which views or jobs combined it with other data, and which reports or dashboards consume it. Lineage is what lets you answer "where did this number come from?" without reverse-engineering three layers of SQL, and "if I change this source column, what breaks?" without waiting for a downstream consumer to notice. In a UDM lakehouse, lineage is implicit in the Bronze \u2192 Silver \u2192 Gold \u2192 Platinum progression, but useful lineage is explicit: captured in the crosswalk, the view definition, or a dedicated lineage catalog, and queryable alongside the data it describes. Data lineage is the concrete, dataset-specific form of the more general traceability principle.'}
              />
              <VocabRow
                term="Traceability"
                tags={['Data Governance']}
                def={'The principle that any claim, value, decision, or artifact can be followed back to its origin and forward to its consequences. In data, traceability expresses itself as data lineage — following a number back to its source columns and forward to the reports that consume it. In research administration, it shows up in audit trails: a reported expenditure must trace to a transaction, which must trace to an award, which must trace to an approved budget. In engineering, it is requirements-to-implementation-to-test linking. The common shape is a graph of who-produced-what and who-consumed-what, persisted alongside the artifacts themselves. Traceability is what makes an audit tractable, a debugging session finite, and a compliance assertion defensible. Systems that do not preserve traceability tend to rediscover their own history through folklore.'}
              />
              <VocabRow
                term="NOFO / FOA / RFA / Solicitation"
                tags={['Research Admin']}
                def={'Four different names for the same thing: a sponsor\u2019s published announcement that funds are available and describes who can apply, for what, under what rules, and by when. NOFO (Notice of Funding Opportunity) is the current federal standard; FOA (Funding Opportunity Announcement) was NIH\u2019s long-preferred term; RFA (Request for Applications) is common at NIH and in foundation grantmaking; solicitation is generic and often used for contracts and for NSF. The document itself is what matters — it specifies eligible applicants, deadline(s), award ceiling/floor, required sections and page limits, review criteria, reporting expectations, and any program-specific deviations from the parent guide. In the UDM this is captured in the RFA table; the RFARequirement child table breaks the announcement\u2019s rules into structured, checkable requirements.'}
              />
              <VocabRow
                term="JIT (Just-in-Time)"
                tags={['Research Admin']}
                def={'A post-review, pre-award information request — NIH\u2019s name for the stage where, after peer review but before funding decisions, the agency asks the applicant institution to submit updated or additional information: current IRB/IACUC approval, updated other-support, budget revisions, human-subjects education, a revised resource sharing plan. JIT is not a guarantee of funding — it is due-diligence the sponsor does on applications likely to be funded. Responding quickly and accurately is institutionally important because delays here can push an award into the next fiscal year. Other sponsors have analogous stages under different names.'}
              />
              <VocabRow
                term="Biosketch / Current & Pending / Other Support"
                tags={['Research Admin']}
                def={'The three most common required-personnel documents in federal proposals. Biosketch (NIH / NSF both use this term, in different formats) is a structured CV covering education, positions, contributions to science, and — depending on format — grant history. Current & Pending Support (NSF) and Other Support (NIH) are effort-and-funding disclosures: what is the researcher already committed to, and what else have they applied for, so reviewers can see whether there is realistic time to do this proposed project? Requirements for these have tightened substantially since 2020 under research-security regulations — disclosures must include foreign affiliations, in-kind support, and appointments even when unpaid. Submitting an incomplete biosketch or other-support is a routine cause of JIT delays.'}
              />
              <VocabRow
                term="DMP (Data Management Plan)"
                tags={['Research Admin']}
                def={'A required proposal document that describes what data the project will generate, how it will be stored and protected during the work, and how it will be shared after. NSF has required a DMP since 2011; NIH expanded to a stricter DMSP (Data Management and Sharing Plan) in 2023. Typical elements: data types and volumes, metadata and documentation standards, storage and backup, privacy / consent / sensitive-data controls, access and sharing mechanisms, retention period, repositories. DMPs matter operationally because the plan becomes an award term: the institution is accountable for executing what the PI promised. In the UDM the DMP document itself is typically stored in the Document table, and DMP compliance can be tracked as a ComplianceRequirement.'}
              />
              <VocabRow
                term="F&A / Indirect Costs"
                tags={['Research Admin']}
                def={'Facilities & Administrative costs — the institutional overhead costs of doing research that can\u2019t sensibly be assigned to any single project (building maintenance, utilities, IT, libraries, departmental administration, accounting). Rather than charging each project a tiny share of the lightbulbs, institutions negotiate an F&A rate with a cognizant federal agency and apply it as a multiplier on the project\u2019s modified direct costs. The resulting "indirect" dollars are what the institution recovers to keep the lights on for research. F&A rates vary by activity (Organized Research vs. Instruction vs. Other Sponsored Activity) and by location (On-Campus vs. Off-Campus), which is why the UDM\u2019s IndirectRate table is keyed by those dimensions. Common institutional friction: sponsors that cap F&A below the negotiated rate, non-federal sponsors that won\u2019t pay indirect at all, and proposals that forget to apply the correct rate for their activity type.'}
              />
              <VocabRow
                term="MTDC (Modified Total Direct Costs)"
                tags={['Research Admin']}
                def={'The F&A base most federal awards use — it is Total Direct Costs minus specific excluded categories. The standard exclusions are equipment ($5,000+ capital items), tuition remission, patient care costs, rent, scholarships and fellowships, participant-support costs, and the portion of each subaward exceeding $25,000. The exclusions exist so that large one-time or pass-through expenses don\u2019t inflate overhead recovery on items that don\u2019t actually drive institutional cost. MTDC is computed row-by-row over the ProposalBudget, then the applicable F&A rate is multiplied against it. Budget mistakes here are costly in both directions: applying F&A to equipment over-charges the sponsor; forgetting to exclude a $500,000 subaward partial-exclusion under-recovers indirect dollars.'}
              />
              <VocabRow
                term="Cost share"
                tags={['Research Admin']}
                def={'A portion of a project\u2019s total cost that the institution or a third party commits to, rather than the sponsor. Two flavors, with very different institutional consequences. Committed cost share is written into the proposal or the award terms — once it is committed, the institution is obligated to provide and to track it, and failure to deliver is an audit finding. Voluntary cost share is effort or expense the institution incurred above the committed amount — not obligated, and critically, not required to be tracked in the same rigorous way. Uniform Guidance §200.306 is explicit: voluntary committed cost share should not be used as a factor in merit review. Cost-share sources include matching funds, waived F&A, in-kind contributions (donated equipment, volunteer effort), and third-party contributions from collaborators. In the UDM this is modeled by the CostShare table, with a foreign key to the Award.'}
              />
              <VocabRow
                term="Subaward / Prime sponsor / Pass-through"
                tags={['Research Admin']}
                def={'On a multi-institution project, the institution receiving the direct award from the sponsor is the prime awardee; any work delegated to another institution is done through a subaward, and money flows from the prime to the subrecipient as pass-through funding. The prime is accountable to the sponsor for the whole award — programmatic progress, financial reporting, and compliance at the subrecipient — which is why sub-monitoring is a real workstream, not a formality. For reporting purposes, "direct sponsor" on a subrecipient\u2019s books is the prime awardee (another university, a company); the "prime sponsor" is the ultimate federal or other source of funds. Both matter: many reporting systems, including NSF\u2019s and NIH\u2019s, require prime-sponsor identification on every subaward. In the UDM this is the Subaward table, linking two Organization rows (prime and subrecipient) through an Award.'}
              />
              <VocabRow
                term="IBC"
                tags={['Compliance']}
                def={'Institutional Biosafety Committee — the third member of the IACUC/IRB/IBC trio of compliance committees. The IBC reviews and approves research involving recombinant or synthetic nucleic acid molecules, infectious agents, biological toxins, and other biosafety-sensitive materials before the work may begin; it also reviews changes to biosafety-level (BSL) designations and operational plans. Required by the NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules (the "NIH Guidelines") at any institution receiving NIH funding for such research — which in practice means most research universities, regardless of whether a specific project is federally funded. Membership must include at least two members not affiliated with the institution and, for work at BSL-3 or higher, biosafety expertise. In the UDM, IBC protocol tracking lives in the ComplianceRequirement table alongside IRB and IACUC.'}
              />
              <VocabRow
                term="COI / SFI"
                tags={['Compliance', 'Research Admin']}
                def={'Conflict of Interest / Significant Financial Interest — the disclosure-and-management regime that governs investigator outside interests that could bias research. For PHS-funded research (NIH, CDC, FDA, etc.), 42 CFR 50 Subpart F and 45 CFR 94 require covered investigators to disclose SFI ($5,000 threshold for publicly traded entities; any equity in non-publicly-traded entities) at the time of proposal submission and annually thereafter. The institution reviews the disclosures, determines whether each SFI is related to the research (and therefore a financial conflict of interest), and implements a management plan for every FCOI before expending award funds. NSF adopted a similar regime. Management plans typically involve disclosure in publications, independent oversight of study design, divestiture, or removal from the project — the choice depends on the severity of the conflict. In the UDM this is the ConflictOfInterest table, linked to Personnel and to the Project.'}
              />
              <VocabRow
                term="RCR (Responsible Conduct of Research)"
                tags={['Compliance']}
                def={'A formal training and education requirement in ethics of research practice — covering authorship, data management and reproducibility, human and animal subjects protection, conflicts of interest, mentoring, peer review, misconduct (fabrication, falsification, plagiarism), and collaborative / interdisciplinary research. NSF requires RCR training for undergraduates, graduate students, and postdocs supported by its awards. NIH has parallel requirements for trainees supported by T, F, K, R25, R36, D43, and other training / career-development mechanisms, with a documented case-discussion / in-person component. NSF tightened requirements in 2023 to cover faculty and senior personnel as well. Institutions are responsible for tracking completion per-person-per-award and reporting on request. In the UDM this is tracked on Personnel (completion date, expiration) and surfaced as a ComplianceRequirement on relevant awards.'}
              />
              <VocabRow
                term="Export Control (ITAR / EAR / OFAC)"
                tags={['Compliance']}
                def={'The U.S. regulatory regime that controls transfer of certain technologies, technical data, software, and services to non-U.S. persons and to sanctioned countries. ITAR (International Traffic in Arms Regulations, 22 CFR 120-130) covers defense articles and services. EAR (Export Administration Regulations, 15 CFR 730-774) covers dual-use technologies — civilian items with potential military application. OFAC (Office of Foreign Assets Control) administers country-level sanctions (Cuba, Iran, North Korea, Syria, Russia, and others) that override everything else. For research, the big trigger is "deemed export" — sharing controlled technology or technical data with a foreign national inside the U.S. is legally equivalent to exporting it. Fundamental-research exceptions exist but are narrower than researchers assume. Institutional export-control reviews typically run on proposal routing (does the project trigger ITAR/EAR categories?), on foreign-national onboarding, and on international shipments of equipment.'}
              />
              <VocabRow
                term="Research Security / MFTRP / CHIPS Act certifications"
                tags={['Compliance']}
                def={'The 2020s wave of federal research-security requirements driven by concerns about foreign government undue influence in U.S. federally funded research. National Security Presidential Memorandum 33 (NSPM-33) required agencies to harmonize disclosure requirements. The CHIPS and Science Act of 2022 required agencies to establish foreign talent-recruitment program prohibitions by 2024 and required covered-individual certifications on all new proposals. MFTRP (Malign Foreign Talent Recruitment Program) is the OSTP-defined category of foreign programs that federally funded researchers may not participate in; the institution must certify that covered individuals on a proposal are not parties to any MFTRP. Related requirements include research-security training, foreign-affiliations disclosure on biosketch / other-support, and institutional research-security programs with designated senior officials. This is actively evolving; implementation details differ by agency and are still being finalized at most institutions.'}
              />
              <VocabRow
                term="Effort certification"
                tags={['Research Admin', 'Compliance']}
                def={'A signed assertion — usually made by the PI, or by someone with suitable means of verification — that the effort charged to a sponsored award over a given period reasonably reflects the actual effort expended. Required by Uniform Guidance §200.430 ("compensation for personal services"). Effort is measured as a percentage of an individual\u2019s Institutional Base Salary, not as hours, and it must include all effort on all institutional activities (summer salary, VAs, teaching, admin) — the percentages must add to 100%. Effort certification is the most common audit finding in sponsored research: disallowed salary costs happen when certifications are rubber-stamped, are late, or disagree with committed effort in the proposal. In the UDM this is modeled by the Effort table, linked to Personnel and the Award, with certification state and date fields.'}
              />
              <VocabRow
                term="Closeout"
                tags={['Research Admin']}
                def={'The set of activities required to formally end an award: submitting the final technical / progress report, the final financial report (typically a Federal Financial Report for federal awards), the final invention / IP report, and any sponsor-specific deliverables, then disposing of equipment per sponsor terms and reconciling any cost share commitments. Federal Uniform Guidance requires closeout within 120 days of the end date for most awards — but in practice closeouts routinely slip because final invoices arrive late, subrecipient closeouts haven\u2019t completed, and effort certifications lag. Late closeout is an audit risk and can jeopardize the institution\u2019s ability to draw down on other awards from the same sponsor. The UDM surface for closeout is the Award table\u2019s status transition (Active \u2192 Closed) plus the AwardDeliverable records that get resolved.'}
              />
              <VocabRow
                term="Uniform Guidance (2 CFR 200)"
                tags={['Research Admin', 'Compliance']}
                def={'The single federal regulatory framework governing how non-federal entities (universities, non-profits, local governments) manage federal awards — formally "Uniform Administrative Requirements, Cost Principles, and Audit Requirements for Federal Awards," codified at 2 CFR Part 200. Replaced and consolidated eight previous OMB circulars (including A-21, A-110, A-133) into one regulation in 2014. Every cost-principle question ("is this allowable on a federal grant?"), every effort-certification rule, every subrecipient monitoring requirement, every threshold (equipment $5K, subaward MTDC $25K, Single Audit $750K), every closeout deadline — traces back to Uniform Guidance. When someone cites a section like §200.414 (indirect costs), §200.430 (personal services), or §200.501 (audit requirements), they are referencing Uniform Guidance. Most institutional OSP policies are wrappers around UG; most audit findings are UG violations.'}
              />
              <VocabRow
                term="FFR (Federal Financial Report / SF-425)"
                tags={['Research Admin']}
                def={'The federal form sponsors require from award recipients to report financial activity on an award — officially the SF-425, which consolidated three earlier forms (SF-269, SF-269A, SF-272). Submitted quarterly, semi-annually, annually, or at closeout depending on award terms. Reports cumulative obligations, cash receipts/disbursements, program income, indirect expense, and final federal share at closeout. Timeliness matters: late FFRs block drawdown on other awards from the same sponsor and can appear on the institution\u2019s public compliance scorecard. The data on an FFR must reconcile to the general-ledger transactions under the award\u2019s fund/account, which is why post-award teams spend significant time reconciling ERA award status against ERP transaction records before certifying the report.'}
              />
              <VocabRow
                term="HERD survey"
                tags={['Research Admin']}
                def={'The NSF Higher Education Research and Development Survey — the annual census of research expenditures at U.S. universities, conducted by NSF\u2019s National Center for Science and Engineering Statistics. Determines the public "research expenditures" figure associated with an institution and is the primary input to Carnegie Classification tiers (R1/R2/R3) and to NSF\u2019s rankings of institutions by research activity. HERD counts all research expenditures — federal, non-federal, and institutional funds — classified by source and by broad field. Reporting requires crosswalking internal fund/project classifications to HERD categories, a non-trivial exercise that\u2019s usually run by the Office of the VP for Research with support from OSP and institutional research. Research expenditures vs. sponsor expenditures (both in this glossary) is the central reconciliation HERD requires.'}
              />
              <VocabRow
                term="ORCID"
                tags={['Research Admin', 'Systems']}
                def={'Open Researcher and Contributor ID — a persistent 16-digit identifier (displayed as XXXX-XXXX-XXXX-XXXX) that uniquely distinguishes a researcher across career moves, name changes, and institutional affiliations. Maintained by the nonprofit ORCID organization. Now required for PI / Co-PI roles on NIH, NSF, DOE, and most major-sponsor submissions, and increasingly used by publishers and funders to auto-populate biosketches and other-support documents. For institutions, ORCID is the cleanest way to disambiguate personnel across systems — two Dr. Smiths in the same department collapse to one when both have their ORCID on file. In the UDM this is a column on Personnel (validated format: XXXX-XXXX-XXXX-XXXX including the checksum digit).'}
              />
              <VocabRow
                term="UEI (Unique Entity Identifier)"
                tags={['Research Admin', 'Systems']}
                def={'The 12-character alphanumeric identifier that uniquely identifies an organization applying for or holding federal awards — issued by SAM.gov. Replaced the DUNS number (Dun & Bradstreet) in April 2022 when federal awarding moved off the D&B system. Every organization that receives federal funding must have an active UEI and an active SAM.gov registration; a lapsed SAM registration halts drawdowns and new proposals immediately. Subrecipients also need their own UEI. In the UDM, UEI is typically stored on the Organization row for the institution and for every sponsor, subawardee, and collaborator that would appear in federal proposal forms.'}
              />
              <VocabRow
                term="PI eligibility"
                tags={['Research Admin']}
                def={'The institutional policy that defines who is allowed to serve as Principal Investigator on a sponsored award — typically tenure-track faculty by default, with pathways to extend eligibility to research faculty, clinical faculty, emeriti, staff scientists, postdocs, and graduate students under documented criteria (often requiring department chair, dean, or VPR approval). PI-eligibility policy is an institutional governance artifact, not a sponsor rule: sponsors have their own PI-role expectations, but the institution decides whom it will allow to lead awards it administers. Divergence between sponsor-accepted PIs and institutionally eligible PIs is precisely why Sponsor PI vs. Internal PI (see entry) matters — PI-eligibility policy is the lever that forces the distinction. In OpenERA, this is an explicit workflow with VPR-override tracking; in the UDM, the data surface is the EligibilityOverride table (OpenERA extension) or institution-specific ProjectRole metadata.'}
              />
              <VocabRow
                term="Data silo"
                tags={['Data Governance']}
                def={'A dataset that is isolated inside a single system, team, or department — accessible to its immediate users but invisible or impractical to query from anywhere else. Silos arise naturally: a unit buys a point solution, builds a spreadsheet, or stands up an internal database to solve its own problem, and the data never gets exposed to the broader institution. Silos are not bad by intent, but they create real costs — duplicate record-keeping, inconsistent definitions of the same concept, reporting that can\u2019t be reconciled, and institutional knowledge trapped behind a single login. The UDM is specifically aimed at this problem: by giving everyone a common target schema and a crosswalk pattern, siloed sources can be mapped into a unified view without forcing any single system to be retired.'}
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

const TAG_COLORS: Record<string, string> = {
  'Research Admin': '#6366f1',
  'Compliance': '#dc2626',
  'Data Integration': '#0ea5e9',
  'Data Governance': '#7c3aed',
  'Data Fundamentals': '#059669',
  'Systems': '#0891b2',
  'Software Practice': '#d97706',
};

function VocabRow({ term, tags, def }: { term: string; tags: string[]; def: string }) {
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
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {tags.map(t => {
            const color = TAG_COLORS[t] ?? '#64748b';
            return (
              <span key={t} style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.5rem',
                borderRadius: 999,
                background: `${color}18`,
                color,
                border: `1px solid ${color}40`,
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}>
                {t}
              </span>
            );
          })}
        </div>
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
