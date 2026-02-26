import { useState, useCallback } from 'react';
import type { DataDictionary, Relationship } from '../../types';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
  reverseRelationships: Record<string, string[]>;
}

const entryPoints = [
  { name: 'Organization', desc: 'Institutional entities including sponsors, departments, and subrecipients', color: '#4A90E2' },
  { name: 'Project', desc: 'Research and training projects (navigate to Awards, Proposals)', color: '#BD10E0' },
  { name: 'Personnel', desc: 'Individuals involved in projects and awards', color: '#F5A623' },
  { name: 'Transaction', desc: 'Financial transactions, funds, accounts, and invoicing', color: '#7ED321' },
];

export default function DataDictionaryTab({ dataDictionary, relationships, reverseRelationships }: Props) {
  const [history, setHistory] = useState<string[]>([]);

  const currentTable = history.length > 0 ? history[history.length - 1] : null;

  const showTable = useCallback((tableName: string) => {
    setHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === tableName) return prev;
      return [...prev, tableName];
    });
  }, []);

  const navigateToIndex = useCallback((index: number) => {
    setHistory(prev => prev.slice(0, index + 1));
  }, []);

  const showHome = useCallback(() => {
    setHistory([]);
  }, []);

  const getForeignKeyTarget = useCallback((tableName: string, fieldName: string) => {
    const rel = relationships.find(r => r.from_table === tableName && r.from_column === fieldName);
    return rel ? rel.to_table : null;
  }, [relationships]);

  const table = currentTable ? dataDictionary.tables[currentTable] : null;
  const childTables = currentTable ? (reverseRelationships[currentTable] || []) : [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb */}
      {history.length > 0 && (
        <div style={{
          background: 'white', padding: '1rem 1.5rem', borderRadius: 8,
          marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
        }}>
          <a href="#" onClick={e => { e.preventDefault(); showHome(); }}
            style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
            Home
          </a>
          {history.map((t, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span style={{ color: '#95a5a6', userSelect: 'none' }}>&rsaquo;</span>
              {i === history.length - 1 ? (
                <span style={{ color: '#2c3e50', fontWeight: 600 }}>{t}</span>
              ) : (
                <a href="#" onClick={e => { e.preventDefault(); navigateToIndex(i); }}
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
                  {t}
                </a>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Home View */}
      {!currentTable && (
        <div style={{
          background: 'white', padding: '2rem', borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.5rem' }}>Getting Started</h2>
          <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
            The Universal Data Model (UDM) provides a standardized structure for research administration data.
            This interactive browser helps you explore table definitions and understand relationships between entities.
          </p>
          <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
            <strong style={{ color: '#2c3e50' }}>How to use:</strong> Click on a table below to see its fields and descriptions.
            You can navigate in two ways:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
            <li style={{ color: '#546e7a', marginBottom: '0.25rem' }}>
              <strong>Navigate up (to parents):</strong> Click foreign key fields
              (shown in <span style={{ color: '#667eea', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>blue with dotted underline</span>)
              to view referenced tables
            </li>
            <li style={{ color: '#546e7a' }}>
              <strong>Navigate down (to children):</strong> Click related table cards below the field list
              to view tables that reference the current table
            </li>
          </ul>
          <p style={{ color: '#546e7a' }}>Use the breadcrumb trail above to navigate back through your path.</p>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#2c3e50' }}>Entry Points</h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem',
          }}>
            {entryPoints.map(ep => (
              <div
                key={ep.name}
                onClick={() => showTable(ep.name)}
                style={{
                  background: 'white', padding: '1.5rem', borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer',
                  transition: 'all 0.3s ease', borderLeft: `4px solid ${ep.color}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#2c3e50' }}>{ep.name}</h3>
                <p style={{ color: '#546e7a', fontSize: '0.9rem' }}>{ep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {table && (
        <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', padding: '1.5rem 2rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{table.name}</h2>
            <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>{table.description}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '30%' }}>
                  Field Name
                </th>
                <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: 600, color: '#495057', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '70%' }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map(col => {
                const fkTarget = getForeignKeyTarget(currentTable!, col.name);
                return (
                  <tr key={col.name} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.2s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f8f9fa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                  >
                    <td style={{ padding: '1rem 2rem' }}>
                      <span
                        onClick={fkTarget ? () => showTable(fkTarget) : undefined}
                        title={fkTarget ? `Click to view ${fkTarget} table` : undefined}
                        style={{
                          fontFamily: "'Monaco', 'Courier New', monospace",
                          color: fkTarget ? '#667eea' : '#2c3e50',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          cursor: fkTarget ? 'pointer' : 'default',
                          textDecoration: fkTarget ? 'underline' : 'none',
                          textDecorationStyle: fkTarget ? 'dotted' : undefined,
                        }}
                      >
                        {col.name}
                      </span>
                      {col.pii && (
                        <span style={{
                          display: 'inline-block', background: '#e74c3c', color: 'white',
                          padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem',
                          fontWeight: 600, marginLeft: '0.5rem',
                        }}>
                          PII
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 2rem', color: '#546e7a', fontSize: '0.9rem' }}>
                      {col.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Related Tables */}
          {childTables.length > 0 && (
            <div style={{ padding: '2rem', background: '#f8f9fa', borderTop: '2px solid #e9ecef' }}>
              <h3 style={{ color: '#2c3e50', fontSize: '1.2rem', marginBottom: '1rem' }}>Related Tables</h3>
              <p style={{ color: '#546e7a', marginBottom: '1rem' }}>Tables that reference this table:</p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem',
              }}>
                {childTables.map(child => (
                  <div
                    key={child}
                    onClick={() => showTable(child)}
                    style={{
                      background: 'white', padding: '1rem', borderRadius: 6,
                      borderLeft: '3px solid #667eea', cursor: 'pointer',
                      transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 3px 8px rgba(0,0,0,0.15)';
                      (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#764ba2';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = '';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#667eea';
                    }}
                  >
                    <h4 style={{ color: '#2c3e50', fontSize: '0.95rem', fontWeight: 600 }}>{child}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
