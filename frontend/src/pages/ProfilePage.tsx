// @ts-nocheck
export default function ProfilePage({ user, onNavigate }) {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h1>👤 Mein Profil</h1>
      <div style={{ marginTop: '2rem' }}>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>E-Mail:</strong> {user.email}</p>
        <p><strong>Rolle:</strong> {user.role === 'admin' ? '👨‍💼 Administrator' : '👤 Kunde'}</p>
      </div>
      <button className="btn btn-secondary" onClick={() => onNavigate('home')} style={{ marginTop: '2rem' }}>
        ← Zurück zur Startseite
      </button>
    </div>
  );
}
