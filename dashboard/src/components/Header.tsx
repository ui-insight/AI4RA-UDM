export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        UDM Dashboard
      </h1>
      <p style={{ opacity: 0.9, fontSize: '1rem' }}>
        Universal Data Model for Research Administration
      </p>
    </header>
  );
}
