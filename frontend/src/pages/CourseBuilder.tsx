// @ts-nocheck
export default function CourseBuilder({ token, onNavigate }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>➕ Kurs Ersteller</h1>
      <p style={{ color: '#9ca3af', marginTop: '1rem' }}>
        🏗️ In Entwicklung - Verwenden Sie das AdminDashboard für Kursverwaltung
      </p>
      <button className="btn btn-secondary" onClick={() => onNavigate('admin-dashboard')} style={{ marginTop: '2rem' }}>
        ← Zur Admin-Seite
      </button>
    </div>
  );
}
