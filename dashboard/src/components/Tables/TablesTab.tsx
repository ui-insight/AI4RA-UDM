import { useState, useCallback } from 'react';
import type { DataDictionary, Relationship } from '../../types';
import { domainGroups, getDomain } from '../../data/domains';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
  reverseRelationships: Record<string, string[]>;
}

export default function TablesTab({ dataDictionary, relationships, reverseRelationships }: Props) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
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
    setSelectedDomain(null);
  }, []);

  const showDomain = useCallback((domainName: string) => {
    setSelectedDomain(domainName);
    setHistory([]);
  }, []);

  const getForeignKeyTarget = useCallback((tableName: string, fieldName: string) => {
    const rel = relationships.find(r => r.from_table === tableName && r.from_column === fieldName);
    return rel ? rel.to_table : null;
  }, [relationships]);

  const table = currentTable ? dataDictionary.tables[currentTable] : null;
  const childTables = currentTable ? (reverseRelationships[currentTable] || []) : [];
  const activeDomain = selectedDomain ? domainGroups.find(d => d.name === selectedDomain) : null;
  const showBreadcrumb = selectedDomain !== null || history.length > 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div style={{
          background: 'white', padding: '1rem 1.5rem', borderRadius: 8,
          marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
        }}>
          <a href="#" onClick={e => { e.preventDefault(); showHome(); }}
            style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
            Themes
          </a>
          {selectedDomain && (
            <>
              <span style={{ color: '#95a5a6', userSelect: 'none' }}>&rsaquo;</span>
              {history.length > 0 ? (
                <a href="#" onClick={e => { e.preventDefault(); setHistory([]); }}
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
                  {selectedDomain}
                </a>
              ) : (
                <span style={{ color: '#2c3e50', fontWeight: 600 }}>{selectedDomain}</span>
              )}
            </>
          )}
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

      {/* Themes Landing */}
      {!selectedDomain && !currentTable && (
        <div style={{
          background: 'white', padding: '2rem', borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Explore by Theme</h2>
          <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
            The UDM groups tables into {domainGroups.length} themes covering the research-administration
            lifecycle. Pick a theme to see its tables, then drill into a table to see its columns and
            foreign keys. Use the breadcrumb to navigate back.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem',
          }}>
            {domainGroups.map(d => (
              <div
                key={d.name}
                onClick={() => showDomain(d.name)}
                style={{
                  background: 'white', padding: '1.25rem 1.5rem', borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
                  transition: 'all 0.2s ease', borderLeft: `4px solid ${d.color}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: '0.35rem',
                }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#2c3e50', margin: 0 }}>{d.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.tables.length} tables</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#546e7a', lineHeight: 1.4 }}>
                  {d.tables.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Detail — tables within the selected domain */}
      {activeDomain && !currentTable && (
        <div style={{
          background: 'white', padding: '2rem', borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 999,
            fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem',
            background: `${activeDomain.color}18`,
            color: activeDomain.color,
            border: `1px solid ${activeDomain.color}40`,
          }}>
            {activeDomain.name}
          </div>
          <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            {activeDomain.tables.length} {activeDomain.tables.length === 1 ? 'table' : 'tables'} in this theme
          </h2>
          <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
            Pick a table to see its column definitions and follow foreign-key relationships into
            neighbouring tables (in this or any other theme).
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem',
          }}>
            {activeDomain.tables.map(tableName => {
              const t = dataDictionary.tables[tableName];
              if (!t) return null;
              return (
                <div
                  key={tableName}
                  onClick={() => showTable(tableName)}
                  style={{
                    background: 'white', padding: '1rem 1.25rem', borderRadius: 8,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)', cursor: 'pointer',
                    transition: 'all 0.2s ease', border: '1px solid #e9ecef',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = activeDomain.color;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#e9ecef';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: '0.3rem',
                  }}>
                    <h3 style={{
                      fontSize: '1rem', color: '#2c3e50', margin: 0,
                      fontFamily: "'Monaco', 'Courier New', monospace",
                    }}>
                      {tableName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {t.columns.length} fields
                    </span>
                  </div>
                  <p style={{
                    color: '#546e7a', fontSize: '0.85rem', lineHeight: 1.45, margin: 0,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
                    overflow: 'hidden',
                  }}>
                    {t.description || 'No description'}
                  </p>
                </div>
              );
            })}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{table.name}</h2>
              {(() => {
                const dom = getDomain(table.name);
                return dom ? (
                  <span style={{
                    padding: '0.15rem 0.6rem', borderRadius: 999,
                    fontSize: '0.75rem', fontWeight: 600,
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.35)',
                  }}>
                    {dom.name}
                  </span>
                ) : null;
              })()}
            </div>
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
