// @ts-nocheck
export default function ClassRoster({ token, onNavigate }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>✅ Anwesenheitsliste</h1>
      <p style={{ color: '#9ca3af' }}>🏗️ In Entwicklung - Verwenden Sie die AttendanceTracking-Komponente</p>
      <button className="btn btn-secondary" onClick={() => onNavigate('admin-dashboard')}>← Admin-Seite</button>
    </div>
  );
}
