// @ts-nocheck
import React, { useState } from 'react';
import '../styles/Auth.css';

export default function LoginPage({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister
            ? { email, password, name, gdprConsent: true }
            : { email, password }
        ),
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
    <div className="auth-page">
      <div className="auth-card">
        <h1>{isRegister ? '👤 Registrieren' : '👤 Anmelden'}</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Passwort</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '⏳ Wird verarbeitet...' : (isRegister ? '✅ Registrieren' : '✅ Anmelden')}
          </button>
        </form>

        <p className="text-center" style={{ marginTop: '1rem', color: '#6b7280' }}>
          {isRegister ? 'Bereits registriert? ' : 'Noch kein Konto? '}
          <a onClick={() => setIsRegister(!isRegister)} style={{ cursor: 'pointer', color: '#667eea', fontWeight: 'bold' }}>
            {isRegister ? 'Anmelden' : 'Registrieren'}
          </a>
        </p>

        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.875rem', borderLeft: '4px solid #3b82f6' }}>
          <p><strong>🔓 Demo Zugangsdaten:</strong></p>
          <p>👤 max@example.com / password123</p>
          <p>👨‍💼 admin@swim.de / admin123</p>
        </div>
      </div>
    </div>
  );
}
