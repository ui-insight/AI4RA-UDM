import type { TabName } from '../types';
import { TAB_SLUGS } from '../hooks/useHashTab';

const tabs: { id: TabName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'statuses', label: 'Statuses' },
  { id: 'dictionary', label: 'Data Dictionary' },
  { id: 'tables', label: 'Explorer' },
  { id: 'erd', label: 'ERD Visualization' },
  { id: 'views', label: 'Example Views' },
  { id: 'ontology', label: 'Design' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

interface Props {
  activeTab: TabName;
}

// Each tab is a link to its own hash, so it can be copied, bookmarked, or opened in a new tab.
export default function TabBar({ activeTab }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '2px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <a
            key={tab.id}
            href={`#${TAB_SLUGS[tab.id]}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab.id ? '#667eea' : 'transparent'}`,
              fontSize: '1rem',
              fontWeight: 500,
              color: activeTab === tab.id ? '#667eea' : '#546e7a',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  );
}
