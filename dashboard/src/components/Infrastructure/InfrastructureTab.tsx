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
              <VocabRow
                term="Playbook"
                def={'A documented, repeatable procedure for accomplishing a recurring task — e.g., "onboard a new source system to the UDM," "run quarterly compliance reporting," or "add a new controlled-vocabulary value." Playbooks combine the tools (crosswalks, ETL, checklists), the ordered steps, the responsible roles, and the acceptance criteria. They operationalize governance that would otherwise live only in people\u2019s heads.'}
              />
              <VocabRow
                term="Sponsor"
                def={'The external entity that funds a project — a federal agency (NSF, NIH, DOE, DOD, NASA, USDA, etc.), a state agency, a private foundation, an industry partner, a non-profit, or another university acting as a prime on a pass-through award. The sponsor owns the terms and conditions of the award and is the audience for sponsor-facing reports (progress reports, financial reports, closeout). Distinct from the submitting organization (who prepared the proposal) and the administering organization (who manages the finances on the awardee side). On pass-through funding, the direct sponsor is the entity your institution receives money from; the prime sponsor is the original source of the funds — both matter for reporting and compliance. In the UDM, sponsors are captured in the Organization table with Organization_Type = "Sponsor".'}
              />
              <VocabRow
                term="Sponsor PI vs. Internal PI"
                def={'The Principal Investigator role is recognized in two overlapping but distinct ways that often — but not always — resolve to the same person. (1) Sponsor PI: the individual the funding sponsor recognizes on the award — the name the sponsor will accept on progress reports, no-cost extensions, and correspondence. Governed by the sponsor\u2019s own eligibility rules. (2) Internal PI (PI of Record): the individual the institution recognizes as PI for internal accountability — budget owner, compliance responsibility, effort commitments, departmental reporting. Governed by the institution\u2019s PI-eligibility policy. Divergences are normal and institutionally important: on subawards, the prime has a sponsor PI while the subrecipient institution names its own Sub PI / Internal PI for its portion of the work; when institutional PI-eligibility rules are stricter than the sponsor\u2019s, a researcher may be named to the sponsor but require an eligible faculty PI of record internally; on team-science awards with multiple PIs, NIH may recognize a specific Contact PI that differs from the institution\u2019s internal lead. Systems that conflate the two roles tend to lose the institutional accountability trail.'}
              />
              <VocabRow
                term="Sponsor expenditures"
                def={'Money spent from externally sponsored awards — also called "extramural expenditures" or "awarded funds spent." Tied to specific awards via fund/account codes, reported to the sponsor on their required forms (FFR, invoices, closeout reports). Directly observable from Transaction records linked to Award.'}
              />
              <VocabRow
                term="Research expenditures"
                def={'The broader figure used for NSF HERD (Higher Education Research and Development) reporting, Carnegie classification, and institutional ranking. Includes all funds spent on research activity regardless of source — sponsor awards, institutional funds, cost share, and direct departmental research dollars. Research expenditures ≥ sponsor expenditures by definition, and reconciling them requires knowing which Projects / Transactions count as "research" vs. instruction/service/admin.'}
              />
              <VocabRow
                term="Data ownership"
                def={'A named responsibility — "when something is wrong with this dataset, table, or column, who is responsible for fixing it, answering questions about its meaning, and approving changes to it?" Ownership is about accountability and escalation, not blame. A clear owner removes ambiguity when problems surface and gives downstream consumers a known point of contact. In practice, ownership can sit with a person, a role, or a small team; what matters is that it is named and discoverable, and that the owner has the authority to act.'}
              />
              <VocabRow
                term="Data custodian"
                def={'The role responsible for the operational care of a dataset — storage, backups, access provisioning, technical maintenance, security controls, and day-to-day availability. Custodians are typically IT, DBA, or platform teams; they implement what the owner decides but are not the source of truth on meaning or business rules. Distinct from the data owner (who decides what the data means and what changes are allowed) and from a data steward (who curates meaning and quality on the business side). A dataset can have one owner, one custodian, and one or more stewards — splitting these roles is usually what makes governance tractable at scale.'}
              />
              <VocabRow
                term="Data governance"
                def={'Per IBM: "the data management discipline that focuses on the quality, security and availability of an organization\u2019s data. More specifically, data governance helps ensure data integrity and data security by defining and implementing policies, standards and procedures for data collection, ownership, storage, processing and use." IBM frames the governance function as "rather like an air traffic control hub" that ensures verified data flows through secured pipelines to trusted endpoints. In the UDM context, data governance is the umbrella under which ownership, custodianship, stewardship, playbooks, policies, and SOPs all sit — it is how institutions make decisions about their data repeatable, auditable, and shared. (Source: IBM, "What is Data Governance?")'}
              />
              <VocabRow
                term="Data dictionary"
                def={'A catalog describing the data in a system. A data dictionary is not a nice-to-have — without one, data is effectively unusable, because consumers cannot tell what any given field means, what it is for, or whether they are comparing like with like. At minimum, a usable data dictionary captures five things for every column: (1) Meaning — a plain-language description of what the value represents; (2) Purpose — what the data is for: why it is collected, who uses it, which business decisions or reports depend on it; (3) Data type — the storage specification (VARCHAR, INT, DATE, DECIMAL, etc.) that constrains valid values and operations; (4) Constraints — required/optional, uniqueness, allowed values, range limits, and sensitivity flags (PII, export-controlled); (5) Relationships — how this field connects to other data, including foreign keys, synonyms, and cross-references to related columns. In this repository, the machine-readable data dictionary is published at data/data-dictionary.json and powers the Data Dictionary tab on this site.'}
              />
              <VocabRow
                term="Data type"
                def={'The specification of what kind of value a column holds — VARCHAR(100) for short strings, TEXT for long narrative, INT for integers, DECIMAL(18,2) for currency, DATE / TIMESTAMP for time, BOOLEAN for true/false, and so on. Data types constrain both storage and valid operations (you can add two INTs; you can\u2019t add two TEXTs meaningfully). Matching source types to UDM types — and handling coercions like "MM/DD/YYYY string \u2192 DATE" or "VARCHAR code \u2192 INT foreign-key via AllowedValues" — is one of the core concerns a crosswalk has to record. Type mismatches caught at crosswalk time are cheap; the same mismatch caught at load time is expensive.'}
              />
              <VocabRow
                term="CI/CD"
                def={'Continuous Integration and Continuous Delivery (sometimes Continuous Deployment) — the practice of automating build, test, and release of software every time a change is committed. CI runs the build and test suite on each commit so regressions are caught within minutes instead of at release time; CD automates packaging and deploying those tested artifacts to the target environment, with or without a human approval gate. For the UDM specifically, the CI/CD pipeline lives in .github/workflows/: on every push to main, GitHub Actions regenerates the derived JSON endpoints (data-dictionary.json, relationships.json) from udm_schema.json, rebuilds the dashboard, and publishes to GitHub Pages. This is why the site and the SSOT stay in sync without manual steps, and why a broken commit is visible quickly.'}
              />
              <VocabRow
                term="Metadata"
                def={'Data about data. Where a data row captures a fact about the world (this award was for $500,000), metadata captures facts about the data itself — its type, source, lineage, ownership, freshness, classification, retention rules, and meaning. The UDM\u2019s data dictionary is metadata. So is a crosswalk, a data-type specification, a PII flag, an allowed-values list, a foreign-key relationship, and a last-updated timestamp. Metadata is what makes data interpretable without context — the difference between a column of numbers and a column of dollars as of Q2 2026, owned by the Office of Research, refreshed nightly. Systems that neglect metadata tend to re-derive the same institutional knowledge over and over; systems that treat metadata as a first-class artifact (like this site does) amortize that knowledge across every consumer.'}
              />
              <VocabRow
                term="Business definition"
                def={'The plain-language explanation of what a data element means expressed in terms the business actually uses, as opposed to its technical or database-level specification. A business definition of Award_Status_Date would be "the date on which the award\u2019s current status took effect" — not "TIMESTAMP column, nullable, default NULL." Business definitions are what turn a raw schema into a data dictionary. They are written by, or validated by, the people who make decisions with the data — not just the people who store it. When the business definition and the technical definition disagree, the business definition is usually right and the technical implementation needs updating; when no business definition exists, the column is almost always being misused somewhere.'}
              />
              <VocabRow
                term="IACUC"
                def={'Institutional Animal Care and Use Committee — a federally mandated committee at any research institution that uses vertebrate animals in research, teaching, or testing. The IACUC reviews and approves animal-use protocols before the work may begin, monitors ongoing compliance through semi-annual program reviews and facility inspections, and has the authority to suspend or terminate research that deviates from an approved protocol. IACUC is required by the Public Health Service Policy on Humane Care and Use of Laboratory Animals (PHS Policy), the Animal Welfare Act (AWA), and USDA regulations. Membership composition is prescribed by PHS Policy IV.A.3: at minimum a veterinarian with program responsibility, a practicing scientist experienced in animal research, a non-scientist member, and a community member not otherwise affiliated with the institution. In the UDM, IACUC protocol tracking lives in the ComplianceRequirement table; see also sibling committees IRB (human subjects) and IBC (biosafety / recombinant DNA).'}
              />
              <VocabRow
                term="IRB"
                def={'Institutional Review Board — a federally mandated committee that reviews and approves research involving human subjects before the work may begin, and monitors ongoing studies for compliance with the approved protocol and for any new risks to participants. Required by the Federal Policy for the Protection of Human Subjects (the Common Rule, 45 CFR 46) and, for FDA-regulated research, by 21 CFR 50 / 56. The IRB\u2019s charge is to ensure that risks to participants are minimized, that risks are reasonable relative to anticipated benefits, that informed consent is appropriately obtained and documented, and that additional safeguards are in place for vulnerable populations (children, prisoners, pregnant women, cognitively impaired individuals, and economically or educationally disadvantaged persons). Membership composition is prescribed by 45 CFR 46.107: at least five members of varying backgrounds, including at least one scientist, one non-scientist, and one member not otherwise affiliated with the institution. In the UDM, IRB protocol tracking lives in the ComplianceRequirement table; see also sibling committees IACUC (animal research) and IBC (biosafety / recombinant DNA).'}
              />
              <VocabRow
                term="Schema"
                def={'The formal description of the structure of a database or dataset — which tables (or collections / entities) exist, what columns each one has, what data types those columns hold, what constraints apply (required, unique, value ranges), and how the tables relate to each other via foreign keys. A schema is about structure, not content; two databases can share a schema and hold completely different data. The UDM is itself a schema — the "S" is implicit in the name — published as udm_schema.json so other systems can adopt it directly. In SQL, "schema" is also used in a narrower namespacing sense (e.g., lakehouse.bronze.banner, lakehouse.gold.Award); in a medallion lakehouse each layer is typically a SQL schema containing its own views. Distinct from data (the values in the tables), from the data dictionary (the descriptive metadata about the schema), and from schema mapping (the process of connecting one schema to another).'}
              />
              <VocabRow
                term="ERA (Electronic Research Administration)"
                def={'The umbrella term for the class of institutional software systems that support the full research-administration lifecycle: proposal preparation and routing, sponsor submission, compliance protocol management, award setup, post-award tracking, subaward administration, and reporting. ERA systems are what an OSP and its PIs actually log into day-to-day. Examples include Kuali Research, Cayuse, InfoEd, Streamlyne, NOVELUS, and locally built systems such as OpenERA. ERA systems are distinct from sponsor-side portals (Research.gov, eRA Commons, Grants.gov, NSPIRES) — sponsor portals are the external target of submissions; an ERA is the institution\u2019s own workspace for preparing, reviewing, and tracking them. In a UDM-based lakehouse, the institutional ERA is typically the single largest source-system feeding Bronze, and the one whose field names need the most crosswalk work.'}
              />
              <VocabRow
                term="ERP (Enterprise Resource Planning)"
                def={'The institution\u2019s core administrative system — the system of record for financials (general ledger, fund / org / account / program structure, budgets, transactions), HR (personnel, appointments, effort, payroll), procurement, and student records when the institution has one. Examples: Ellucian Banner, Oracle PeopleSoft, Workday, SAP, Oracle Cloud ERP. For research administration, the ERP is where sponsor expenditures are ultimately recorded, where the authoritative fund/index/account codes live, and where effort data originates. Post-award reconciliation is mostly a matter of comparing ERA records against ERP transactions. In a UDM-based lakehouse, the ERP is a second major source-system alongside the ERA; Bronze typically captures at least the transaction ledger, chart-of-accounts segments, and personnel appointment data from the ERP.'}
              />
              <VocabRow
                term="Data silo"
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
