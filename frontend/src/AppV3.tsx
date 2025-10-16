import React, { useState, useEffect } from 'react';
import './AppV3.css';

// Pages
import HomePage from './pages/v3/HomePage';
import UeberUns from './pages/v3/UeberUns';
import Kinderschwimmkurse from './pages/v3/Kinderschwimmkurse';
import Erwachsenenkurse from './pages/v3/Erwachsenenkurse';
import Standorte from './pages/v3/Standorte';
import Kalender from './pages/v3/Kalender';
import Preise from './pages/v3/Preise';
import FAQ from './pages/v3/FAQ';
import KursFinden from './pages/v3/KursFinden';
import AdminDashboard from './pages/v3/AdminDashboard';
import LoginPage from './pages/v3/LoginPage';
import ProfilPage from './pages/v3/ProfilPage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export default function AppV3() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Load user if token exists
  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken('');
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const handleLogin = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    setPage('home');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setPage('home');
  };

  const navigation = (
    <nav className="navbar-v3">
      <div className="navbar-container-v3">
        <div className="navbar-brand-v3">
          <h1 onClick={() => setPage('home')} style={{ cursor: 'pointer', margin: 0 }}>
            🌊 Next Wave
          </h1>
        </div>

        <div className="navbar-menu-v3">
          {/* Kinderschwimmkurse Dropdown */}
          <div className="dropdown-container">
            <button
              className="nav-btn-v3"
              onMouseEnter={() => setShowDropdown('kinder')}
              onMouseLeave={() => setShowDropdown(null)}
            >
              Kinderschwimmkurse ▼
            </button>
            {showDropdown === 'kinder' && (
              <div className="dropdown-menu">
                <div onClick={() => { setPage('kinderschwimmkurse'); setShowDropdown(null); }}>
                  Übersicht
                </div>
              </div>
            )}
          </div>

          {/* Erwachsenenkurse Dropdown */}
          <div className="dropdown-container">
            <button
              className="nav-btn-v3"
              onMouseEnter={() => setShowDropdown('erw')}
              onMouseLeave={() => setShowDropdown(null)}
            >
              Erwachsenenkurse ▼
            </button>
            {showDropdown === 'erw' && (
              <div className="dropdown-menu">
                <div onClick={() => { setPage('erwachsenenkurse'); setShowDropdown(null); }}>
                  Übersicht
                </div>
              </div>
            )}
          </div>

          <button className="nav-btn-v3" onClick={() => setPage('ueber-uns')}>
            Über Uns
          </button>

          <button className="nav-btn-v3" onClick={() => setPage('standorte')}>
            Standorte
          </button>

          <button className="nav-btn-v3" onClick={() => setPage('kalender')}>
            📅 Kalender
          </button>

          <button className="nav-btn-v3" onClick={() => setPage('preise')}>
            Preise
          </button>

          <button className="nav-btn-v3" onClick={() => setPage('faq')}>
            Häufige Fragen
          </button>

          {/* Primary CTA */}
          <button className="nav-btn-primary-v3" onClick={() => setPage('kurs-finden')}>
            🔍 KURS FINDEN
          </button>

          {/* User Menu */}
          {!user ? (
            <button className="nav-btn-login-v3" onClick={() => setPage('login')}>
              Anmelden
            </button>
          ) : (
            <>
              {user.role === 'admin' && (
                <button className="nav-btn-v3" onClick={() => setPage('admin')}>
                  Admin
                </button>
              )}
              <button className="nav-btn-v3" onClick={() => setPage('profil')}>
                👤 {user.name}
              </button>
              <button className="nav-btn-logout-v3" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  const footer = (
    <footer className="footer-v3">
      <div className="footer-content-v3">
        <div className="footer-section">
          <h3>Kontakt</h3>
          <p>📧 info@schwimmschule-nextwave.de</p>
          <p>📱 0172 9831064</p>
        </div>
        <div className="footer-section">
          <h3>Rechtliches</h3>
          <ul>
            <li><a href="#">Impressum</a></li>
            <li><a href="#">Datenschutzhinweise</a></li>
            <li><a href="#">AGB</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <p>&copy; 2025 Schwimmschule Next Wave. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="app-v3">
      {navigation}

      <main className="main-content-v3">
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'ueber-uns' && <UeberUns />}
        {page === 'kinderschwimmkurse' && <Kinderschwimmkurse onNavigate={setPage} />}
        {page === 'erwachsenenkurse' && <Erwachsenenkurse onNavigate={setPage} />}
        {page === 'standorte' && <Standorte />}
        {page === 'kalender' && <Kalender onNavigate={setPage} />}
        {page === 'preise' && <Preise />}
        {page === 'faq' && <FAQ />}
        {page === 'kurs-finden' && <KursFinden token={token} user={user} />}
        {page === 'login' && <LoginPage onNavigate={setPage} onLogin={handleLogin} />}
        {page === 'profil' && user && <ProfilPage user={user} token={token} onNavigate={setPage} />}
        {page === 'admin' && user?.role === 'admin' && <AdminDashboard token={token} onNavigate={setPage} />}
      </main>

      {footer}
    </div>
  );
}
