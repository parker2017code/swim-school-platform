import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  operatingHours: string;
}

interface Course {
  id: string;
  typeName?: string;
  name?: string;
  description?: string;
  instructor?: string;
  price?: number;
  priceBrutto?: number;
  priceNet?: number;
  level: string;
  ageGroup: string;
  startTime: string;
  endTime: string;
  daysOfWeek?: string;
  days?: string;
  bookingCount?: number;
  enrolledCount?: number;
  maxStudents?: number;
  city?: string;
  locationId?: string;
  courseTypeId?: string;
}

interface Booking {
  id: string;
  courseId: string;
  courseName?: string;
  status: string;
  amount: number;
  createdAt?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

function App() {
  const [page, setPage] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState<User | null>(null);

  // Legal/Compliance
  const [showCookieBanner, setShowCookieBanner] = useState(!localStorage.getItem('cookiesAccepted'));
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);

  // Login/Register form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Data states
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('sepa');

  // Checkout form states
  const [promoCode, setPromoCode] = useState('');
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [lastBookingConfirm, setLastBookingConfirm] = useState<any>(null);

  // Payment detail states
  const [iban, setIban] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [creditCardNumber, setCreditCardNumber] = useState('');
  const [creditCardExpiry, setCreditCardExpiry] = useState('');
  const [creditCardCvc, setCreditCardCvc] = useState('');

  // Load user if token exists
  useEffect(() => {
    if (token) {
      loadUserData();
      localStorage.setItem('token', token);
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load user data');
    }
  };

  // Cookie acceptance
  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookieBanner(false);
  };

  // Validation functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pwd: string) => pwd.length >= 6;

  const validateForm = (type: 'login' | 'register') => {
    const errors: FormErrors = {};

    if (!validateEmail(email)) errors.email = 'Ungültige E-Mail-Adresse';
    if (!validatePassword(password)) errors.password = 'Passwort muss mindestens 6 Zeichen lang sein';

    if (type === 'register') {
      if (!name.trim()) errors.name = 'Name ist erforderlich';
      if (password !== confirmPassword) errors.confirmPassword = 'Passwörter stimmen nicht überein';
      if (!gdprAccepted) errors.gdpr = 'Sie müssen den Datenschutzbedingungen zustimmen';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Login handler
  const handleLogin = async () => {
    if (!validateForm('login')) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        setPage(data.user.role === 'admin' ? 'admin' : 'courses');
        setEmail('');
        setPassword('');
      } else {
        setMessage(data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (err) {
      setMessage('Anmeldung fehlgeschlagen: ' + err);
    }
    setLoading(false);
  };

  // Register handler
  const handleRegister = async () => {
    if (!validateForm('register')) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          emergencyContact,
          guardianConsent,
          gdprConsent: gdprAccepted,
        }),
      });
      const data = await response.json();

      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        setPage('courses');
        setEmail('');
        setPassword('');
        setName('');
        setConfirmPassword('');
        setEmergencyContact('');
      } else {
        setMessage(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (err) {
      setMessage('Registrierung fehlgeschlagen: ' + err);
    }
    setLoading(false);
  };

  // Load locations
  useEffect(() => {
    fetch(`${API_URL}/locations`)
      .then(r => r.json())
      .then(data => {
        setLocations(data);
        if (data.length > 0 && !selectedLocationId) {
          setSelectedLocationId(data[0].id);
        }
      })
      .catch(err => console.error('Error loading locations:', err));
  }, []);

  // Load courses based on selected location
  useEffect(() => {
    if (page === 'courses' || page === 'home') {
      const url = selectedLocationId
        ? `${API_URL}/courses?locationId=${selectedLocationId}`
        : `${API_URL}/courses`;
      fetch(url)
        .then(r => r.json())
        .then(setCourses)
        .catch(err => console.error(err));
    }
  }, [page, selectedLocationId]);

  // Load bookings
  useEffect(() => {
    if (page === 'bookings' && token) {
      fetch(`${API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          const enriched = data.map((booking: any) => {
            const course = courses.find(c => c.id === booking.courseId);
            return { ...booking, courseName: course?.name };
          });
          setBookings(enriched);
        })
        .catch(err => console.error(err));
    }
  }, [page, token, courses]);

  // Load admin data
  useEffect(() => {
    if (page === 'admin' && token && user?.role === 'admin') {
      Promise.all([
        fetch(`${API_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.json()),
        fetch(`${API_URL}/admin/payments`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.json())
      ]).then(([stats, paymentsData]) => {
        setAdminStats(stats);
        setPayments(paymentsData);
      }).catch(err => console.error('Error loading admin data:', err));
    }
  }, [page, token, user?.role]);

  // Book course
  const bookCourse = async (courseId: string) => {
    if (!token) {
      setPage('login');
      return;
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          paymentMethod: selectedPaymentMethod,
          promoCode: promoCode || undefined,
          autoRenewal: autoRenewal,
        }),
      });
      const data = await response.json();

      if (data.bookingId) {
        setLastBookingConfirm({
          bookingId: data.bookingId,
          invoiceNumber: data.invoiceNumber,
          amount: data.amount,
          course: selectedCourse,
          paymentMethod: selectedPaymentMethod,
          autoRenewal: data.autoRenewal,
        });
        setPage('receipt');
      } else if (data.position) {
        setMessage(`⏳ Auf Warteliste eingetragen - Position ${data.position}`);
        setTimeout(() => setPage('courses'), 2000);
      }
    } catch (err) {
      setMessage('Buchung fehlgeschlagen: ' + err);
    }
    setLoading(false);
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    if (!token) return;
    const confirmed = window.confirm('Sind Sie sicher, dass Sie diese Buchung stornieren möchten?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setBookings(bookings.filter(b => b.id !== bookingId));
      setMessage('✅ Buchung storniert. Stornierungsbestätigung wird per E-Mail gesendet.');
    } catch (err) {
      setMessage('Stornierung fehlgeschlagen: ' + err);
    }
    setLoading(false);
  };

  // Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setPage('home');
    localStorage.removeItem('token');
  };

  // ========== COOKIE BANNER ==========
  if (showCookieBanner) {
    return (
      <div style={styles.cookieBanner}>
        <div style={styles.cookieContent}>
          <h3>🍪 Cookie- & Datenschutz</h3>
          <p>
            Wir verwenden Cookies zur Verbesserung Ihrer Erfahrung. Mit der Nutzung unserer Website stimmen Sie unserer{' '}
            <a onClick={() => setPage('privacy')} style={styles.link}>Datenschutzerklärung</a> zu.
          </p>
          <div>
            <button onClick={acceptCookies} style={styles.acceptButton}>✅ Akzeptieren</button>
            <button onClick={() => setPage('privacy')} style={styles.declineButton}>📋 Mehr Info</button>
          </div>
        </div>
      </div>
    );
  }

  // ========== PRIVACY POLICY PAGE ==========
  if (page === 'privacy') {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Schwimmschule Next Wave</h2>
          <div>
            <button onClick={() => setPage('home')} style={styles.navButton}>Startseite</button>
          </div>
        </nav>
        <div style={styles.legalContent}>
          <h1>🔒 Datenschutzerklärung (Datenschutz)</h1>
          <section>
            <h2>1. Verantwortlicher</h2>
            <p>
              <strong>Schwimmschule Next Wave</strong><br/>
              Beispielstraße 123, 10115 Berlin, Deutschland<br/>
              E-Mail: info@nextwave-swim.de<br/>
              Telefon: +49 (0)30 12345678
            </p>
          </section>

          <section>
            <h2>2. Erfassung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir erfassen und verarbeiten folgende personenbezogene Daten:
            </p>
            <ul>
              <li><strong>Name, E-Mail, Telefon</strong> - zur Kontoerstellung</li>
              <li><strong>Zahlungsinformationen</strong> - SEPA-Lastschrift, Bankverbindung</li>
              <li><strong>Notfallkontakt</strong> - für Sicherheitszwecke</li>
              <li><strong>Erziehungsberechtigtenzustimmung</strong> - für minderjährige Teilnehmer</li>
              <li><strong>Kurs- und Buchungsdaten</strong> - zur Verwaltung von Anmeldungen</li>
            </ul>
          </section>

          <section>
            <h2>3. Rechtsgrundlage</h2>
            <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
          </section>

          <section>
            <h2>4. Speicherdauer</h2>
            <p>Ihre Daten werden für die Dauer des Vertragsverhältnisses und darüber hinaus gem. deutscher Steuergesetze (6 Jahre) gespeichert.</p>
          </section>

          <section>
            <h2>5. Ihre Rechte</h2>
            <p>
              Sie haben das Recht auf:
              <ul>
                <li>Auskunft über Ihre gespeicherten Daten</li>
                <li>Berichtigung fehlerhafter Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Einschränkung der Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
                <li>Widerspruch gegen die Verarbeitung</li>
              </ul>
            </p>
          </section>

          <section>
            <h2>6. Kontakt zum Datenschutz</h2>
            <p>
              Kontaktieren Sie uns unter: datenschutz@nextwave-swim.de
            </p>
          </section>

          <button onClick={() => setPage('home')} style={styles.backButton}>← Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  // ========== TERMS PAGE ==========
  if (page === 'terms') {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Schwimmschule Next Wave</h2>
          <div>
            <button onClick={() => setPage('home')} style={styles.navButton}>Startseite</button>
          </div>
        </nav>
        <div style={styles.legalContent}>
          <h1>📋 Allgemeine Geschäftsbedingungen (AGB)</h1>

          <section>
            <h2>1. Geltungsbereich</h2>
            <p>Diese AGB gelten für alle Verträge zwischen Schwimmschule Next Wave und Kunden.</p>
          </section>

          <section>
            <h2>2. Kursbuchung und Anmeldung</h2>
            <ul>
              <li>Kursanmeldungen sind verbindlich</li>
              <li>Die Anmeldung erfolgt online über unsere Webseite</li>
              <li>Bestätigung erfolgt per E-Mail mit Rechnung</li>
              <li>Minderjährige benötigen die Zustimmung der Erziehungsberechtigten</li>
            </ul>
          </section>

          <section>
            <h2>3. Stornierung und Rückgabe</h2>
            <ul>
              <li><strong>Kostenlose Stornierung:</strong> Bis 14 Tage vor Kursbeginn</li>
              <li><strong>50% Rückgabe:</strong> Bis 7 Tage vor Kursbeginn</li>
              <li><strong>Keine Rückgabe:</strong> Weniger als 7 Tage vor Kursbeginn</li>
              <li>Bei Krankheit: Ärztliches Attest erforderlich</li>
            </ul>
          </section>

          <section>
            <h2>4. Zahlungsbedingungen</h2>
            <p>
              Zahlungen erfolgen per:
              <ul>
                <li>✅ SEPA-Lastschrift</li>
                <li>✅ Banküberweisung</li>
                <li>✅ Kreditkarte (mit Gebühr)</li>
              </ul>
            </p>
            <p>Alle Preise enthalten 19% deutsche Mehrwertsteuer.</p>
          </section>

          <section>
            <h2>5. Haftung</h2>
            <p>
              Schwimmschule Next Wave haftet nicht für:
              <ul>
                <li>Unfälle während des Trainings (Teilnahme auf eigenes Risiko)</li>
                <li>Verlust oder Beschädigung persönlicher Gegenstände</li>
                <li>Ausfallzeiten durch höhere Gewalt</li>
              </ul>
            </p>
          </section>

          <button onClick={() => setPage('home')} style={styles.backButton}>← Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  // ========== IMPRESSUM PAGE ==========
  if (page === 'impressum') {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Schwimmschule Next Wave</h2>
          <div>
            <button onClick={() => setPage('home')} style={styles.navButton}>Startseite</button>
          </div>
        </nav>
        <div style={styles.legalContent}>
          <h1>ℹ️ Impressum (Herausgeberangaben)</h1>

          <section>
            <h2>Anbieter</h2>
            <p>
              <strong>Schwimmschule Next Wave</strong><br/>
              Geschäftsführer: Max Mustermann<br/>
              Beispielstraße 123<br/>
              10115 Berlin<br/>
              Deutschland
            </p>
          </section>

          <section>
            <h2>Kontakt</h2>
            <p>
              📧 E-Mail: info@nextwave-swim.de<br/>
              📞 Telefon: +49 (0)30 12345678<br/>
              🌐 Website: www.nextwave-swim.de
            </p>
          </section>

          <section>
            <h2>Handelsregister</h2>
            <p>
              Handelsregister Berlin-Charlottenburg<br/>
              Registernummer: HRB 123456
            </p>
          </section>

          <section>
            <h2>Steuernummer</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer: DE123456789
            </p>
          </section>

          <section>
            <h2>Verantwortlich für den Inhalt</h2>
            <p>
              Max Mustermann<br/>
              Beispielstraße 123<br/>
              10115 Berlin
            </p>
          </section>

          <section>
            <h2>Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website werden mit größter Sorgfalt erstellt und regelmäßig aktualisiert.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
              Gewähr übernehmen.
            </p>
          </section>

          <button onClick={() => setPage('home')} style={styles.backButton}>← Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  // ========== HOME PAGE ==========
  if (page === 'home') {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Schwimmschule Next Wave</h2>
          <div>
            {token ? (
              <>
                <button onClick={() => setPage('courses')} style={styles.navButton}>Kurse</button>
                <button onClick={() => setPage('bookings')} style={styles.navButton}>Meine Buchungen</button>
                <button onClick={handleLogout} style={styles.navButton}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => setPage('login')} style={styles.navButton}>Login</button>
                <button onClick={() => setPage('register')} style={styles.navButtonHighlight}>Registrieren</button>
              </>
            )}
          </div>
        </nav>

        <div style={styles.hero}>
          <h1>🏊 Willkommen zu Schwimmschule Next Wave</h1>
          <p>Professionelle Schwimmkurse für Kinder und Erwachsene in Berlin</p>
          {!token && <button onClick={() => setPage('register')} style={styles.heroButton}>Jetzt Registrieren</button>}
          {token && <button onClick={() => setPage('courses')} style={styles.heroButton}>Kurse Erkunden</button>}
        </div>

        <div style={styles.content}>
          <h2 style={{ textAlign: 'center' }}>Beliebte Kurse</h2>
          <div style={styles.coursesGrid}>
            {courses.slice(0, 3).map(course => (
              <div key={course.id} style={styles.courseCard}>
                <h3>{course.name}</h3>
                <p><strong>Altersgruppe:</strong> {course.ageGroup}</p>
                <p><strong>Level:</strong> {course.level}</p>
                <p><strong>Preis:</strong> €{course.price} (inkl. 19% MwSt.)</p>
                <p><strong>Verfügbar:</strong> {(course.maxStudents || 0) - (course.bookingCount || 0)} Plätze</p>
                {token ? (
                  <button onClick={() => { setSelectedCourse(course); setPage('checkout'); }} style={styles.bookButton}>
                    Jetzt Buchen
                  </button>
                ) : (
                  <button onClick={() => setPage('login')} style={styles.bookButton}>
                    Zum Buchen Anmelden
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>
          <p>
            <a onClick={() => setPage('privacy')} style={styles.footerLink}>Datenschutz</a> |{' '}
            <a onClick={() => setPage('terms')} style={styles.footerLink}>AGB</a> |{' '}
            <a onClick={() => setPage('impressum')} style={styles.footerLink}>Impressum</a>
          </p>
          <p>© 2024 Schwimmschule Next Wave. Alle Rechte vorbehalten. | DSGVO konform</p>
        </footer>
      </div>
    );
  }

  // ========== LOGIN PAGE ==========
  if (page === 'login') {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h1 style={styles.authTitle}>🌊 Anmelden</h1>

          {message && <div style={styles.errorBox} role="alert">{message}</div>}

          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="email-login">E-Mail</label>
              <input
                id="email-login"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="max@example.com"
                aria-label="E-Mail-Adresse"
              />
              {formErrors.email && <span style={styles.error} role="alert">{formErrors.email}</span>}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password-login">Passwort</label>
              <input
                id="password-login"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="password123"
                aria-label="Passwort"
              />
              {formErrors.password && <span style={styles.error} role="alert">{formErrors.password}</span>}
            </div>

            <button onClick={handleLogin} style={styles.submitButton} disabled={loading} aria-label="Anmelden">
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>

          <p style={styles.switchText}>
            Kein Konto? <a onClick={() => setPage('register')} style={styles.link} role="button" tabIndex={0}>Jetzt Registrieren</a>
          </p>

          <div style={styles.demoBox}>
            <p><strong>Demo-Zugangsdaten:</strong></p>
            <p>👤 Kunde: max@example.com / password123</p>
            <p>👨‍💼 Admin: admin@swim.de / admin123</p>
          </div>

          <button onClick={() => setPage('home')} style={styles.backButton}>← Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  // ========== REGISTER PAGE ==========
  if (page === 'register') {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h1 style={styles.authTitle}>🌊 Registrieren</h1>

          {message && <div style={styles.errorBox} role="alert">{message}</div>}

          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="name-reg">Name *</label>
              <input
                id="name-reg"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Max Mustermann"
                aria-label="Vollständiger Name"
              />
              {formErrors.name && <span style={styles.error} role="alert">{formErrors.name}</span>}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="email-reg">E-Mail *</label>
              <input
                id="email-reg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="max@example.com"
                aria-label="E-Mail-Adresse"
              />
              {formErrors.email && <span style={styles.error} role="alert">{formErrors.email}</span>}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="emergency-contact">Notfallkontakt (Telefon) *</label>
              <input
                id="emergency-contact"
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                style={styles.input}
                placeholder="+49 (0)30 12345678"
                aria-label="Notfall-Telefonnummer"
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password-reg">Passwort *</label>
              <input
                id="password-reg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Mindestens 6 Zeichen"
                aria-label="Passwort"
              />
              {formErrors.password && <span style={styles.error} role="alert">{formErrors.password}</span>}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="confirm-password">Passwort bestätigen *</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="Passwort wiederholen"
                aria-label="Passwortbestätigung"
              />
              {formErrors.confirmPassword && <span style={styles.error} role="alert">{formErrors.confirmPassword}</span>}
            </div>

            <div style={styles.checkboxGroup}>
              <input
                id="guardian-consent"
                type="checkbox"
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                aria-label="Ich bin Erziehungsberechtigter oder über 18 Jahren"
              />
              <label htmlFor="guardian-consent">
                Ich bestätige, dass ich der Erziehungsberechtigte bin oder über 18 Jahren alt bin
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <input
                id="gdpr-consent"
                type="checkbox"
                checked={gdprAccepted}
                onChange={(e) => setGdprAccepted(e.target.checked)}
                aria-label="Datenschutzbestimmungen akzeptiert"
              />
              <label htmlFor="gdpr-consent">
                Ich akzeptiere die{' '}
                <a onClick={() => setPage('privacy')} style={styles.link}>Datenschutzerklärung</a> und{' '}
                <a onClick={() => setPage('terms')} style={styles.link}>AGB</a> *
              </label>
            </div>
            {formErrors.gdpr && <span style={styles.error} role="alert">{formErrors.gdpr}</span>}

            <button onClick={handleRegister} style={styles.submitButton} disabled={loading} aria-label="Registrieren">
              {loading ? 'Wird registriert...' : 'Registrieren'}
            </button>
          </div>

          <p style={styles.switchText}>
            Bereits angemeldet? <a onClick={() => setPage('login')} style={styles.link} role="button" tabIndex={0}>Hier anmelden</a>
          </p>

          <button onClick={() => setPage('home')} style={styles.backButton}>← Zurück zur Startseite</button>
        </div>
      </div>
    );
  }

  // ========== COURSES PAGE ==========
  if (page === 'courses' && token) {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Next Wave</h2>
          <div>
            <button onClick={() => setPage('courses')} style={styles.navButton} aria-current="page">Kurse</button>
            <button onClick={() => setPage('bookings')} style={styles.navButton}>Meine Buchungen</button>
            <button onClick={handleLogout} style={styles.navButton}>Logout</button>
          </div>
        </nav>

        <div style={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>📚 Verfügbare Kurse</h2>
            <div style={{ minWidth: '250px' }}>
              <label style={{ marginRight: '10px', fontWeight: 'bold' }}>📍 Standort:</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                style={styles.select}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.city} - {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedLocationId && (
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              📧 Kontakt: {locations.find(l => l.id === selectedLocationId)?.phone} | 🕐 Öffnungszeiten: {locations.find(l => l.id === selectedLocationId)?.operatingHours}
            </p>
          )}
          <div style={styles.coursesGrid}>
            {courses.map(course => (
              <div key={course.id} style={styles.courseCard}>
                <h3>{course.typeName || course.name}</h3>
                <p><strong>👥 Altersgruppe:</strong> {course.ageGroup}</p>
                <p><strong>📊 Level:</strong> {course.level}</p>
                <p><strong>🕐 Zeit:</strong> {course.startTime} - {course.endTime}</p>
                <p><strong>📅 Tage:</strong> {course.daysOfWeek || course.days || 'Siehe Details'}</p>
                <p><strong>💰 Preis:</strong> €{(course.priceBrutto || course.price || 0).toFixed(2)} (inkl. 19% MwSt.)</p>
                <p style={styles.availabilityText}>
                  <strong>Plätze:</strong> {(course.maxStudents || 0) - (course.enrolledCount || course.bookingCount || 0)}/{course.maxStudents}
                </p>
                <button
                  onClick={() => { setSelectedCourse(course); setPage('checkout'); }}
                  style={styles.bookButton}
                  aria-label={`${course.name} buchen`}
                >
                  Jetzt Buchen
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========== CHECKOUT PAGE ==========
  if (page === 'checkout' && selectedCourse) {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Next Wave</h2>
          <div>
            <button onClick={() => setPage('courses')} style={styles.navButton}>Kurse</button>
            <button onClick={() => setPage('bookings')} style={styles.navButton}>Meine Buchungen</button>
            <button onClick={handleLogout} style={styles.navButton}>Logout</button>
          </div>
        </nav>

        <div style={styles.content}>
          <div style={styles.checkoutContainer}>
            <h2>💳 Buchung abschließen</h2>

            {message && <div style={styles.messageBox} role="alert">{message}</div>}

            <div style={styles.checkoutContent}>
              <div style={styles.courseDetails}>
                <h3>{selectedCourse.name}</h3>
                <p><strong>Altersgruppe:</strong> {selectedCourse.ageGroup}</p>
                <p><strong>Level:</strong> {selectedCourse.level}</p>
                <p><strong>Kursleiter:</strong> {selectedCourse.instructor}</p>
                <p><strong>Zeit:</strong> {selectedCourse.startTime} - {selectedCourse.endTime}</p>
                <p><strong>Verfügbare Plätze:</strong> {(selectedCourse.maxStudents || 0) - (selectedCourse.bookingCount || 0)}/{selectedCourse.maxStudents}</p>
              </div>

              <div style={styles.paymentForm}>
                <div style={styles.formGroup}>
                  <label>💰 Gesamtpreis</label>
                  <div style={styles.priceDisplay}>€{(selectedCourse.priceBrutto || selectedCourse.price || 0).toFixed(2)}</div>
                  <p style={{ fontSize: '12px', color: '#666' }}>inkl. 19% deutsche Mehrwertsteuer (MwSt.)</p>
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="promo-code">🎟️ Rabattcode (optional)</label>
                  <input
                    id="promo-code"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="z.B. FIRST10 oder SUMMER20"
                    style={styles.input}
                  />
                </div>

                <div style={styles.checkboxGroup}>
                  <input
                    id="auto-renewal"
                    type="checkbox"
                    checked={autoRenewal}
                    onChange={(e) => setAutoRenewal(e.target.checked)}
                  />
                  <label htmlFor="auto-renewal">
                    🔄 4-Wochen Automatische Verlängerung (2 Wochen Kündigungsfrist)
                  </label>
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="payment-method">💳 Zahlungsmethode</label>
                  <select
                    id="payment-method"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    style={styles.select}
                  >
                    <option value="sepa">SEPA-Lastschrift</option>
                    <option value="bank-transfer">Banküberweisung</option>
                    <option value="credit-card">Kreditkarte</option>
                  </select>
                </div>

                {selectedPaymentMethod === 'sepa' && (
                  <div style={styles.formGroup}>
                    <label htmlFor="iban">IBAN *</label>
                    <input
                      id="iban"
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      placeholder="DE89 3704 0044 0532 0130 00"
                      style={styles.input}
                    />
                    <small style={{ color: '#999' }}>Sichere SEPA-Lastschrift</small>
                  </div>
                )}

                {selectedPaymentMethod === 'bank-transfer' && (
                  <div style={styles.formGroup}>
                    <label htmlFor="bank-account">Kontoinhabername *</label>
                    <input
                      id="bank-account"
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Max Mustermann"
                      style={styles.input}
                    />
                    <small style={{ color: '#999' }}>Sie erhalten Kontodetails nach Buchung</small>
                  </div>
                )}

                {selectedPaymentMethod === 'credit-card' && (
                  <div>
                    <div style={styles.formGroup}>
                      <label htmlFor="cc-number">Kartennummer *</label>
                      <input
                        id="cc-number"
                        type="text"
                        value={creditCardNumber}
                        onChange={(e) => setCreditCardNumber(e.target.value.slice(0, 19))}
                        placeholder="4532 1111 2222 3333"
                        style={styles.input}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={styles.formGroup}>
                        <label htmlFor="cc-expiry">Ablaufdatum *</label>
                        <input
                          id="cc-expiry"
                          type="text"
                          value={creditCardExpiry}
                          onChange={(e) => setCreditCardExpiry(e.target.value.slice(0, 5))}
                          placeholder="MM/YY"
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label htmlFor="cc-cvc">CVC *</label>
                        <input
                          id="cc-cvc"
                          type="text"
                          value={creditCardCvc}
                          onChange={(e) => setCreditCardCvc(e.target.value.slice(0, 3))}
                          placeholder="123"
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => bookCourse(selectedCourse.id)}
                  style={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Wird verarbeitet...' : '✅ Jetzt Buchen'}
                </button>

                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setPromoCode('');
                    setAutoRenewal(false);
                    setIban('');
                    setBankAccount('');
                    setCreditCardNumber('');
                    setCreditCardExpiry('');
                    setCreditCardCvc('');
                    setPage('courses');
                  }}
                  style={styles.cancelButton}
                >
                  ← Abbrechen
                </button>
              </div>
            </div>

            <div style={styles.infoBox}>
              <p>
                ℹ️ Nach Buchung erhalten Sie eine <strong>Rechnung (Rechnung)</strong> mit allen Zahlungsdetails und Geschäftsbedingungen per E-Mail.
                Stornierungen bis 14 Tage vorher kostenlos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== RECEIPT PAGE ==========
  if (page === 'receipt' && lastBookingConfirm) {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Next Wave</h2>
          <div>
            <button onClick={() => setPage('courses')} style={styles.navButton}>Kurse</button>
            <button onClick={() => setPage('bookings')} style={styles.navButton}>Meine Buchungen</button>
            <button onClick={handleLogout} style={styles.navButton}>Logout</button>
          </div>
        </nav>

        <div style={styles.content}>
          <div style={styles.receiptContainer}>
            <div style={styles.receipt}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #667eea', paddingBottom: '20px', marginBottom: '20px' }}>
                <h2>✅ Buchung Bestätigt!</h2>
                <p style={{ color: '#666' }}>Ihre Buchung wurde erfolgreich verarbeitet</p>
              </div>

              <div style={styles.receiptSection}>
                <h3>📋 Buchungsdetails</h3>
                <div style={styles.receiptRow}>
                  <span>Buchungs-ID:</span>
                  <strong>{lastBookingConfirm.bookingId}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span>Rechnungsnummer:</span>
                  <strong>{lastBookingConfirm.invoiceNumber}</strong>
                </div>
              </div>

              <div style={styles.receiptSection}>
                <h3>🏊 Kursdetails</h3>
                <div style={styles.receiptRow}>
                  <span>Kurs:</span>
                  <strong>{lastBookingConfirm.course?.typeName || lastBookingConfirm.course?.name}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span>Altersgruppe:</span>
                  <span>{lastBookingConfirm.course?.ageGroup}</span>
                </div>
                <div style={styles.receiptRow}>
                  <span>Zeit:</span>
                  <span>{lastBookingConfirm.course?.startTime} - {lastBookingConfirm.course?.endTime}</span>
                </div>
                <div style={styles.receiptRow}>
                  <span>Tage:</span>
                  <span>{lastBookingConfirm.course?.daysOfWeek || 'Siehe Details'}</span>
                </div>
              </div>

              <div style={styles.receiptSection}>
                <h3>💳 Zahlungsinformationen</h3>
                <div style={styles.receiptRow}>
                  <span>Zahlungsmethode:</span>
                  <span>
                    {lastBookingConfirm.paymentMethod === 'sepa' ? '💳 SEPA-Lastschrift' :
                     lastBookingConfirm.paymentMethod === 'bank-transfer' ? '🏦 Banküberweisung' :
                     '💳 Kreditkarte'}
                  </span>
                </div>
                <div style={styles.receiptRow}>
                  <span>Betrag:</span>
                  <strong style={{ fontSize: '18px' }}>€{lastBookingConfirm.amount.toFixed(2)}</strong>
                </div>
                {lastBookingConfirm.autoRenewal && (
                  <div style={styles.receiptRow}>
                    <span>Verlängerung:</span>
                    <span>🔄 4-Wochen Auto-Verlängerung</span>
                  </div>
                )}
              </div>

              <div style={styles.infoBox}>
                <p>
                  📧 Eine Bestätigung mit vollständiger Rechnung wurde an Ihre E-Mail-Adresse gesendet.<br/>
                  💾 Bitte speichern Sie diese Buchung für Ihre Unterlagen.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
                <button
                  onClick={() => {
                    setLastBookingConfirm(null);
                    setPage('bookings');
                  }}
                  style={styles.submitButton}
                >
                  📋 Zu Buchungen
                </button>
                <button
                  onClick={() => {
                    setLastBookingConfirm(null);
                    setPage('courses');
                  }}
                  style={{ ...styles.cancelButton, background: '#f0f0f0' }}
                >
                  ← Weitere Kurse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== BOOKINGS PAGE ==========
  if (page === 'bookings' && token) {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Next Wave</h2>
          <div>
            <button onClick={() => setPage('courses')} style={styles.navButton}>Kurse</button>
            <button onClick={() => setPage('bookings')} style={styles.navButton} aria-current="page">Meine Buchungen</button>
            <button onClick={handleLogout} style={styles.navButton}>Logout</button>
          </div>
        </nav>

        <div style={styles.content}>
          <h2>📋 Meine Buchungen</h2>

          {message && <div style={styles.messageBox} role="alert">{message}</div>}

          {bookings.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Keine Buchungen vorhanden</p>
              <button onClick={() => setPage('courses')} style={styles.bookButton}>
                Kurse Erkunden
              </button>
            </div>
          ) : (
            <div style={styles.bookingsList}>
              {bookings.map(booking => (
                <div key={booking.id} style={styles.bookingItem}>
                  <div style={styles.bookingHeader}>
                    <h3>{booking.courseName || 'Kurs'}</h3>
                    <span style={styles.statusBadge(booking.status)}>
                      {booking.status === 'confirmed' ? '✅ Bestätigt' : booking.status === 'pending' ? '⏳ Ausstehend' : '❌ Storniert'}
                    </span>
                  </div>
                  <p><strong>Buchungs-ID:</strong> {booking.id}</p>
                  <p><strong>Betrag:</strong> €{booking.amount}</p>
                  <p><strong>Gebucht am:</strong> {booking.createdAt || 'N/A'}</p>

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      style={styles.cancelButtonSmall}
                      disabled={loading}
                      aria-label={`${booking.courseName} stornieren`}
                    >
                      🗑️ Stornieren
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== ADMIN DASHBOARD ==========
  if (page === 'admin' && token && user?.role === 'admin') {
    return (
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <h2 style={styles.navTitle}>🌊 Admin Panel</h2>
          <div>
            <button onClick={() => setPage('admin')} style={styles.navButton} aria-current="page">Dashboard</button>
            <button onClick={handleLogout} style={styles.navButton}>Logout</button>
          </div>
        </nav>

        <div style={styles.content}>
          <h2>📊 Admin Dashboard</h2>

          {adminStats && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3>📚 Kurse</h3>
                <p style={styles.statNumber}>{adminStats.totalCourses || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3>📋 Buchungen</h3>
                <p style={styles.statNumber}>{adminStats.totalBookings || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3>✅ Zahlungen</h3>
                <p style={styles.statNumber}>{adminStats.confirmedPayments || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3>💰 Gesamtumsatz</h3>
                <p style={styles.statNumber}>€{(adminStats.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <div style={styles.statCard}>
                <h3>⏳ Ausstehende Zahlungen</h3>
                <p style={styles.statNumber}>€{(adminStats.pendingPayments || 0).toFixed(2)}</p>
              </div>
              <div style={styles.statCard}>
                <h3>👥 Benutzer</h3>
                <p style={styles.statNumber}>{adminStats.totalUsers || 0}</p>
              </div>
            </div>
          )}

          <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>💳 Zahlungshistorie</h3>
          {payments.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableCell}>Benutzer</th>
                    <th style={styles.tableCell}>E-Mail</th>
                    <th style={styles.tableCell}>Kurs</th>
                    <th style={styles.tableCell}>Standort</th>
                    <th style={styles.tableCell}>Betrag (Netto)</th>
                    <th style={styles.tableCell}>MwSt (19%)</th>
                    <th style={styles.tableCell}>Gesamt</th>
                    <th style={styles.tableCell}>Status</th>
                    <th style={styles.tableCell}>Zahlungsart</th>
                    <th style={styles.tableCell}>Rechnung</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{payment.userName}</td>
                      <td style={styles.tableCell}>{payment.email}</td>
                      <td style={styles.tableCell}>{payment.courseName}</td>
                      <td style={styles.tableCell}>{payment.city}</td>
                      <td style={styles.tableCell}>€{(payment.amountNet || 0).toFixed(2)}</td>
                      <td style={styles.tableCell}>€{(payment.vatAmount || 0).toFixed(2)}</td>
                      <td style={styles.tableCell}><strong>€{(payment.amount || 0).toFixed(2)}</strong></td>
                      <td style={styles.tableCell}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: payment.status === 'paid' ? '#d4edda' : '#fff3cd',
                          color: payment.status === 'paid' ? '#155724' : '#856404'
                        }}>
                          {payment.status === 'paid' ? '✅ Bezahlt' : '⏳ Ausstehend'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>{payment.paymentMethod}</td>
                      <td style={styles.tableCell}><small>{payment.invoiceNumber}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999' }}>Keine Zahlungen vorhanden</p>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}

// ========== STYLES ==========
const styles = {
  cookieBanner: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0,0,0,0.95)',
    color: 'white',
    padding: '20px',
    zIndex: 1000,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
  },
  cookieContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  acceptButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  declineButton: {
    background: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  legalContent: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
    background: 'white',
  },
  app: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  navbar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 40px',
    display: 'flex' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    flexWrap: 'wrap' as const,
  },
  navTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  navButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    marginLeft: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'opacity 0.2s',
  },
  navButtonHighlight: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    marginLeft: '20px',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 40px',
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  heroButton: {
    marginTop: '20px',
    padding: '12px 30px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    flex: 1,
  },
  footer: {
    background: '#333',
    color: 'white',
    padding: '40px 20px',
    textAlign: 'center' as const,
    marginTop: 'auto',
    fontSize: '14px',
  },
  footerLink: {
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  authContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  authCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%',
  },
  authTitle: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '30px',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    background: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  cancelButtonSmall: {
    padding: '8px 16px',
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '10px',
  },
  backButton: {
    width: '100%',
    padding: '10px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  },
  errorBox: {
    background: '#ffe0e0',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  messageBox: {
    background: '#e0ffe0',
    color: '#060',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  infoBox: {
    background: '#e3f2fd',
    color: '#1565c0',
    border: '1px solid #90caf9',
    padding: '16px',
    borderRadius: '6px',
    marginTop: '20px',
    fontSize: '14px',
  },
  paymentInfo: {
    background: '#f0f9ff',
    border: '1px solid #b0e0e6',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '30px',
  },
  courseCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  bookButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px',
    transition: 'background 0.2s',
  },
  checkoutContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  checkoutContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginTop: '30px',
  },
  courseDetails: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  paymentForm: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  priceDisplay: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    padding: '16px',
    background: '#f5f7fa',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '30px',
  },
  bookingItem: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statusBadge: (status: string) => ({
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    background: status === 'confirmed' ? '#d4edda' : status === 'pending' ? '#fff3cd' : '#f8d7da',
    color: status === 'confirmed' ? '#155724' : status === 'pending' ? '#856404' : '#721c24',
  }),
  availabilityText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    background: 'white',
    borderRadius: '8px',
    marginTop: '30px',
  },
  demoBox: {
    background: '#f0f9ff',
    border: '1px solid #b0e0e6',
    padding: '16px',
    borderRadius: '6px',
    fontSize: '13px',
    marginTop: '20px',
  },
  switchText: {
    textAlign: 'center' as const,
    marginTop: '16px',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0 0 0',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'auto',
    marginTop: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  tableHeader: {
    background: '#f5f7fa',
    fontWeight: 'bold',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
    transition: 'background 0.2s',
  },
  tableCell: {
    padding: '12px 16px',
    textAlign: 'left' as const,
  },
  receiptContainer: {
    maxWidth: '600px',
    margin: '40px auto',
  },
  receipt: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '2px solid #667eea',
  },
  receiptSection: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  },
};

export default App;
