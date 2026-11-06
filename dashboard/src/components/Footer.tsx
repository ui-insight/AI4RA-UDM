const REPO = 'https://github.com/ui-insight/AI4RA-UDM/blob/main';

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer style={{
      maxWidth: 1200, margin: '0 auto', padding: '0 2rem 2rem',
      color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6,
    }}>
      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
        <p style={{ marginBottom: '0.5rem' }}>
          Copyright 2025 Nathan Layman. The AI4RA Unified Data Model is a project of{' '}
          <Link href="https://ai4ra.uidaho.edu/">AI4RA</Link> (AI for Research Administration) at the
          University of Idaho.
        </p>
        <p style={{ marginBottom: '0.5rem' }}>
          The standard is licensed under <Link href={`${REPO}/LICENSE-CC-BY-4.0`}>CC BY 4.0</Link> and
          the code under <Link href={`${REPO}/LICENSE-APACHE-2.0`}>Apache-2.0</Link>. The{' '}
          <Link href={`${REPO}/NOTICE`}>NOTICE</Link> file lists which files fall under which license
          and the attribution each requires.
        </p>
        <p>
          This material is based upon work supported by the U.S. National Science Foundation under the
          GRANTED program,{' '}
          <Link href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2427549">award number 2427549</Link>,
          "Crossing the Innovation Valley of Death: Democratizing Data and Artificial Intelligence for
          Research Administration". Any opinions, findings, and conclusions or recommendations expressed
          in this material are those of the author and do not necessarily reflect the views of the
          National Science Foundation.
        </p>
      </div>
    </footer>
  );
}
