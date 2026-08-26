const Section = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'white', padding: '2rem', borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{
    color: '#2c3e50', borderBottom: '2px solid #667eea',
    paddingBottom: '0.5rem', marginBottom: '1rem',
  }}>
    {children}
  </h2>
);

const ConventionItem = ({ children }: { children: React.ReactNode }) => (
  <li style={{ padding: '0.75rem 0', borderBottom: '1px solid #e9ecef' }}>{children}</li>
);

const PatternCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: '#f8f9fa', padding: '1rem', borderRadius: 6,
    borderLeft: '3px solid #667eea',
  }}>
    <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1rem' }}>{title}</h4>
    {children}
  </div>
);

const suffixes = [
  { suffix: '_ID', purpose: 'Primary or foreign key identifier', example: 'Organization_ID, Award_ID' },
  { suffix: '_Code', purpose: 'Short, human-readable identifier', example: 'Fund_Code, Account_Code' },
  { suffix: '_Name', purpose: 'Human-readable name or title', example: 'Organization_Name, First_Name' },
  { suffix: '_Description', purpose: 'Longer text description', example: 'Value_Description, Outcome_Description' },
  { suffix: '_Date', purpose: 'Date or datetime value', example: 'Start_Date, Due_Date' },
  { suffix: '_Type', purpose: 'Classification or category', example: 'Report_Type; institution-specific types use *_Type_Value_ID → AllowedValues' },
  { suffix: '_Status', purpose: 'Current state or status', example: 'Award_Status, Deadline_Status' },
  { suffix: '_Amount', purpose: 'Monetary value', example: 'Transaction_Amount, Funding_Ceiling_Amount' },
  { suffix: '_Percent', purpose: 'Percentage value', example: 'Effort_Percent, Rate_Percent' },
  { suffix: '_Number', purpose: 'Sequential or reference number', example: 'Award_Number, Modification_Number' },
];

const th: React.CSSProperties = {
  textAlign: 'left', padding: '0.6rem 0.75rem', background: '#f8f9fa',
  color: '#2c3e50', borderBottom: '2px solid #e9ecef', fontSize: '0.9rem',
};
const td: React.CSSProperties = {
  padding: '0.6rem 0.75rem', borderBottom: '1px solid #e9ecef',
  color: '#546e7a', fontSize: '0.9rem', verticalAlign: 'top',
};

const layers = [
  { n: '1', name: 'System of Record', holds: 'UDM source-of-truth research administration data', profile: 'Versioned OLAP storage with transaction metadata capture', examples: 'Apache Iceberg + Nessie, Dolt, PostgreSQL temporal tables' },
  { n: '2', name: 'System of Insight', holds: 'Derived data: review findings, dashboards, reports, computed aggregates', profile: "View / projection layer inside the System of Record's query engine", examples: 'Trino views, materialized views' },
  { n: '3', name: 'System of Engagement', holds: 'Non-UDM application infrastructure: authentication, session state, submission tooling, in-flight drafts, observability', profile: 'OLTP, transactional, user-facing', examples: 'PostgreSQL or equivalent' },
];

const logicKinds = [
  { kind: 'Invariants (validation)', examples: 'Two-FK exclusive-or, lifecycle chain rules, conditional-required columns', home: 'System of Record enforcement; mechanism (constraint, trigger, scheduled check) is the institution’s choice', spec: '71 typed cross-row constraints, machine-readable' },
  { kind: 'Derivation', examples: 'Award.Current_End_Date, Current_Total_Funded, lineage roots', home: 'Write-path recompute against the System of Record', spec: 'Derived-value rules with documented recompute triggers' },
  { kind: 'Business / analytical', examples: 'Active awards, overdue reports, requirement satisfaction, review findings', home: 'System of Insight views over UDM data', spec: '12 example views as reference implementations; finding and checklist shapes documented as patterns' },
  { kind: 'Workflow / process', examples: 'Approval gating, reviewer auto-assignment, escalation', home: 'System of Engagement application code, reading Insight views', spec: 'Deliberately unspecified; the spec documents the data the workflow reads, never the workflow itself' },
  { kind: 'Usage conventions', examples: 'Modification vs new Award, role-bearer changes, submission events', home: 'Consumers and integrators', spec: '20 semantic conventions' },
];

const tiers = [
  { tier: 'Core', contents: 'The 47 canonical tables in the specification', meaning: 'Required for any UDM implementation' },
  { tier: 'Standard modules', contents: 'Optional, fully specified, versioned extensions. Planned: compliance protocols, governance, research outputs', meaning: 'Adopted per implementation and declared, e.g. "UDM 2.x core + modules: governance, outputs." Two adopters of the same module are interoperable on it' },
  { tier: 'Local extensions', contents: 'Institution-specific additions outside the specification', meaning: 'Not specified by UDM; the optional-extensions registry documents where common cases belong' },
];

export default function OntologyTab() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <Section>
        <SectionTitle>Architecture &amp; Conformance</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          <strong>The UDM is the data model of the System of Record.</strong> Data belongs in the UDM
          only if it is source-of-truth research administration data that cannot be regenerated from
          other UDM data plus engine logic. Derived data lives in the System of Insight; application
          infrastructure lives in the System of Engagement; row history lives in the storage layer's
          versioned history.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th style={th}>Layer</th><th style={th}>Holds</th><th style={th}>Tech profile</th><th style={th}>Examples</th>
              </tr>
            </thead>
            <tbody>
              {layers.map((l) => (
                <tr key={l.n}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}><strong>{l.n}. {l.name}</strong></td>
                  <td style={td}>{l.holds}</td>
                  <td style={td}>{l.profile}</td>
                  <td style={td}>{l.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ color: '#2c3e50', marginBottom: '0.75rem' }}>Where logic lives</h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Logic follows the same layering as data. The UDM fully specifies the logic the System of
          Record owns (invariants, derivation), ships reference implementations for the System of
          Insight (views), and deliberately leaves workflow logic to the institution.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th style={th}>Kind of logic</th><th style={th}>Examples</th><th style={th}>Where it lives</th><th style={th}>How the UDM specifies it</th>
              </tr>
            </thead>
            <tbody>
              {logicKinds.map((l) => (
                <tr key={l.kind}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}><strong>{l.kind}</strong></td>
                  <td style={td}>{l.examples}</td>
                  <td style={td}>{l.home}</td>
                  <td style={td}>{l.spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ color: '#2c3e50', marginBottom: '0.75rem' }}>Conformance tiers</h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          An implementation is described by what it adopts. The core stays small; comprehensiveness
          comes from fully specified optional modules rather than an ever-growing required table set.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Tier</th><th style={th}>Contents</th><th style={th}>Conformance meaning</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.tier}>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}><strong>{t.tier}</strong></td>
                  <td style={td}>{t.contents}</td>
                  <td style={td}>{t.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionTitle>Naming Conventions</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The UDM follows consistent naming patterns to ensure clarity and predictability across the schema.
        </p>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Tables</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong style={{ fontFamily: 'monospace' }}>PascalCase</strong> - All table names use PascalCase with no underscores</ConventionItem>
          <ConventionItem>Examples: <code>Organization</code>, <code>AwardRole</code>, <code>ComplianceCoverage</code></ConventionItem>
          <ConventionItem>Singular nouns (e.g., <code>Personnel</code> not <code>People</code>, <code>Organization</code> not <code>Organizations</code>)</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Columns</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong style={{ fontFamily: 'monospace' }}>Snake_Case</strong> - All column names use Snake_Case with underscores separating words</ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>First_Name</code>, <code>Sponsor_Organization_ID</code></ConventionItem>
          <ConventionItem>First letter of each word is capitalized (e.g., <code>Start_Date</code> not <code>start_date</code>)</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Primary Keys</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong>Pattern:</strong> <code>TableName_ID</code></ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>Award_ID</code>, <code>Personnel_ID</code></ConventionItem>
          <ConventionItem>Always ends with <code>_ID</code> suffix</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Foreign Keys</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong>Pattern:</strong> <code>ReferencedTableName_ID</code></ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>Sponsor_Organization_ID</code>, <code>Award_ID</code></ConventionItem>
          <li style={{ padding: '0.75rem 0' }}>Descriptive prefix when multiple FKs reference the same table (e.g., <code>Sponsor_Organization_ID</code>, <code>Lead_Organization_ID</code>)</li>
        </ul>
      </Section>

      <Section>
        <SectionTitle>Common Field Suffixes</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>Standard suffixes indicate field purpose and data type:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
          <thead>
            <tr>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Suffix</th>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Purpose</th>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Example</th>
            </tr>
          </thead>
          <tbody>
            {suffixes.map(s => (
              <tr key={s.suffix}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef', fontFamily: "'Monaco', 'Courier New', monospace", color: '#667eea', fontWeight: 500 }}>{s.suffix}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef' }}>{s.purpose}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef' }}>{s.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section>
        <SectionTitle>Design Patterns</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <PatternCard title="AllowedValues Table">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Extensible controlled vocabulary for enumerations that may change or vary by institution.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Pattern:</strong> <code>TableName_Type_Value_ID</code></p>
          </PatternCard>
          <PatternCard title="Self-Referential Foreign Keys">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tables that reference themselves to represent hierarchies.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Pattern:</strong> <code>Parent_TableName_ID</code></p>
          </PatternCard>
          <PatternCard title="Bridge/Junction Tables">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Many-to-many relationships use compound names.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Example:</strong> <code>ComplianceCoverage</code> (links ComplianceRequirement to Award/Subaward)</p>
          </PatternCard>
          <PatternCard title="Status vs Type">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Status:</strong> Current state (often changes) - fixed vocabulary, enforced with a CHECK constraint or ENUM</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Type:</strong> Category/classification (institution-specific) - use AllowedValues</p>
          </PatternCard>
        </div>
      </Section>

      <Section>
        <SectionTitle>UDM v2 Patterns</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          v2 defines eight universal patterns; the four below do the most structural work and recur
          across the most tables. Each one is documented in detail in the prose spec
          (see <code>vignettes/udm-v2-system-of-record.md</code>) and in the structured constraint
          catalog in <code>udm_schema_v2.json</code>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <PatternCard title="Lifecycle_Stage Discriminator">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              One table carries multiple lifecycle stages distinguished by a <code>Lifecycle_Stage</code> column.
              Revisions chain through <code>Parent_*_ID</code>; chains are immutable and never branch.
            </p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>
              <strong>Used by:</strong> Budget (Proposed/Approved/Current/Actual),
              Effort (Proposed/Approved/Charged/Certified), CostShare (Proposed/Committed/Met/Waived),
              Payment (Scheduled/Invoiced/Received/Reconciled).
            </p>
          </PatternCard>
          <PatternCard title="Two-FK XOR Attachment">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Satellite tables attach to either Award or Subaward via two nullable FK columns; exactly
              one is populated per row. On Budget and CostShare the exclusive-or applies only at
              post-award Lifecycle_Stages (both FKs are null at Proposed).
            </p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>
              <strong>Used by:</strong> Payment, Modification, Transaction, Equipment, Report,
              Closeout, Terms, AwardRole, ComplianceCoverage, and (stage-conditionally) Budget and
              CostShare. ContactDetails and Negotiation use the same mechanics with different parents.
            </p>
          </PatternCard>
          <PatternCard title="Polymorphic Attachment">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              A satellite table references a parent of arbitrary type via <code>(Related_Entity_Type, Related_Entity_ID)</code>.
              Type-stable references; soft deletes preserve attachments.
            </p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>
              <strong>Used by:</strong> Document, Communication, Restriction, Deadline, Classification, Action, ActivityLog.
            </p>
          </PatternCard>
          <PatternCard title="Derived Columns">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Materialized convenience columns recomputed on documented triggers. Always recoverable from base data.
            </p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>
              <strong>Examples:</strong> <code>Award.Current_End_Date</code>, <code>Award.Current_Total_Funded</code>,
              <code>Proposal.Originating_Proposal_ID</code>, <code>Award.Subject_To_Federal_Funding</code>.
            </p>
          </PatternCard>
        </div>
      </Section>
    </div>
  );
}
