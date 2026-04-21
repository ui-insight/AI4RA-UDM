import type { DataDictionary, Relationship } from '../../types';
import { domainGroups, getDomain } from '../../data/domains';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
}

export default function HomeTab({ dataDictionary, relationships }: Props) {
  const tableCount = dataDictionary.table_count;
  const relationshipCount = relationships.length;
  const domainCount = domainGroups.length;
  const piiCount = Object.values(dataDictionary.tables)
    .flatMap((t) => t.columns)
    .filter((c) => c.pii).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          AI4RA Unified Data Model
        </h2>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          A canonical schema for research administration — pre-award proposal preparation, sponsor
          submission, post-award management, financial accounting, personnel effort, compliance, and
          the operational systems that tie them together. The UDM is a specification, not a database:
          institutions implement it in whatever storage technology fits their environment.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
          }}
        >
          <Stat value={tableCount} label="Tables" accent="#667eea" />
          <Stat value={relationshipCount} label="Foreign-Key Relationships" accent="#7c3aed" />
          <Stat value={domainCount} label="Domains" accent="#0ea5e9" />
          <Stat value={piiCount} label="PII Fields" accent="#dc2626" />
        </div>
      </Card>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem' }}>
          Domain Organization
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The model is organized into {domainCount} domains. Each covers a distinct slice of the research
          administration lifecycle.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {domainGroups.map((d) => (
            <div
              key={d.name}
              style={{
                background: '#f8f9fa',
                padding: '0.85rem 1rem',
                borderRadius: 6,
                borderLeft: `4px solid ${d.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontWeight: 600, color: '#2c3e50' }}>{d.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.tables.length} tables</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#546e7a' }}>{d.tables.join(', ')}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem' }}>
          Where to start
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          <NavCard
            title="Data Dictionary"
            desc="Summary table of every entity with field counts, descriptions, parents, children, and domain."
          />
          <NavCard
            title="Explorer"
            desc="Drill down into individual tables column-by-column. Navigate foreign keys with a breadcrumb trail."
          />
          <NavCard
            title="ERD Visualization"
            desc="Interactive entity-relationship diagram. Zoom, pan, and highlight neighbourhoods of related tables."
          />
          <NavCard
            title="Example Views"
            desc="Reference SQL views for common analytics: active awards, expiring deliverables, budget comparisons."
          />
          <NavCard
            title="Ontology & Design"
            desc="Naming conventions, design patterns, and the rationale behind the schema's structure."
          />
          <NavCard
            title="Infrastructure"
            desc="Medallion-architecture guidance (Bronze / Silver / Gold / Platinum) and the JSON endpoints served by this site."
          />
        </div>
      </Card>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
          Machine-readable endpoints
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '0.75rem' }}>
          The full schema and its derivatives are published as JSON and can be fetched directly.
        </p>
        <ul style={{ paddingLeft: '1.25rem', color: '#546e7a', lineHeight: 1.8 }}>
          <li>
            <a href="data/udm_schema.json" style={{ color: '#667eea' }}>
              /data/udm_schema.json
            </a>{' '}
            — complete schema including views and constraints
          </li>
          <li>
            <a href="data/data-dictionary.json" style={{ color: '#667eea' }}>
              /data/data-dictionary.json
            </a>{' '}
            — table and column descriptions, synonyms, PII flags
          </li>
          <li>
            <a href="data/relationships.json" style={{ color: '#667eea' }}>
              /data/relationships.json
            </a>{' '}
            — foreign-key relationships ready for ERD or validation tooling
          </li>
        </ul>
      </Card>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>
        Domain assignments are defined at{' '}
        <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 3 }}>
          dashboard/src/data/domains.ts
        </code>
        . Table and relationship counts are derived at load time from{' '}
        <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 3 }}>
          udm_schema.json
        </code>
        .
      </p>

      <DomainFallbackNotice dataDictionary={dataDictionary} />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
      }}
    >
      {children}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div
      style={{
        background: '#f8f9fa',
        padding: '1.25rem',
        borderRadius: 6,
        borderTop: `4px solid ${accent}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#2c3e50', lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#546e7a', marginTop: '0.35rem' }}>{label}</div>
    </div>
  );
}

function NavCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        background: '#f8f9fa',
        padding: '1rem',
        borderRadius: 6,
        borderLeft: '4px solid #667eea',
      }}
    >
      <h4 style={{ color: '#2c3e50', marginBottom: '0.35rem' }}>{title}</h4>
      <p style={{ color: '#546e7a', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
    </div>
  );
}

function DomainFallbackNotice({ dataDictionary }: { dataDictionary: DataDictionary }) {
  const orphan = Object.keys(dataDictionary.tables).filter((t) => !getDomain(t));
  if (orphan.length === 0) return null;
  return (
    <div
      style={{
        background: '#fef3c7',
        border: '1px solid #fcd34d',
        color: '#92400e',
        padding: '0.85rem 1rem',
        borderRadius: 6,
        fontSize: '0.85rem',
        marginTop: '1rem',
      }}
    >
      <strong>Unmapped tables:</strong> {orphan.join(', ')} — update{' '}
      <code>dashboard/src/data/domains.ts</code>.
    </div>
  );
}
