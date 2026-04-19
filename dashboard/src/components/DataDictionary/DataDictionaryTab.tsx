import { useMemo } from 'react';
import type { DataDictionary, Relationship } from '../../types';
import { domainGroups, getDomain } from '../../data/domains';

interface Props {
  dataDictionary: DataDictionary;
  relationships: Relationship[];
  reverseRelationships: Record<string, string[]>;
}

interface Row {
  name: string;
  fieldCount: number;
  description: string;
  parents: string[];
  children: string[];
  domain: string | null;
  domainColor: string | null;
}

export default function DataDictionaryTab({
  dataDictionary,
  relationships,
  reverseRelationships,
}: Props) {
  const rows: Row[] = useMemo(() => {
    const parentsByTable: Record<string, Set<string>> = {};
    for (const rel of relationships) {
      if (rel.from_table === rel.to_table) continue;
      (parentsByTable[rel.from_table] ??= new Set()).add(rel.to_table);
    }

    const out: Row[] = [];
    for (const [name, tbl] of Object.entries(dataDictionary.tables)) {
      const domain = getDomain(name);
      out.push({
        name,
        fieldCount: tbl.columns.length,
        description: tbl.description || '',
        parents: [...(parentsByTable[name] ?? [])].sort(),
        children: [...(reverseRelationships[name] ?? [])].sort(),
        domain: domain?.name ?? null,
        domainColor: domain?.color ?? null,
      });
    }

    const domainOrder = new Map(domainGroups.map((d, i) => [d.name, i]));
    out.sort((a, b) => {
      const da = a.domain ? domainOrder.get(a.domain) ?? 999 : 999;
      const db = b.domain ? domainOrder.get(b.domain) ?? 999 : 999;
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [dataDictionary, relationships, reverseRelationships]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
          Data Dictionary
        </h2>
        <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
          One row per UDM table, grouped by domain. Columns show the number of fields, a description,
          and the foreign-key neighbourhoods (parents are tables referenced by this table; children
          reference back into it). For column-level detail and breadcrumb navigation, use the{' '}
          <strong>Tables</strong> tab.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f1f5f9',
                  textAlign: 'left',
                  color: '#334155',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                <Th width={140}>Domain</Th>
                <Th width={180}>Table</Th>
                <Th width={70} align="right">Fields</Th>
                <Th>Description</Th>
                <Th width={200}>Parents</Th>
                <Th width={240}>Children</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  style={{
                    background: i % 2 === 0 ? 'white' : '#fafbfc',
                    borderBottom: '1px solid #e9ecef',
                    verticalAlign: 'top',
                  }}
                >
                  <Td>
                    {r.domain ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.6rem',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${r.domainColor}18`,
                          color: r.domainColor ?? '#546e7a',
                          border: `1px solid ${r.domainColor}40`,
                        }}
                      >
                        {r.domain}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <span style={{ fontWeight: 600, color: '#2c3e50' }}>{r.name}</span>
                  </Td>
                  <Td align="right">
                    <span style={{ color: '#546e7a', fontVariantNumeric: 'tabular-nums' }}>
                      {r.fieldCount}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ color: '#475569' }}>{r.description || '—'}</span>
                  </Td>
                  <Td>
                    <RelationList tables={r.parents} />
                  </Td>
                  <Td>
                    <RelationList tables={r.children} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
          {rows.length} tables · sorted by domain, then alphabetically within each domain.
        </p>
      </div>
    </div>
  );
}

function Th({
  children,
  width,
  align = 'left',
}: {
  children: React.ReactNode;
  width?: number;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        padding: '0.6rem 0.75rem',
        borderBottom: '2px solid #cbd5e1',
        fontWeight: 600,
        textAlign: align,
        width: width ?? 'auto',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      style={{
        padding: '0.6rem 0.75rem',
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

function RelationList({ tables }: { tables: string[] }) {
  if (tables.length === 0) {
    return <span style={{ color: '#94a3b8' }}>—</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
      {tables.map((t) => (
        <span
          key={t}
          style={{
            fontSize: '0.78rem',
            padding: '0.1rem 0.45rem',
            background: '#eef2ff',
            color: '#4338ca',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
