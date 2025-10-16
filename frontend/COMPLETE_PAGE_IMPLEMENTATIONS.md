# Complete Swim School Platform - Page Implementation Guide

## Overview
All page components follow this structure pattern. Use these templates to complete each page.

## Key Pages Status

### ✅ COMPLETED
- HomePage.tsx + HomePage.css - Beautiful hero, features, stats, FAQ
- AppV2.tsx - Main routing and layout
- AppV2.css - Global styles and utilities

### 🏗️ TO BUILD (Use patterns below)

---

## 1. CourseBrowsing.tsx - Course List with Filters

```typescript
// src/pages/CourseBrowsing.tsx
import React, { useState, useEffect } from 'react';
import '../styles/CourseBrowsing.css';

interface Course {
  id: string;
  typeName: string;
  ageGroup: string;
  level: string;
  priceBrutto: number;
  maxStudents: number;
  enrolledCount: number;
  city: string;
}

interface CourseBrowsingProps {
  onNavigate: (page: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  onAddToCart: (courseId: string, courseName: string, scheduleId: string, price: number, schedule: string) => void;
}

export default function CourseBrowsing({ onNavigate, selectedLocation, onLocationChange, onAddToCart }: CourseBrowsingProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [ageFilter, setAgeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedLocation, ageFilter, levelFilter]);

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/locations');
      const data = await response.json();
      setLocations(data);
      if (data.length > 0 && !selectedLocation) {
        onLocationChange(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/courses';
      const params = new URLSearchParams();
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      let data = await response.json();

      // Filter on frontend
      if (ageFilter) {
        data = data.filter((c: Course) => c.ageGroup === ageFilter);
      }
      if (levelFilter) {
        data = data.filter((c: Course) => c.level === levelFilter);
      }

      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
    setLoading(false);
  };

  return (
    <div className="course-browsing">
      <h1>Verfügbare Kurse</h1>

      <div className="filters">
        <select value={selectedLocation} onChange={(e) => onLocationChange(e.target.value)} className="form-control">
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.city} - {loc.name}</option>
          ))}
        </select>

        <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="form-control">
          <option value="">Alle Altersgruppen</option>
          <option value="3-4 Jahre">3-4 Jahre</option>
          <option value="4-5 Jahre">4-5 Jahre</option>
          <option value="6-8 Jahre">6-8 Jahre</option>
          <option value="Erwachsene">Erwachsene</option>
        </select>

        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="form-control">
          <option value="">Alle Level</option>
          <option value="Anfänger">Anfänger</option>
          <option value="Fortgeschritten">Fortgeschritten</option>
          <option value="Alle">Alle</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : courses.length === 0 ? (
        <p className="text-center">Keine Kurse gefunden</p>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.typeName}</h3>
              <p><strong>Altersgruppe:</strong> {course.ageGroup}</p>
              <p><strong>Level:</strong> {course.level}</p>
              <p><strong>Preis:</strong> €{course.priceBrutto}</p>
              <p><strong>Verfügbar:</strong> {course.maxStudents - course.enrolledCount}/{course.maxStudents}</p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => onAddToCart(course.id, course.typeName, course.id, course.priceBrutto, 'Schedule TBD')}
              >
                Buchen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 2. LoginPage.tsx - Authentication

```typescript
// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import '../styles/Auth.css';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (token: string, user: any) => void;
}

export default function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        <h1>{isRegister ? 'Registrieren' : 'Anmelden'}</h1>

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
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Wird verarbeitet...' : (isRegister ? 'Registrieren' : 'Anmelden')}
          </button>
        </form>

        <p className="text-center" style={{ marginTop: '1rem' }}>
          {isRegister ? 'Bereits registriert?' : 'Noch kein Konto?'}
          <a onClick={() => setIsRegister(!isRegister)} style={{ cursor: 'pointer', marginLeft: '0.5rem', color: '#667eea' }}>
            {isRegister ? 'Anmelden' : 'Registrieren'}
          </a>
        </p>

        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.875rem' }}>
          <p><strong>Demo Credentials:</strong></p>
          <p>👤 max@example.com / password123</p>
          <p>👨‍💼 admin@swim.de / admin123</p>
        </div>
      </div>
    </div>
  );
}
```

## 3. Checkout.tsx - Multi-Step Booking

```typescript
// src/pages/Checkout.tsx
import React, { useState } from 'react';
import '../styles/Checkout.css';

interface Cart {
  courseId: string;
  courseName: string;
  scheduleId: string;
  price: number;
  schedule: string;
}

interface CheckoutProps {
  cart: Cart;
  onNavigate: (page: string) => void;
  token: string;
  user: any;
  onConfirm: () => void;
}

export default function Checkout({ cart, onNavigate, token, user, onConfirm }: CheckoutProps) {
  const [step, setStep] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('sepa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleApplyPromo = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.toUpperCase(), userId: user.id }),
      });
      const data = await response.json();

      if (response.ok) {
        const discountAmount = (cart.price * data.promo.discountPercent) / 100;
        setDiscount(discountAmount);
      } else {
        setError(data.error || 'Ungültiger Promo-Code');
      }
    } catch (err) {
      setError('Fehler beim Validieren des Codes');
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: cart.courseId,
          paymentMethod,
          promoCode: promoCode || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onConfirm();
      } else {
        setError(data.error || 'Buchung fehlgeschlagen');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  };

  const finalPrice = Math.max(0, cart.price - discount);

  return (
    <div className="checkout-page">
      <h1>Kurs Buchen</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="checkout-container">
        {/* Step Indicator */}
        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Überprüfung</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Details</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Zahlung</div>
          </div>
        </div>

        {/* Step 1: Review */}
        {step === 1 && (
          <div className="step-content">
            <h2>Buchungsübersicht</h2>
            <div className="review-card">
              <h3>{cart.courseName}</h3>
              <p><strong>Zeitplan:</strong> {cart.schedule}</p>
              <p><strong>Preis:</strong> €{cart.price}</p>
              {discount > 0 && (
                <>
                  <p><strong>Rabatt:</strong> -€{discount.toFixed(2)}</p>
                  <p className="final-price"><strong>Gesamt:</strong> €{finalPrice.toFixed(2)}</p>
                </>
              )}
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(2)}>
              Weiter →
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => onNavigate('courses')}>
              Abbrechen
            </button>
          </div>
        )}

        {/* Step 2: Student Details */}
        {step === 2 && (
          <div className="step-content">
            <h2>Studiendetails</h2>
            <div className="form-group">
              <label>Promo-Code (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="z.B. FIRST10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleApplyPromo}>
                  Anwenden
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => setStep(1)}>
                ← Zurück
              </button>
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(3)}>
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="step-content">
            <h2>Zahlungsmethode</h2>
            <div className="form-group">
              <label>Wählen Sie eine Zahlungsmethode:</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-control">
                <option value="sepa">SEPA-Lastschrift</option>
                <option value="bank-transfer">Banküberweisung</option>
                <option value="credit-card">Kreditkarte</option>
              </select>
            </div>

            <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <p><strong>Gesamtbetrag:</strong> €{finalPrice.toFixed(2)}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary btn-block" onClick={() => setStep(2)}>
                ← Zurück
              </button>
              <button
                className="btn btn-success btn-block btn-lg"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? 'Wird verarbeitet...' : '✅ Buchung Bestätigen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 4. Other Key Pages (Stub Templates)

### ProfilePage.tsx
```typescript
export default function ProfilePage({ user, onNavigate }: any) {
  return (
    <div>
      <h1>Mein Profil</h1>
      <p>Name: {user.name}</p>
      <p>E-Mail: {user.email}</p>
      <button onClick={() => onNavigate('home')}>← Zurück</button>
    </div>
  );
}
```

### Confirmation.tsx
```typescript
export default function Confirmation({ onNavigate }: any) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <h1>✅ Buchung Bestätigt!</h1>
      <p>Sie erhalten in Kürze eine Bestätigungsmail.</p>
      <button className="btn btn-primary" onClick={() => onNavigate('home')}>
        Zur Startseite
      </button>
    </div>
  );
}
```

### CourseDetail.tsx, CourseBuilder.tsx, BookingManager.tsx, ClassRoster.tsx
Use the AdminDashboard.tsx component from the components folder as a starting point for these admin pages.

---

## CSS Files Needed

### src/styles/CourseBrowsing.css
```css
.course-browsing { padding: 2rem; }
.filters { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
.filters select { flex: 1; min-width: 200px; }
.courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
.course-card { padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
```

### src/styles/Auth.css
```css
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: 1rem; }
.auth-card { width: 100%; max-width: 400px; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
```

### src/styles/Checkout.css
```css
.checkout-page { max-width: 600px; margin: 0 auto; padding: 2rem; }
.steps { display: flex; justify-content: space-around; margin-bottom: 3rem; }
.step { text-align: center; }
.step-number { width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; }
.step.active .step-number { background: #667eea; color: white; }
.step-content { padding: 2rem; background: white; border-radius: 12px; }
.review-card { padding: 1.5rem; background: #f5f7fa; border-radius: 8px; margin-bottom: 1.5rem; }
```

---

## Implementation Checklist

- [x] HomePage.tsx + CSS
- [x] AppV2.tsx + AppV2.css
- [ ] CourseBrowsing.tsx + CSS
- [ ] LoginPage.tsx + CSS
- [ ] Checkout.tsx + CSS
- [ ] Confirmation.tsx
- [ ] ProfilePage.tsx
- [ ] CourseDetail.tsx
- [ ] CourseBuilder.tsx
- [ ] BookingManager.tsx
- [ ] ClassRoster.tsx
- [ ] Complete responsive design
- [ ] Stripe Elements integration

---

## Integration Steps

1. Copy all page components to `src/pages/`
2. Copy all CSS files to `src/styles/`
3. Update `src/index.tsx` to use `AppV2` instead of `App`
4. Test each page route
5. Verify API calls work
6. Add Stripe integration

