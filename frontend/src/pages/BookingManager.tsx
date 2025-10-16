// @ts-nocheck
export default function BookingManager({ token, onNavigate }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>📋 Buchungsverwaltung</h1>
      <p style={{ color: '#9ca3af' }}>🏗️ In Entwicklung</p>
      <button className="btn btn-secondary" onClick={() => onNavigate('admin-dashboard')}>← Admin-Seite</button>
    </div>
  );
}
