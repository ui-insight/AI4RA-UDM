import { exampleViews } from '../../data/exampleViews';

export default function ExampleViewsTab() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.8rem' }}>
          Useful Database Views
        </h2>
        <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
          The UDM includes pre-built SQL views that combine data from multiple tables for common reporting needs.
          These views simplify complex queries and provide ready-to-use data for dashboards and reports.
        </p>

        {exampleViews.map(view => (
          <div key={view.name} style={{
            background: '#f8f9fa', padding: '1.5rem', borderRadius: 6,
            borderLeft: `4px solid ${view.color}`, marginBottom: '1.5rem',
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{view.name}</h3>
            <p style={{ color: '#546e7a', fontSize: '0.95rem', marginBottom: '1rem' }}>{view.description}</p>
            <div style={{ background: 'white', padding: '1rem', borderRadius: 4, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                    {view.columns.map(col => (
                      <th key={col.header} style={{
                        padding: '0.5rem', textAlign: (col.align || 'left') as 'left' | 'right' | 'center',
                        fontWeight: 600, color: '#495057',
                      }}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: ri < view.rows.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                      {row.map((cell, ci) => {
                        const val = typeof cell === 'string' ? { value: cell } : cell;
                        return (
                          <td key={ci} style={{
                            padding: '0.5rem',
                            textAlign: (view.columns[ci]?.align || 'left') as 'left' | 'right' | 'center',
                            color: val.color || '#2c3e50',
                            fontWeight: val.fontWeight as 'normal' | 'bold' | '600' | undefined,
                            fontFamily: val.mono ? "'Monaco', 'Courier New', monospace" : undefined,
                            fontSize: val.fontSize,
                          }}>
                            {val.value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div style={{
          marginTop: '2rem', padding: '1rem', background: '#fff3cd',
          borderLeft: '4px solid #ffc107', borderRadius: 4,
        }}>
          <strong style={{ color: '#856404' }}>Source: </strong>
          <code>udm_schema.json</code>
          <p style={{ color: '#856404', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            These views are defined in udm_schema.json and serve as reference query implementations
            that institutions can adapt for their reporting needs.
          </p>
        </div>
      </div>
    </div>
  );
}
