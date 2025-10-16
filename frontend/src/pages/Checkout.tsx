// @ts-nocheck
import React, { useState } from 'react';
import '../styles/Checkout.css';

export default function Checkout({ cart, onNavigate, token, user, onConfirm }) {
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
      setError('Fehler');
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
      <h1>💳 Kurs Buchen</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="checkout-container">
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

        {step === 1 && (
          <div className="step-content">
            <h2>📋 Buchungsübersicht</h2>
            <div className="review-card">
              <h3>{cart.courseName}</h3>
              <p><strong>📅 Zeitplan:</strong> {cart.schedule}</p>
              <p><strong>💰 Preis:</strong> €{cart.price}</p>
              {discount > 0 && (
                <>
                  <p><strong>✅ Rabatt:</strong> -€{discount.toFixed(2)}</p>
                  <p className="final-price"><strong>💶 Gesamt:</strong> €{finalPrice.toFixed(2)}</p>
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

        {step === 2 && (
          <div className="step-content">
            <h2>📝 Details & Rabatte</h2>
            <div className="form-group">
              <label>🎟️ Promo-Code (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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

        {step === 3 && (
          <div className="step-content">
            <h2>💳 Zahlungsmethode</h2>
            <div className="form-group">
              <label>Wählen Sie eine Zahlungsmethode:</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-control">
                <option value="sepa">SEPA-Lastschrift 🏦</option>
                <option value="bank-transfer">Banküberweisung 💰</option>
                <option value="credit-card">Kreditkarte 💳</option>
              </select>
            </div>

            <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #10b981' }}>
              <p><strong>💶 Gesamtbetrag:</strong> €{finalPrice.toFixed(2)}</p>
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
                {loading ? '⏳ Wird verarbeitet...' : '✅ Buchung Bestätigen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
