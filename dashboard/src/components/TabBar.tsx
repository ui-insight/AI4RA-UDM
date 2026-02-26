import type { TabName } from '../types';

const tabs: { id: TabName; label: string }[] = [
  { id: 'dictionary', label: 'Data Dictionary' },
  { id: 'erd', label: 'ERD Visualization' },
  { id: 'views', label: 'Example Views' },
  { id: 'ontology', label: 'Ontology & Design' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

interface Props {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '2px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
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
          </button>
        ))}
      </div>
    </div>
  );
}
