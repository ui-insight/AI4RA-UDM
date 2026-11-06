import { useEffect } from 'react';
import type { DataDictionary, Relationship, TabName } from '../../types';
import { coreModuleGroups, getCoreModule } from '../../data/coreModules';

const REPO_URL = 'https://github.com/ui-insight/AI4RA-UDM';
const FORUM_JOIN_URL = 'https://groups.ai4ra.uidaho.edu/g/main/join';
const FORUM_UDM_URL = 'https://groups.ai4ra.uidaho.edu/g/main/search?q=%23UDM&ct=1';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
  onNavigate: (tab: TabName) => void;
}

export default function HomeTab({ dataDictionary, relationships, onNavigate }: Props) {
  const tableCount = dataDictionary.table_count;
  const relationshipCount = relationships.length;
  const coreModuleCount = coreModuleGroups.length;
  const columnCount = Object.values(dataDictionary.tables)
    .reduce((n, t) => n + t.columns.length, 0);

  useCoreModuleCoverageWarning(dataDictionary);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <Card>
        <h2 style={{ color: '#2c3e50', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          AI4RA Unified Data Model
        </h2>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
          Start here
        </h3>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Every research office works with the same things: sponsors, PIs, awards, budgets. Every system
          describes them differently, so each report starts with someone reconciling them again.
        </p>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Because of that, reports and tools built at one institution rarely work at another.
        </p>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          The UDM is a proposed shared vocabulary for this data. It's a specification, not a database, so
          you keep your current systems and map your data to it once.
        </p>
        <p style={{ color: '#546e7a', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          This is a draft, written by a small team at one institution. It needs readers from other
          institutions to get it right.
        </p>
        <p style={{ color: '#546e7a', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          <strong>New here?</strong> Research administrators: start with the{' '}
          <NavLink onClick={() => onNavigate('glossary')}>Glossary</NavLink> for what terms mean and{' '}
          <NavLink onClick={() => onNavigate('statuses')}>Statuses</NavLink> for how records move. Data engineers and IT: start with{' '}
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
          <Stat value={coreModuleCount} label="Core Modules" accent="#16a34a" />
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
        <div style={{ flex: 1, minWidth: 220 }}>
          <h3 style={{ color: 'white', fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
            Tell us what you think
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            We want the Unified Data Model to be useful to everyone, and we need your help! You don't have to adopt it to give us feedback. Just compare it with your own work and tell us:
          </p>
          <ul style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 1rem', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
            <li>Does it describe awards, sponsors, and people the way you would?</li>
            <li>What does your office track that's missing?</li>
            <li>What do you call something that it names differently?</li>
            <li>Could you spare 30 minutes to walk through it against one of your systems?</li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={FORUM_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#4338ca',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Join the AI4RA list
            </a>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>
              and post using the #UDM hashtag.{' '}
              <a href={FORUM_UDM_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontWeight: 600 }}>
                See #UDM posts
              </a>
              . Please share public material only.
            </span>
          </div>
        </div>
      </div>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem' }}>
          Core Modules
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The model is organized into {coreModuleCount} core modules: the universal capabilities of research
          administration, required of every implementation.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {coreModuleGroups.map((d) => (
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
            title="Glossary"
            desc="Plain-language definitions of research administration terms, with sources and links to the model."
            onClick={() => onNavigate('glossary')}
          />
          <NavCard
            title="Statuses"
            desc="Charts of how proposals, awards, and other records move through their statuses."
            onClick={() => onNavigate('statuses')}
          />
          <NavCard
            title="Data Dictionary"
            desc="Summary table of every entity with field counts, descriptions, parents, children, and core module."
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
            desc="Reference SQL views for common reporting: active awards, overdue deliverables, and HERD survey spending."
            onClick={() => onNavigate('views')}
          />
          <NavCard
            title="Design"
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
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '1rem' }}>
          Machine-readable endpoints
        </h3>
        <p style={{ color: '#546e7a' }}>
          The full schema and its derivatives are published as JSON and can be fetched directly. See{' '}
          <NavLink onClick={() => onNavigate('infrastructure')}>Infrastructure</NavLink> for the list.
        </p>
      </Card>

      <Card>
        <h3 style={{ color: '#2c3e50', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
          About the project
        </h3>
        <p style={{ color: '#546e7a', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          The UDM is developed by <strong>AI4RA</strong> (AI for Research Administration) at the
          University of Idaho. It is openly licensed (CC BY 4.0 for the standard, Apache-2.0 for
          the code) and improves through community
          input: suggest changes, report issues, or join the discussion on GitHub.
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
            </a>:{' '}
            The broader AI for Research Administration initiative
          </li>
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
              GitHub repository
            </a>:{' '}
            Source of truth for the schema, spec, and this dashboard
          </li>
          <li>
            <a
              href={`${REPO_URL}/blob/main/vignettes/CHANGELOG.md`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              Changelog
            </a>:{' '}
            What changed in each release, with migration guidance
          </li>
          <li>
            <a
              href={`${REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea' }}
            >
              Issues
            </a>:{' '}
            Report problems and bugs
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

// Maintainer aid: if a table in the data dictionary has no core-module assignment,
// warn in the console instead of showing internal plumbing to visitors.
function useCoreModuleCoverageWarning(dataDictionary: DataDictionary) {
  useEffect(() => {
    const IMPLEMENTATION_TABLES = new Set(['AllowedValues', 'BudgetCategory']);
    const orphan = Object.keys(dataDictionary.tables).filter(
      (t) => !getCoreModule(t) && !IMPLEMENTATION_TABLES.has(t),
    );
    if (orphan.length > 0) {
      console.warn(
        `[UDM Dashboard] Tables missing a core-module assignment in dashboard/src/data/coreModules.ts: ${orphan.join(', ')}`,
      );
    }
  }, [dataDictionary]);
}
