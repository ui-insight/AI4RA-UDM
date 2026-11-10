import StatusChart from './StatusChart';
import statusPathSvg from '../../assets/proposal-award-status-path.svg?raw';
import otherRecordPathsSvg from '../../assets/other-record-status-paths.svg?raw';
import complianceLifecycleSvg from '../../assets/compliance-closeout-lifecycle-paths.svg?raw';

const card = {
  background: 'white', padding: '2rem', borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
}; 

export default function StatusesTab() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <div style={card}>
        <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Statuses</h2>
        <p style={{ color: '#546e7a', marginBottom: '1.5rem' }}>
          How records move through their stages. A record holds one value in each status field at a
          time. Hover over or tap a status to see its definition from the Glossary. The charts show the
          main paths, not every possible status change. For example, a withdrawn proposal that is revised
          goes back through internal approval, which the Glossary explains and the chart doesn't draw.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h3 style={{ color: '#2c3e50', margin: 0, fontSize: '1.3rem' }}>
            Proposal and Award Status Path
          </h3>
          {/* The PDF is rendered from the same SVG when the site is deployed. */}
          <a
            href={`${import.meta.env.BASE_URL}downloads/proposal-award-status-path.pdf`}
            download
            style={{
              padding: '0.4rem 0.9rem', border: '1.5px solid #667eea', borderRadius: 6,
              color: '#667eea', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
            }}
          >
            Download PDF
          </a>
        </div>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          A proposal has three status stages, and the award that follows has its own. The status that
          ends one stage starts the next.
        </p>
        <StatusChart svg={statusPathSvg} idPrefix="proposal" minWidth={900} />

        <h3 style={{ color: '#2c3e50', margin: '2rem 0 1rem', fontSize: '1.3rem' }}>
          Other Record Status Paths
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Early setup, modifications, subawards, payments, deliverables, and actions run alongside the
          proposal and award, each with its own statuses.
        </p>
        <StatusChart svg={otherRecordPathsSvg} idPrefix="other" minWidth={800} />

        <h3 style={{ color: '#2c3e50', margin: '2rem 0 1rem', fontSize: '1.3rem' }}>
          Compliance, Closeout, and Lifecycle Stage Paths
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Compliance requirements and closeouts have their own statuses. Budget, effort, and cost share
          move through lifecycle stages, keeping each earlier stage as history.
        </p>
        <StatusChart svg={complianceLifecycleSvg} idPrefix="compliance" minWidth={800} />
      </div>
    </div>
  );
}
