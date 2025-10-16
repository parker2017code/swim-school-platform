import { useState, useEffect } from 'react';

interface Props {
  token: string;
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ token, onNavigate }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch all subscriptions
      const subsResponse = await fetch('http://localhost:5000/api/admin/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subsData = await subsResponse.json();
      setSubscriptions(subsData);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Möchten Sie dieses Abonnement wirklich kündigen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
        alert('Abonnement gekündigt');
      }
    } catch (err) {
      alert('Fehler beim Kündigen');
    }
  };

  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Verwalten Sie Abonnements und Einnahmen</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>
        <button
          onClick={() => setTab('dashboard')}
          style={{ padding: '0.75rem 1.5rem', background: tab === 'dashboard' ? '#667eea' : 'transparent', color: tab === 'dashboard' ? 'white' : '#667eea', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setTab('subscriptions')}
          style={{ padding: '0.75rem 1.5rem', background: tab === 'subscriptions' ? '#667eea' : 'transparent', color: tab === 'subscriptions' ? 'white' : '#667eea', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
        >
          📋 Abonnements
        </button>
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <>
          {loading ? (
            <div className="spinner-v3"></div>
          ) : stats ? (
            <div className="card-grid-v3">
              <div className="card-v3">
                <h3 style={{ color: '#667eea', fontSize: '1.25rem' }}>Aktive Abonnements</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '1rem 0' }}>
                  {stats.activeSubscriptions}
                </p>
              </div>
              <div className="card-v3">
                <h3 style={{ color: '#667eea', fontSize: '1.25rem' }}>Gesamt Abonnements</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '1rem 0' }}>
                  {stats.totalSubscriptions}
                </p>
              </div>
              <div className="card-v3">
                <h3 style={{ color: '#667eea', fontSize: '1.25rem' }}>💶 Monatliche Einnahmen (MRR)</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4caf50', margin: '1rem 0' }}>
                  €{stats.monthlyRecurringRevenue.toFixed(2)}
                </p>
              </div>
              <div className="card-v3">
                <h3 style={{ color: '#667eea', fontSize: '1.25rem' }}>Gesamte Benutzer</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '1rem 0' }}>
                  {stats.totalUsers}
                </p>
              </div>
              <div className="card-v3">
                <h3 style={{ color: '#667eea', fontSize: '1.25rem' }}>Verfügbare Kurse</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '1rem 0' }}>
                  {stats.totalCourses}
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Subscriptions Tab */}
      {tab === 'subscriptions' && (
        <>
          <h2>Alle Abonnements</h2>
          {loading ? (
            <div className="spinner-v3"></div>
          ) : subscriptions.length === 0 ? (
            <p>Keine Abonnements vorhanden</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Benutzer</th>
                    <th>E-Mail</th>
                    <th>Kurs</th>
                    <th>Standort</th>
                    <th>Teilnehmer</th>
                    <th>Monatlich</th>
                    <th>Status</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id}>
                      <td><strong>{sub.userName}</strong></td>
                      <td>{sub.email}</td>
                      <td>{sub.courseName}</td>
                      <td>{sub.locationName}</td>
                      <td>{sub.childName}</td>
                      <td>€{sub.monthlyPrice}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          background: sub.status === 'active' ? '#d1fae5' : '#fee2e2',
                          color: sub.status === 'active' ? '#065f46' : '#991b1b',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {sub.status === 'active' ? '✅ Aktiv' : '❌ ' + sub.status}
                        </span>
                      </td>
                      <td>
                        {sub.status === 'active' && (
                          <button
                            className="btn-danger-v3"
                            onClick={() => handleCancelSubscription(sub.id)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Kündigen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <button
        className="btn-secondary-v3"
        onClick={() => onNavigate('home')}
        style={{ marginTop: '2rem' }}
      >
        ← Zur Startseite
      </button>
    </div>
  );
}
