// @ts-nocheck
import React, { useState, useEffect } from 'react';
import './AppV2.css';

// Pages
import HomePage from './pages/HomePage';
import CourseBrowsing from './pages/CourseBrowsing';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import CourseBuilder from './pages/CourseBuilder';
import BookingManager from './pages/BookingManager';
import ClassRoster from './pages/ClassRoster';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import LegalPages from './pages/LegalPages';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'instructor';
}

interface Cart {
  courseId: string;
  courseName: string;
  scheduleId: string;
  price: number;
  schedule: string;
}

export default function AppV2() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');

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
    setPage(userData.role === 'admin' ? 'admin-dashboard' : 'home');
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setPage('home');
  };

  const handleAddToCart = (courseId: string, courseName: string, scheduleId: string, price: number, schedule: string) => {
    setCart({ courseId, courseName, scheduleId, price, schedule });
    setPage('checkout');
  };

  const handleConfirmBooking = () => {
    setCart(null);
    setPage('confirmation');
  };

  const navigation = (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1 onClick={() => setPage('home')} style={{ cursor: 'pointer', margin: 0 }}>
            🌊 Next Wave
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#667eea', margin: '0.25rem 0 0 0' }}>Schwimmschule im Ruhrgebiet</p>
        </div>
        <div className="navbar-menu">
          {!user ? (
            <>
              <button className="nav-btn" onClick={() => setPage('courses')}>
                Kurse
              </button>
              <button className="nav-btn" onClick={() => setPage('login')}>
                Anmelden
              </button>
              <button className="nav-btn nav-btn-highlight" onClick={() => setPage('login')}>
                Registrieren
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => setPage('courses')}>
                Kurse
              </button>
              {user.role === 'admin' && (
                <>
                  <button className="nav-btn" onClick={() => setPage('admin-dashboard')}>
                    Admin
                  </button>
                </>
              )}
              <button className="nav-btn" onClick={() => setPage('profile')}>
                👤 {user.name}
              </button>
              <button className="nav-btn nav-btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="app">
      {navigation}

      <main className="main-content">
        {page === 'home' && <HomePage onNavigate={setPage} user={user} />}
        {page === 'courses' && <CourseBrowsing onNavigate={setPage} selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} onAddToCart={handleAddToCart} />}
        {page === 'course-detail' && <CourseDetail onNavigate={setPage} onAddToCart={handleAddToCart} />}
        {page === 'checkout' && cart && <Checkout cart={cart} onNavigate={setPage} token={token} user={user} onConfirm={handleConfirmBooking} />}
        {page === 'confirmation' && <Confirmation onNavigate={setPage} />}
        {page === 'login' && <LoginPage onNavigate={setPage} onLogin={handleLogin} />}
        {page === 'profile' && user && <ProfilePage user={user} onNavigate={setPage} />}
        {page === 'admin-dashboard' && user?.role === 'admin' && <AdminDashboard token={token} onNavigate={setPage} />}
        {page === 'course-builder' && user?.role === 'admin' && <CourseBuilder token={token} onNavigate={setPage} />}
        {page === 'booking-manager' && user?.role === 'admin' && <BookingManager token={token} onNavigate={setPage} />}
        {page === 'class-roster' && user?.role === 'admin' && <ClassRoster token={token} onNavigate={setPage} />}
        {page === 'agb' && <LegalPages onNavigate={setPage} pageType="agb" />}
        {page === 'privacy' && <LegalPages onNavigate={setPage} pageType="privacy" />}
        {page === 'impressum' && <LegalPages onNavigate={setPage} pageType="impressum" />}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Schwimmschule Next Wave. Alle Rechte vorbehalten. | Ruhrgebiet</p>
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}>Datenschutz</a> |
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}> AGB</a> |
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}> Impressum</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
