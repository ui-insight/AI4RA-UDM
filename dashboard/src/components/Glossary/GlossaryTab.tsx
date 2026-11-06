import { useMemo, useState } from 'react';
import { glossary, glossaryDomains } from '../../data/glossary';

export default function GlossaryTab() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return glossary.filter(t =>
      (!domain || t.domain === domain) &&
      (!q || `${t.term} ${t.also} ${t.definition}`.toLowerCase().includes(q))
    );
  }, [query, domain]);

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '0.35rem 0.8rem',
        borderRadius: 999,
        border: `1px solid ${active ? '#667eea' : '#cbd5e1'}`,
        background: active ? '#667eea' : 'white',
        color: active ? 'white' : '#334155',
        fontSize: '0.85rem',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Glossary</h2>
        <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
          Plain-language definitions of research administration terms you will meet in the UDM, in
          source systems, and on research analytics dashboards. For the tables and columns themselves,
          see the Data Dictionary tab.
        </p>

        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms, synonyms, and definitions"
          style={{
            width: '100%', padding: '0.6rem 0.8rem', fontSize: '1rem',
            border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: '1rem',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {chip('All', domain === null, () => setDomain(null))}
          {glossaryDomains.map(d => chip(d, domain === d, () => setDomain(domain === d ? null : d)))}
        </div>

        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          {shown.length} of {glossary.length} terms
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1', width: 220 }}>Term</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1' }}>Definition</th>
                <th style={{ padding: '0.6rem 0.75rem', borderBottom: '2px solid #cbd5e1', width: 170 }}>Domain</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(t => (
                <tr key={t.term} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.term}</div>
                    {t.also && (
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>{t.also}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>{t.definition}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{t.domain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
