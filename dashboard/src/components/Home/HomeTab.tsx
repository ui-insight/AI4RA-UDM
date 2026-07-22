import { useEffect } from 'react';
import type { DataDictionary, Relationship, TabName } from '../../types';
import { domainGroups, getDomain } from '../../data/domains';

// Temporary survey link (original: https://bit.ly/4b2ruQ3, to be restored later)
const SURVEY_URL = 'https://bit.ly/4b5b21q';
const REPO_URL = 'https://github.com/ui-insight/AI4RA-UDM';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
  onNavigate: (tab: TabName) => void;
}

export default function HomeTab({ dataDictionary, relationships, onNavigate }: Props) {
  const tableCount = dataDictionary.table_count;
  const relationshipCount = relationships.length;
  const domainCount = domainGroups.length;
  const columnCount = Object.values(dataDictionary.tables)
    .reduce((n, t) => n + t.columns.length, 0);

  useDomainCoverageWarning(dataDictionary);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          AI4RA Unified Data Model
        </h2>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Every institution stores the same research administration data differently. Proposals,
          awards, budgets, and compliance records are scattered across eRA, finance, and HR systems —
          locked in proprietary schemas with inconsistent names, structures, and definitions. Simple
          questions span three systems, cross-institution reporting means manual reconciliation, and
          every institution hand-builds the same field mappings from scratch.
        </p>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          The UDM is a shared answer: a canonical schema for research administration — pre-award
          proposal preparation, sponsor submission, post-award management, financial accounting,
          personnel effort, and compliance — that institutions map their local systems onto. It is a
          specification, not a database: implement it in whatever storage technology fits your
          environment. A common model makes research administration data Findable, Accessible,
          Interoperable, and Reusable (FAIR) — within an institution and across them.
        </p>
        <p style={{ color: '#546e7a', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          <strong>New here?</strong> Research administrators: start with the{' '}
          <NavLink onClick={() => onNavigate('dictionary')}>Data Dictionary</NavLink> to see the
          entities in plain language. Data engineers and IT: start with{' '}
          <NavLink onClick={() => onNavigate('infrastructure')}>Infrastructure</NavLink> for how the
          UDM fits your stack, then grab the JSON endpoints below.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
          }}
        >
          <Stat value={tableCount} label="Tables" accent="#667eea" />
          <Stat value={columnCount} label="Documented Columns" accent="#0ea5e9" />
          <Stat value={relationshipCount} label="Foreign-Key Relationships" accent="#7c3aed" />
          <Stat value={domainCount} label="Domains" accent="#16a34a" />
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

      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 8,
          padding: '2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <img
            src="assets/udm-survey-qr.png"
            alt="QR code for UDM feedback survey"
            style={{ width: 140, height: 140, borderRadius: 8, background: 'white', padding: 6, display: 'block' }}
          />
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
            Scan to open the survey
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ color: 'white', fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
            Share your feedback
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 1rem', lineHeight: 1.5 }}>
            Help shape the UDM by telling us what works, what's missing, and what your institution needs.
            Take the anonymous survey, join the public feedback thread on GitHub (requires a free GitHub
            account), or email us directly.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#667eea',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Get involved
            </a>
            <a
              href={`${REPO_URL}/discussions/59#new_comment_field`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.6)',
                color: 'white',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Leave feedback on GitHub
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Assembled at click time so the address never appears in the page source
                const user = ['nlay', 'man'].join('');
                const host = ['uidaho', 'edu'].join('.');
                window.location.href = `mailto:${user}@${host}?subject=${encodeURIComponent('UDM feedback')}`;
              }}
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.6)',
                color: 'white',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Email feedback
            </a>
          </div>
        </div>
      </div>

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
            onClick={() => onNavigate('dictionary')}
          />
          <NavCard
            title="Explorer"
            desc="Drill down into individual tables column-by-column. Navigate foreign keys with a breadcrumb trail."
            onClick={() => onNavigate('tables')}
          />
          <NavCard
            title="ERD Visualization"
            desc="Interactive entity-relationship diagram. Zoom, pan, and highlight neighbourhoods of related tables."
            onClick={() => onNavigate('erd')}
          />
          <NavCard
            title="Example Views"
            desc="Reference SQL views for common analytics: active awards, expiring deliverables, budget comparisons."
            onClick={() => onNavigate('views')}
          />
          <NavCard
            title="Ontology & Design"
            desc="Naming conventions, design patterns, and the rationale behind the schema's structure."
            onClick={() => onNavigate('ontology')}
          />
          <NavCard
            title="Infrastructure"
            desc="Medallion-architecture guidance (Bronze / Silver / Gold / Platinum) and the JSON endpoints served by this site."
            onClick={() => onNavigate('infrastructure')}
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
            <a href="data/udm_schema_v2.json" style={{ color: '#667eea' }}>
              /data/udm_schema_v2.json
            </a>{' '}
            — UDM v2 schema (current): semantic conventions, cross-row constraints, derived values, example views
          </li>
          <li>
            <a href="data/udm_schema.json" style={{ color: '#667eea' }}>
              /data/udm_schema.json
            </a>{' '}
            — UDM v1 schema, preserved for reference
          </li>
          <li>
            <a href="data/data-dictionary.json" style={{ color: '#667eea' }}>
              /data/data-dictionary.json
            </a>{' '}
            — table and column descriptions, synonyms, PII flags (regenerated from v2)
          </li>
          <li>
            <a href="data/relationships.json" style={{ color: '#667eea' }}>
              /data/relationships.json
            </a>{' '}
            — foreign-key relationships ready for ERD or validation tooling
          </li>
        </ul>
      </Card>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
          About the project
        </h3>
        <p style={{ color: '#546e7a', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          The UDM is developed by <strong>AI4RA</strong> (AI for Research Administration) at the
          University of Idaho. It is open source under GPL-3.0 and improves through community
          input — suggest changes, report issues, or join the discussion on GitHub.
        </p>
        <ul style={{ paddingLeft: '1.25rem', color: '#546e7a', lineHeight: 1.8 }}>
          <li>
            <a
              href="https://ai4ra.uidaho.edu"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              AI4RA project site
            </a>{' '}
            — the broader AI for Research Administration initiative
          </li>
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
              GitHub repository
            </a>{' '}
            — source of truth for the schema, spec, and this dashboard
          </li>
          <li>
            <a
              href={`${REPO_URL}/blob/main/vignettes/CHANGELOG.md`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              Changelog
            </a>{' '}
            — what changed in v2, and migration guidance from v1
          </li>
          <li>
            <a
              href={`${REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              Issues &amp; discussions
            </a>{' '}
            — propose tables, columns, or conventions
          </li>
        </ul>
      </Card>
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

function NavCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#f8f9fa',
        padding: '1rem',
        borderRadius: 6,
        borderLeft: '4px solid #667eea',
        cursor: 'pointer',
      }}
    >
      <h4 style={{ color: '#2c3e50', marginBottom: '0.35rem' }}>{title}</h4>
      <p style={{ color: '#546e7a', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
    </div>
  );
}

function NavLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      href="#"
      style={{ color: '#667eea', fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

// Maintainer aid: if a table in the data dictionary has no domain assignment,
// warn in the console instead of showing internal plumbing to visitors.
function useDomainCoverageWarning(dataDictionary: DataDictionary) {
  useEffect(() => {
    const IMPLEMENTATION_TABLES = new Set(['AllowedValues', 'BudgetCategory']);
    const orphan = Object.keys(dataDictionary.tables).filter(
      (t) => !getDomain(t) && !IMPLEMENTATION_TABLES.has(t),
    );
    if (orphan.length > 0) {
      console.warn(
        `[UDM Dashboard] Tables missing a domain assignment in dashboard/src/data/domains.ts: ${orphan.join(', ')}`,
      );
    }
  }, [dataDictionary]);
}
