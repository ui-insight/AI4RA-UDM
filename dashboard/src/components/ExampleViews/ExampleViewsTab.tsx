import type { ExampleView } from '../../types';
import { coreModuleGroups } from '../../data/coreModules';

const colorFor = (module: string) =>
  coreModuleGroups.find(group => group.name === module)?.color ?? '#667eea';

export default function ExampleViewsTab({ views }: { views: ExampleView[] }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.8rem' }}>
          Example Views
        </h2>
        <p style={{ color: '#546e7a', marginBottom: '2rem' }}>
          The UDM includes SQL views that combine data from several tables for common reporting needs.
          They are reference queries, written for MySQL, that institutions can adapt. This page is
          generated from <code>udm_schema.json</code>. To produce the NSF HERD survey, see the{' '}
          <a href="https://github.com/ui-insight/AI4RA-UDM/blob/main/vignettes/herd-report.md" style={{ color: '#667eea' }}>
            HERD report guide
          </a>.
        </p>

        {views.map(view => (
          <div key={view.name} style={{
            background: '#f8f9fa', padding: '1.5rem', borderRadius: 6,
            borderLeft: `4px solid ${colorFor(view.module)}`, marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h3 style={{ color: '#2c3e50', fontSize: '1.2rem', margin: 0 }}>{view.name}</h3>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{view.module}</span>
            </div>
            <p style={{ color: '#546e7a', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{view.purpose}</p>
            <details>
              <summary style={{ color: '#667eea', cursor: 'pointer', fontSize: '0.9rem' }}>Show SQL</summary>
              <pre style={{
                background: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: 6,
                overflowX: 'auto', fontSize: '0.82rem', marginTop: '0.75rem',
              }}>
                <code style={{ background: 'transparent', color: 'inherit', padding: 0 }}>{view.sql}</code>
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
