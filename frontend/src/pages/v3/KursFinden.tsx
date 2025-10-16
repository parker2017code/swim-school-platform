import { useState, useEffect } from 'react';

interface Schedule {
  id: string;
  courseName: string;
  locationName: string;
  dayOfWeek: string;
  timeStart: string;
  timeEnd: string;
  monthlyPrice: number;
  capacity: number;
}

interface Props {
  token: string;
  user: any;
}

export default function KursFinden({ token, user }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<'list' | 'form' | 'payment'>('list');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [childName, setChildName] = useState('');
  const [childDOB, setChildDOB] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'paypal' | 'applepay'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardName, setCardName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Fehler beim Laden der Kurse');
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!token) {
      setError('Bitte melden Sie sich an, um einen Kurs zu buchen');
      return;
    }

    if (!childName || !childDOB) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    // Go to payment step
    setBookingStep('payment');
    setError('');
    setCardNumber('');
    setCardExpiry('');
    setCardCVC('');
    setCardName('');
  };

  const handlePayment = async () => {
    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
        setError('Bitte füllen Sie alle Zahlungsdetails aus');
        return;
      }
      if (cardNumber.length < 13) {
        setError('Bitte geben Sie eine gültige Kartennummer ein');
        return;
      }
    } else if (paymentMethod === 'bank') {
      if (!bankAccount || !bankCode || !bankName) {
        setError('Bitte füllen Sie alle Bankdetails aus');
        return;
      }
    } else if (paymentMethod === 'paypal') {
      // PayPal validation not needed for demo
    } else if (paymentMethod === 'applepay') {
      // Apple Pay validation not needed for demo
    }

    setProcessingPayment(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create subscription
      const response = await fetch('http://localhost:5000/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule?.id,
          childName,
          childDateOfBirth: childDOB
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ Zahlung erfolgreich verarbeitet!\n✅ Abonnement erstellt!\n\nKurs: ${selectedSchedule?.courseName}\nMonatlich: €${selectedSchedule?.monthlyPrice}`);
        setChildName('');
        setChildDOB('');
        setCardNumber('');
        setCardExpiry('');
        setCardCVC('');
        setCardName('');
        setBookingStep('list');
        setSelectedSchedule(null);
        setTimeout(() => {
          setSuccess('');
        }, 6000);
      } else {
        setError(data.error || 'Fehler beim Erstellen des Abonnements');
      }
    } catch (err) {
      setError('Fehler bei der Zahlungsverarbeitung');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>🔍 Kurs Finden & Buchen</h1>
        <p>Wählen Sie einen Kurs und abonnieren Sie monatlich</p>
      </div>

      {!token && (
        <div className="alert-info-v3">
          <strong>ℹ️ Hinweis:</strong> Sie müssen angemeldet sein, um einen Kurs zu buchen. Bitte melden Sie sich an oder registrieren Sie sich.
        </div>
      )}

      {error && <div className="alert-danger-v3">{error}</div>}
      {success && <div className="alert-success-v3">{success}</div>}

      {bookingStep === 'list' && (
        <div>
          <h2>Verfügbare Kurse</h2>
          {loading ? (
            <div className="spinner-v3"></div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
              <table className="table-v3">
                <thead>
                  <tr>
                    <th>Kurs</th>
                    <th>Standort</th>
                    <th>Tag</th>
                    <th>Zeit</th>
                    <th>Monatlich</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(schedule => (
                    <tr key={schedule.id}>
                      <td><strong>{schedule.courseName}</strong></td>
                      <td>{schedule.locationName}</td>
                      <td>{schedule.dayOfWeek}</td>
                      <td>{schedule.timeStart}-{schedule.timeEnd}</td>
                      <td><strong style={{ color: '#667eea' }}>€{schedule.monthlyPrice}</strong></td>
                      <td>
                        <button
                          className="btn-primary-v3"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setBookingStep('form');
                            setError('');
                          }}
                          disabled={!token}
                        >
                          Buchen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {bookingStep === 'form' && selectedSchedule && token && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', margin: '2rem auto' }}>
          <h2>Abonnement Details</h2>

          <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #667eea' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>{selectedSchedule.courseName}</h3>
            <p style={{ margin: '0.5rem 0' }}>📍 {selectedSchedule.locationName}</p>
            <p style={{ margin: '0.5rem 0' }}>📅 {selectedSchedule.dayOfWeek} {selectedSchedule.timeStart}-{selectedSchedule.timeEnd}</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
              €{selectedSchedule.monthlyPrice} / Monat
            </p>
          </div>

          <div className="form-group-v3">
            <label>Name des Kindes / Teilnehmers</label>
            <input
              type="text"
              className="form-control-v3"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="z.B. Max Mustermann"
            />
          </div>

          <div className="form-group-v3">
            <label>Geburtsdatum</label>
            <input
              type="date"
              className="form-control-v3"
              value={childDOB}
              onChange={(e) => setChildDOB(e.target.value)}
            />
          </div>

          <div className="alert-info-v3" style={{ marginBottom: '1.5rem' }}>
            <strong>💡 Abo-Info:</strong> Das Abonnement läuft im 4-Wochen Takt. Der Vertrag verlängert sich monatlich automatisch. Sie können jederzeit kündigen.
          </div>

          <button
            className="btn-primary-v3 btn-block-v3"
            onClick={handleBooking}
            style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}
          >
            🔒 Jetzt kostenpflichtig abonnieren - €{selectedSchedule.monthlyPrice} / Monat
          </button>

          <button
            className="btn-secondary-v3 btn-block-v3"
            onClick={() => setBookingStep('list')}
            style={{ padding: '0.75rem' }}
          >
            ← Zurück
          </button>
        </div>
      )}

      {bookingStep === 'payment' && selectedSchedule && token && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '550px', margin: '2rem auto' }}>
          <h2>💳 Zahlungsdetails</h2>

          <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #667eea' }}>
            <p style={{ margin: '0.5rem 0' }}><strong>{childName}</strong></p>
            <p style={{ margin: '0.5rem 0' }}>{selectedSchedule.courseName} - {selectedSchedule.dayOfWeek} {selectedSchedule.timeStart}</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
              €{selectedSchedule.monthlyPrice} / Monat
            </p>
          </div>

          {/* Payment Method Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>📌 Zahlungsmethode wählen:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: paymentMethod === 'card' ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: paymentMethod === 'card' ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: paymentMethod === 'card' ? 'bold' : 'normal',
                  color: paymentMethod === 'card' ? '#667eea' : '#666'
                }}
                disabled={processingPayment}
              >
                💳 Kreditkarte
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: paymentMethod === 'bank' ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: paymentMethod === 'bank' ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: paymentMethod === 'bank' ? 'bold' : 'normal',
                  color: paymentMethod === 'bank' ? '#667eea' : '#666'
                }}
                disabled={processingPayment}
              >
                🏦 Banküberweisung
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: paymentMethod === 'paypal' ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: paymentMethod === 'paypal' ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: paymentMethod === 'paypal' ? 'bold' : 'normal',
                  color: paymentMethod === 'paypal' ? '#667eea' : '#666'
                }}
                disabled={processingPayment}
              >
                🅿️ PayPal
              </button>
              <button
                onClick={() => setPaymentMethod('applepay')}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: paymentMethod === 'applepay' ? '2px solid #667eea' : '2px solid #e5e7eb',
                  background: paymentMethod === 'applepay' ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: paymentMethod === 'applepay' ? 'bold' : 'normal',
                  color: paymentMethod === 'applepay' ? '#667eea' : '#666'
                }}
                disabled={processingPayment}
              >
                🍎 Apple Pay
              </button>
            </div>
          </div>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <div>
              <div className="form-group-v3">
                <label>👤 Name auf Karte</label>
                <input
                  type="text"
                  className="form-control-v3"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Max Mustermann"
                  disabled={processingPayment}
                />
              </div>

              <div className="form-group-v3">
                <label>💳 Kartennummer</label>
                <input
                  type="text"
                  className="form-control-v3"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 19))}
                  placeholder="4242 4242 4242 4242"
                  disabled={processingPayment}
                  maxLength={19}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group-v3" style={{ margin: 0 }}>
                  <label>📅 Ablaufdatum</label>
                  <input
                    type="text"
                    className="form-control-v3"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                    placeholder="MM/YY"
                    disabled={processingPayment}
                    maxLength={5}
                  />
                </div>

                <div className="form-group-v3" style={{ margin: 0 }}>
                  <label>🔐 CVV</label>
                  <input
                    type="text"
                    className="form-control-v3"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    disabled={processingPayment}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Payment Form */}
          {paymentMethod === 'bank' && (
            <div>
              <div className="alert-info-v3" style={{ marginBottom: '1.5rem' }}>
                <strong>ℹ️ Banküberweisung:</strong> Die Zahlung wird verarbeitet, sobald Ihre Überweisung eingegangen ist.
              </div>

              <div className="form-group-v3">
                <label>🏦 Bankname</label>
                <input
                  type="text"
                  className="form-control-v3"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="z.B. Deutsche Bank"
                  disabled={processingPayment}
                />
              </div>

              <div className="form-group-v3">
                <label>🔢 Bankleitzahl (BLZ)</label>
                <input
                  type="text"
                  className="form-control-v3"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  disabled={processingPayment}
                  maxLength={8}
                />
              </div>

              <div className="form-group-v3">
                <label>💰 Kontonummer / IBAN</label>
                <input
                  type="text"
                  className="form-control-v3"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/\s/g, '').toUpperCase())}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  disabled={processingPayment}
                  maxLength={34}
                />
              </div>
            </div>
          )}

          {/* PayPal Payment Form */}
          {paymentMethod === 'paypal' && (
            <div className="alert-info-v3" style={{ marginBottom: '1.5rem' }}>
              <strong>🅿️ PayPal:</strong> Sie werden zu PayPal weitergeleitet, um Ihre Zahlung zu bestätigen.
            </div>
          )}

          {/* Apple Pay Form */}
          {paymentMethod === 'applepay' && (
            <div className="alert-info-v3" style={{ marginBottom: '1.5rem' }}>
              <strong>🍎 Apple Pay:</strong> Bestätigen Sie die Zahlung mit Ihrem Apple-Gerät.
            </div>
          )}

          <button
            className="btn-primary-v3 btn-block-v3"
            onClick={handlePayment}
            style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}
            disabled={processingPayment}
          >
            {processingPayment ? '⏳ Zahlung wird verarbeitet...' : `✅ Zahlung bestätigen - €${selectedSchedule.monthlyPrice}`}
          </button>

          <button
            className="btn-secondary-v3 btn-block-v3"
            onClick={() => setBookingStep('form')}
            style={{ padding: '0.75rem' }}
            disabled={processingPayment}
          >
            ← Zurück
          </button>
        </div>
      )}
    </div>
  );
}
