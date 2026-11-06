import statusPathUrl from '../../assets/proposal-award-status-path.svg';
import otherRecordPathsUrl from '../../assets/other-record-status-paths.svg';
import complianceLifecycleUrl from '../../assets/compliance-closeout-lifecycle-paths.svg';

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
          time. Definitions are in the Glossary and Data Dictionary tabs.
        </p>

        <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.3rem' }}>
          Proposal and Award Status Path
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          A proposal has three status stages, and the award that follows has its own. The status that
          ends one stage starts the next.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <img
            src={statusPathUrl}
            alt="Flow chart of the status path. Internal approval ends at Approved, which starts sponsor submission at Unsubmitted. Sponsor submission ends at Accepted, which starts sponsor decision at Pending. Sponsor decision ends at Awarded, which starts the award at In Setup."
            style={{ display: 'block', width: '100%', minWidth: 900, height: 'auto' }}
          />
        </div>

        <h3 style={{ color: '#2c3e50', margin: '2rem 0 1rem', fontSize: '1.3rem' }}>
          Other Record Status Paths
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Early setup, modifications, subawards, payments, deliverables, and actions run alongside the
          proposal and award, each with its own statuses.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <img
            src={otherRecordPathsUrl}
            alt="Flow chart of status paths for six records: early setup, modification, subaward, payment, deliverable, and action."
            style={{ display: 'block', width: '100%', minWidth: 800, height: 'auto' }}
          />
        </div>

        <h3 style={{ color: '#2c3e50', margin: '2rem 0 1rem', fontSize: '1.3rem' }}>
          Compliance, Closeout, and Lifecycle Stage Paths
        </h3>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          Compliance requirements and closeouts have their own statuses. Budget, effort, and cost share
          move through lifecycle stages, keeping each earlier stage as history.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <img
            src={complianceLifecycleUrl}
            alt="Flow chart of paths for compliance requirements and closeout, and lifecycle stages for budget, effort, and cost share."
            style={{ display: 'block', width: '100%', minWidth: 800, height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
