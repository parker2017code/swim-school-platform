// @ts-nocheck
export default function Confirmation({ onNavigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', marginTop: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅ Buchung Bestätigt!</h1>
      <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
        Sie erhalten in Kürze eine Bestätigungsmail mit allen Details.
      </p>
      <button className="btn btn-primary btn-lg" onClick={() => onNavigate('home')}>
        🏠 Zur Startseite
      </button>
    </div>
  );
}
