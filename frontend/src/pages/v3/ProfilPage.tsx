import { useState, useEffect } from 'react';

interface Props {
  user: any;
  token: string;
  onNavigate: (page: string) => void;
}

export default function ProfilPage({ user, token, onNavigate }: Props) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Möchten Sie dieses Abonnement wirklich kündigen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSubscriptions();
        alert('Abonnement erfolgreich gekündigt');
      }
    } catch (err) {
      alert('Fehler beim Kündigen des Abonnements');
    }
  };

  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>👤 Mein Profil</h1>
        <p>Verwalten Sie Ihre Abonnements</p>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h2>Profilinformationen</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>E-Mail:</strong> {user.email}</p>
        <p><strong>Rolle:</strong> {user.role === 'admin' ? '👨‍💼 Admin' : '👤 Kunde'}</p>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
        <h2>Meine Abonnements</h2>

        {loading ? (
          <div className="spinner-v3"></div>
        ) : subscriptions.length === 0 ? (
          <div className="alert-info-v3">
            Sie haben keine aktiven Abonnements. <a onClick={() => onNavigate('kurs-finden')} style={{ cursor: 'pointer', color: '#667eea', fontWeight: 'bold' }}>Jetzt einen Kurs buchen</a>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-v3">
              <thead>
                <tr>
                  <th>Kurs</th>
                  <th>Standort</th>
                  <th>Tag/Zeit</th>
                  <th>Teilnehmer</th>
                  <th>Monatlich</th>
                  <th>Status</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id}>
                    <td><strong>{sub.courseName}</strong></td>
                    <td>{sub.locationName}</td>
                    <td>{sub.dayOfWeek} {sub.timeStart}</td>
                    <td>{sub.childName}</td>
                    <td>€{sub.monthlyPrice}</td>
                    <td><span className="badge-success-v3" style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: '#d1fae5', color: '#065f46' }}>Aktiv</span></td>
                    <td>
                      <button
                        className="btn-danger-v3"
                        onClick={() => handleCancelSubscription(sub.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Kündigen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
