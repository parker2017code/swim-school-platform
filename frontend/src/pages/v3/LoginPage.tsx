import { useState } from 'react';

interface Props {
  onNavigate: (page: string) => void;
  onLogin: (token: string, user: any) => void;
}

export default function LoginPage({ onNavigate, onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, name, gdprConsent }
        : { email, password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Fehler bei der Authentifizierung');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>
          {isRegister ? '📝 Registrieren' : '🔐 Anmelden'}
        </h2>

        {error && <div className="alert-danger-v3">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group-v3">
              <label>Name</label>
              <input
                type="text"
                className="form-control-v3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                required
              />
            </div>
          )}

          <div className="form-group-v3">
            <label>E-Mail</label>
            <input
              type="email"
              className="form-control-v3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@example.com"
              required
            />
          </div>

          <div className="form-group-v3">
            <label>Passwort</label>
            <input
              type="password"
              className="form-control-v3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group-v3">
              <label>
                <input
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  required
                />
                {' '}Ich akzeptiere die Datenschutzerklärung
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary-v3 btn-block-v3"
            disabled={loading}
            style={{ padding: '0.75rem', marginTop: '1rem' }}
          >
            {loading ? '⏳ Wird verarbeitet...' : (isRegister ? '✅ Registrieren' : '✅ Anmelden')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
          {isRegister ? 'Bereits registriert? ' : 'Noch kein Konto? '}
          <a
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{ cursor: 'pointer', color: '#667eea', fontWeight: 'bold' }}
          >
            {isRegister ? 'Anmelden' : 'Registrieren'}
          </a>
        </div>

        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', fontSize: '0.875rem', borderLeft: '4px solid #3b82f6' }}>
          <p><strong>🔓 Demo Zugangsdaten:</strong></p>
          <p>📧 max@example.com / password123</p>
          <p>👨‍💼 admin@swim.de / admin123</p>
        </div>
      </div>
    </div>
  );
}
