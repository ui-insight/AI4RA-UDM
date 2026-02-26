const Section = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'white', padding: '2rem', borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{
    color: '#2c3e50', borderBottom: '2px solid #667eea',
    paddingBottom: '0.5rem', marginBottom: '1rem',
  }}>
    {children}
  </h2>
);

const ConventionItem = ({ children }: { children: React.ReactNode }) => (
  <li style={{ padding: '0.75rem 0', borderBottom: '1px solid #e9ecef' }}>{children}</li>
);

const PatternCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: '#f8f9fa', padding: '1rem', borderRadius: 6,
    borderLeft: '3px solid #667eea',
  }}>
    <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '1rem' }}>{title}</h4>
    {children}
  </div>
);

const suffixes = [
  { suffix: '_ID', purpose: 'Primary or foreign key identifier', example: 'Organization_ID, Award_ID' },
  { suffix: '_Code', purpose: 'Short, human-readable identifier', example: 'Fund_Code, Account_Code' },
  { suffix: '_Name', purpose: 'Human-readable name or title', example: 'Organization_Name, First_Name' },
  { suffix: '_Description', purpose: 'Longer text description', example: 'Project_Description, Role_Description' },
  { suffix: '_Date', purpose: 'Date or datetime value', example: 'Start_Date, Award_Date' },
  { suffix: '_Type', purpose: 'Classification or category (use AllowedValues)', example: 'Project_Type → use Type_Value_ID' },
  { suffix: '_Status', purpose: 'Current state or status', example: 'Award_Status, Proposal_Status' },
  { suffix: '_Amount', purpose: 'Monetary value', example: 'Award_Amount, Transaction_Amount' },
  { suffix: '_Percent', purpose: 'Percentage value', example: 'Effort_Percent, Indirect_Rate_Percent' },
  { suffix: '_Number', purpose: 'Sequential or reference number', example: 'Award_Number, Period_Number' },
];

export default function OntologyTab() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <Section>
        <SectionTitle>Naming Conventions</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>
          The UDM follows consistent naming patterns to ensure clarity and predictability across the schema.
        </p>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Tables</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong style={{ fontFamily: 'monospace' }}>PascalCase</strong> - All table names use PascalCase with no underscores</ConventionItem>
          <ConventionItem>Examples: <code>Organization</code>, <code>ProjectRole</code>, <code>AwardBudgetPeriod</code></ConventionItem>
          <ConventionItem>Singular nouns (e.g., <code>Personnel</code> not <code>People</code>, <code>Organization</code> not <code>Organizations</code>)</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Columns</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong style={{ fontFamily: 'monospace' }}>Snake_Case</strong> - All column names use Snake_Case with underscores separating words</ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>First_Name</code>, <code>Sponsor_Organization_ID</code></ConventionItem>
          <ConventionItem>First letter of each word is capitalized (e.g., <code>Start_Date</code> not <code>start_date</code>)</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Primary Keys</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong>Pattern:</strong> <code>TableName_ID</code></ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>Project_ID</code>, <code>Personnel_ID</code></ConventionItem>
          <ConventionItem>Always ends with <code>_ID</code> suffix</ConventionItem>
        </ul>

        <h3 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Foreign Keys</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <ConventionItem><strong>Pattern:</strong> <code>ReferencedTableName_ID</code></ConventionItem>
          <ConventionItem>Examples: <code>Organization_ID</code>, <code>Sponsor_Organization_ID</code>, <code>Award_ID</code></ConventionItem>
          <li style={{ padding: '0.75rem 0' }}>Descriptive prefix when multiple FKs reference the same table (e.g., <code>Sponsor_Organization_ID</code>, <code>Lead_Organization_ID</code>)</li>
        </ul>
      </Section>

      <Section>
        <SectionTitle>Common Field Suffixes</SectionTitle>
        <p style={{ color: '#546e7a', marginBottom: '1rem' }}>Standard suffixes indicate field purpose and data type:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
          <thead>
            <tr>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Suffix</th>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Purpose</th>
              <th style={{ background: '#f8f9fa', padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#495057', borderBottom: '2px solid #e9ecef' }}>Example</th>
            </tr>
          </thead>
          <tbody>
            {suffixes.map(s => (
              <tr key={s.suffix}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef', fontFamily: "'Monaco', 'Courier New', monospace", color: '#667eea', fontWeight: 500 }}>{s.suffix}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef' }}>{s.purpose}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9ecef' }}>{s.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section>
        <SectionTitle>Design Patterns</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <PatternCard title="AllowedValues Table">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Extensible controlled vocabulary for enumerations that may change or vary by institution.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Pattern:</strong> <code>TableName_Type_Value_ID</code></p>
          </PatternCard>
          <PatternCard title="Self-Referential Foreign Keys">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tables that reference themselves to represent hierarchies.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Pattern:</strong> <code>Parent_TableName_ID</code></p>
          </PatternCard>
          <PatternCard title="Bridge/Junction Tables">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Many-to-many relationships use compound names.</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Example:</strong> <code>ProjectRole</code> (links Project + Personnel + Role)</p>
          </PatternCard>
          <PatternCard title="Status vs Type">
            <p style={{ color: '#546e7a', fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Status:</strong> Current state (often changes) - stored as ENUM</p>
            <p style={{ color: '#546e7a', fontSize: '0.9rem' }}><strong>Type:</strong> Category/classification (institution-specific) - use AllowedValues</p>
          </PatternCard>
        </div>
      </Section>
    </div>
  );
}
