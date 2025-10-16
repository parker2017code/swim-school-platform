const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table with German compliance
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        phone TEXT,
        emergencyContact TEXT,
        guardianConsent BOOLEAN DEFAULT 0,
        gdprConsent BOOLEAN DEFAULT 0,
        iban TEXT,
        role TEXT DEFAULT 'customer',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        instructor TEXT,
        level TEXT,
        ageGroup TEXT,
        price REAL,
        maxStudents INTEGER,
        startTime TEXT,
        endTime TEXT,
        days TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table with German compliance
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        userId TEXT,
        courseId TEXT,
        status TEXT DEFAULT 'confirmed',
        paymentStatus TEXT DEFAULT 'pending',
        paymentMethod TEXT DEFAULT 'sepa',
        amount REAL,
        amountNet REAL,
        vatAmount REAL,
        invoiceNumber TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      )
    `);

    // Waitlist table
    db.run(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id TEXT PRIMARY KEY,
        userId TEXT,
        courseId TEXT,
        position INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, courseId),
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        bookingId TEXT UNIQUE,
        userId TEXT,
        amount REAL,
        status TEXT DEFAULT 'pending',
        stripeId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(bookingId) REFERENCES bookings(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

initializeDatabase();

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function sendEmail(to, subject, body) {
  console.log(`\n📧 EMAIL SENT:`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}\n`);
}

// German VAT (19%) utility
function calculateVAT(grossAmount) {
  const vatRate = 0.19;
  const netAmount = grossAmount / (1 + vatRate);
  const vatAmount = grossAmount - netAmount;
  return {
    gross: parseFloat(grossAmount.toFixed(2)),
    net: parseFloat(netAmount.toFixed(2)),
    vat: parseFloat(vatAmount.toFixed(2))
  };
}

// SEPA IBAN validation (German format)
function isValidIBAN(iban) {
  if (!iban) return true; // Optional
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  if (!ibanRegex.test(iban)) return false;
  if (!iban.startsWith('DE')) return false; // German IBAN
  return true;
}

// Generate invoice number (German format: Rechnung-YYYYMMDD-XXXXXX)
function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RECHNUNG-${date}-${random}`;
}

// Generate invoice HTML
function generateInvoice(booking, user, course) {
  const vat = calculateVAT(booking.amount);
  const invoiceDate = new Date(booking.createdAt).toLocaleDateString('de-DE');
  const dueDate = new Date(new Date(booking.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE');

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Rechnung ${booking.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; font-weight: bold; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌊 Schwimmschule Next Wave</h1>
        <p>Beispielstraße 123, 10115 Berlin, Deutschland</p>
        <p>Telefon: +49 (0)30 12345678 | E-Mail: info@nextwave-swim.de</p>
      </div>

      <h2>Rechnung</h2>

      <div class="details">
        <div>
          <div class="section-title">Rechnungsnummer</div>
          <p>${booking.invoiceNumber}</p>

          <div class="section-title">Rechnungsdatum</div>
          <p>${invoiceDate}</p>

          <div class="section-title">Fälligkeitsdatum</div>
          <p>${dueDate}</p>
        </div>

        <div>
          <div class="section-title">Rechnungsempfänger</div>
          <p>
            <strong>${user.name}</strong><br/>
            ${user.email}<br/>
            ${user.phone}
          </p>

          <div class="section-title">Zahlungsart</div>
          <p>${booking.paymentMethod === 'sepa' ? 'SEPA-Lastschrift' : booking.paymentMethod === 'bank-transfer' ? 'Banküberweisung' : 'Kreditkarte'}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Kursdetails</div>
        <p><strong>${course.name}</strong></p>
        <p>Altersgruppe: ${course.ageGroup}<br/>Level: ${course.level}<br/>Datum: ${invoiceDate}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Beschreibung</th>
            <th>Menge</th>
            <th>Nettopreis</th>
            <th>MwSt. (19%)</th>
            <th>Gesamtpreis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${course.name}</td>
            <td>1</td>
            <td>€${vat.net.toFixed(2)}</td>
            <td>€${vat.vat.toFixed(2)}</td>
            <td>€${vat.gross.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <table style="margin-top: 20px; width: 50%; margin-left: auto;">
        <tr>
          <th>Gesamtbetrag (netto)</th>
          <td>€${vat.net.toFixed(2)}</td>
        </tr>
        <tr>
          <th>MwSt. 19%</th>
          <td>€${vat.vat.toFixed(2)}</td>
        </tr>
        <tr class="total">
          <td>Gesamtbetrag (brutto)</td>
          <td>€${vat.gross.toFixed(2)}</td>
        </tr>
      </table>

      <div class="footer">
        <p><strong>Geschäftsbedingungen:</strong></p>
        <ul>
          <li>Diese Rechnung ist sofort fällig.</li>
          <li>Zahlungen können per SEPA-Lastschrift, Banküberweisung oder Kreditkarte erfolgen.</li>
          <li>Stornierungen bis 14 Tage vor Kursbeginn sind kostenfrei.</li>
          <li>Diese Rechnung wurde automatisch generiert und ist ohne Unterschrift gültig.</li>
        </ul>
        <p>Umsatzsteuer-ID: DE123456789 | Handelsregister: HRB 123456</p>
        <p>© 2024 Schwimmschule Next Wave. Alle Rechte vorbehalten.</p>
      </div>
    </body>
    </html>
  `;
}

// Middleware for authentication
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===================== AUTH ROUTES =====================

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone, emergencyContact, guardianConsent, gdprConsent } = req.body;

  // Validate GDPR consent
  if (!gdprConsent) {
    return res.status(400).json({ error: 'GDPR consent required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateId();

  db.run(
    `INSERT INTO users (id, email, password, name, phone, emergencyContact, guardianConsent, gdprConsent, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email, hashedPassword, name, phone || '', emergencyContact || '', guardianConsent ? 1 : 0, gdprConsent ? 1 : 0, 'customer'],
    function (err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });

      const token = jwt.sign({ userId, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

      // Send German welcome email with GDPR info
      const welcomeEmail = `
Hallo ${name},

willkommen bei Schwimmschule Next Wave! 🌊

Ihre Registrierungsdaten:
- E-Mail: ${email}
- Notfallkontakt: ${emergencyContact}
- GDPR-Zustimmung: ✓ Bestätigt

Ihre Daten werden gemäß DSGVO geschützt und nicht an Dritte weitergegeben.

Datenschutzerklärung: https://localhost:3000/datenschutz
Impressum: https://localhost:3000/impressum
AGB: https://localhost:3000/agb

Viele Grüße,
Schwimmschule Next Wave
      `;

      sendEmail(email, '🌊 Willkommen bei Schwimmschule Next Wave', welcomeEmail);

      res.json({ token, user: { id: userId, email, name, phone, role: 'customer' } });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, email, name, phone, role FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// ===================== COURSE ROUTES =====================

app.get('/api/courses', (req, res) => {
  db.all(`
    SELECT c.*,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as bookingCount,
      (SELECT COUNT(*) FROM waitlist WHERE courseId = c.id) as waitlistCount
    FROM courses c
    LEFT JOIN bookings b ON c.id = b.courseId
    GROUP BY c.id
  `, [], (err, courses) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(courses || []);
  });
});

app.get('/api/courses/:id', (req, res) => {
  db.get(`
    SELECT c.*,
      COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as bookingCount,
      (SELECT COUNT(*) FROM waitlist WHERE courseId = c.id) as waitlistCount
    FROM courses c
    LEFT JOIN bookings b ON c.id = b.courseId
    WHERE c.id = ?
    GROUP BY c.id
  `, [req.params.id], (err, course) => {
    if (err || !course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  });
});

// ===================== BOOKING ROUTES =====================

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { courseId, paymentMethod } = req.body;
  const bookingId = generateId();
  const invoiceNumber = generateInvoiceNumber();
  const method = paymentMethod || 'sepa';

  // Check if already booked
  db.get(
    `SELECT * FROM bookings WHERE userId = ? AND courseId = ? AND status = 'confirmed'`,
    [req.userId, courseId],
    (err, existingBooking) => {
      if (existingBooking) return res.status(400).json({ error: 'Already booked' });

      // Get course and user details
      db.get(
        `SELECT c.*, COUNT(b.id) as bookingCount FROM courses c
         LEFT JOIN bookings b ON c.id = b.courseId AND b.status = 'confirmed'
         WHERE c.id = ? GROUP BY c.id`,
        [courseId],
        (err, course) => {
          if (!course) return res.status(404).json({ error: 'Course not found' });

          db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Calculate VAT (German: 19%)
            const vat = calculateVAT(course.price);

            // Check if course is full
            if (course.bookingCount >= course.maxStudents) {
              // Add to waitlist
              const waitlistId = generateId();
              db.get(
                `SELECT COUNT(*) as count FROM waitlist WHERE courseId = ?`,
                [courseId],
                (err, result) => {
                  const position = (result?.count || 0) + 1;
                  db.run(
                    `INSERT INTO waitlist (id, userId, courseId, position) VALUES (?, ?, ?, ?)`,
                    [waitlistId, req.userId, courseId, position],
                    (err) => {
                      if (err) return res.status(500).json({ error: err.message });

                      const waitlistEmail = `
Hallo ${user.name},

Sie wurden auf die Warteliste für den Kurs "${course.name}" (Position ${position}) aufgenommen.

Kursinformationen:
- Kurs: ${course.name}
- Altersgruppe: ${course.ageGroup}
- Level: ${course.level}
- Zeit: ${course.startTime} - ${course.endTime}

Sie erhalten eine Benachrichtigung, sobald ein Platz verfügbar ist.

Viele Grüße,
Schwimmschule Next Wave
                      `;

                      sendEmail(user.email, '⏳ Auf Warteliste hinzugefügt', waitlistEmail);
                      res.json({ status: 'waitlisted', position, message: 'Added to waitlist' });
                    }
                  );
                }
              );
            } else {
              // Create booking with German compliance
              db.run(
                `INSERT INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, invoiceNumber, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [bookingId, req.userId, courseId, method, vat.gross, vat.net, vat.vat, invoiceNumber, 'confirmed'],
                (err) => {
                  if (err) return res.status(500).json({ error: err.message });

                  // Generate and send invoice
                  const invoiceHTML = generateInvoice({ ...course, bookingId, invoiceNumber, amount: vat.gross, paymentMethod: method, createdAt: new Date().toISOString() }, user, course);

                  const bookingEmail = `
Hallo ${user.name},

Ihre Buchung für den Kurs "${course.name}" ist bestätigt! ✅

Buchungsdetails:
- Rechnungsnummer: ${invoiceNumber}
- Kurs: ${course.name}
- Altersgruppe: ${course.ageGroup}
- Level: ${course.level}
- Zeit: ${course.startTime} - ${course.endTime}
- Preis (netto): €${vat.net.toFixed(2)}
- MwSt. (19%): €${vat.vat.toFixed(2)}
- Preis (brutto): €${vat.gross.toFixed(2)}
- Zahlungsmethode: ${method === 'sepa' ? 'SEPA-Lastschrift' : method === 'bank-transfer' ? 'Banküberweisung' : 'Kreditkarte'}

Stornierungsbedingungen:
- Bis 14 Tage vor Kursbeginn: kostenfrei
- Bis 7 Tage vor Kursbeginn: 50% Rückerstattung
- Weniger als 7 Tage: Keine Rückerstattung

Ihre Rechnung finden Sie angehängt.

Viele Grüße,
Schwimmschule Next Wave
                  `;

                  sendEmail(user.email, '✅ Buchung bestätigt - Rechnung ' + invoiceNumber, bookingEmail);
                  res.json({
                    status: 'booked',
                    bookingId,
                    invoiceNumber,
                    amount: vat.gross,
                    amountNet: vat.net,
                    vat: vat.vat,
                    paymentMethod: method
                  });
                }
              );
            }
          });
        }
      );
    }
  );
});

app.get('/api/bookings', authMiddleware, (req, res) => {
  db.all(
    `SELECT b.*, c.name, c.startTime, c.endTime FROM bookings b
     LEFT JOIN courses c ON b.courseId = c.id
     WHERE b.userId = ?`,
    [req.userId],
    (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings || []);
    }
  );
});

app.delete('/api/bookings/:id', authMiddleware, (req, res) => {
  // Cancel booking and promote from waitlist
  db.get(`SELECT courseId FROM bookings WHERE id = ? AND userId = ?`, [req.params.id, req.userId], (err, booking) => {
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    db.run(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Promote from waitlist
      db.get(
        `SELECT * FROM waitlist WHERE courseId = ? ORDER BY position LIMIT 1`,
        [booking.courseId],
        (err, waitlistEntry) => {
          if (waitlistEntry) {
            const newBookingId = generateId();
            db.get(`SELECT price FROM courses WHERE id = ?`, [booking.courseId], (err, course) => {
              db.run(
                `INSERT INTO bookings (id, userId, courseId, amount) VALUES (?, ?, ?, ?)`,
                [newBookingId, waitlistEntry.userId, booking.courseId, course.price],
                () => {
                  db.run(`DELETE FROM waitlist WHERE id = ?`, [waitlistEntry.id]);
                  sendEmail('promoted@example.com', 'Platz verfügbar!', 'Sie wurden vom Warteplatz befördert');
                }
              );
            });
          }
        }
      );

      res.json({ message: 'Booking cancelled' });
    });
  });
});

// ===================== WAITLIST ROUTES =====================

app.get('/api/waitlist', authMiddleware, (req, res) => {
  db.all(
    `SELECT w.*, c.name FROM waitlist w
     LEFT JOIN courses c ON w.courseId = c.id
     WHERE w.userId = ?`,
    [req.userId],
    (err, waitlist) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(waitlist || []);
    }
  );
});

app.delete('/api/waitlist/:id', authMiddleware, (req, res) => {
  db.run(`DELETE FROM waitlist WHERE id = ? AND userId = ?`, [req.params.id, req.userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Removed from waitlist' });
  });
});

// ===================== PAYMENT ROUTES =====================

app.post('/api/payments/create-intent', authMiddleware, (req, res) => {
  const { bookingId, amount } = req.body;
  const paymentId = generateId();

  db.run(
    `INSERT INTO payments (id, bookingId, userId, amount) VALUES (?, ?, ?, ?)`,
    [paymentId, bookingId, req.userId, amount],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      // Mock Stripe response
      res.json({ clientSecret: 'mock_secret_' + paymentId, paymentId });
    }
  );
});

app.post('/api/payments/confirm', authMiddleware, (req, res) => {
  const { paymentId } = req.body;

  db.run(`UPDATE payments SET status = 'paid' WHERE id = ?`, [paymentId], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(`SELECT bookingId FROM payments WHERE id = ?`, [paymentId], (err, payment) => {
      if (payment) {
        db.run(`UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?`, [payment.bookingId]);
        sendEmail('customer@example.com', 'Zahlung bestätigt', `Payment ID: ${paymentId}`);
      }
      res.json({ message: 'Payment confirmed' });
    });
  });
});

app.get('/api/payments/history', authMiddleware, (req, res) => {
  db.all(
    `SELECT p.*, b.courseId FROM payments p
     LEFT JOIN bookings b ON p.bookingId = b.id
     WHERE p.userId = ?`,
    [req.userId],
    (err, payments) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(payments || []);
    }
  );
});

// ===================== ADMIN ROUTES =====================

app.get('/api/admin/dashboard', authMiddleware, (req, res) => {
  const stats = {};

  db.get(`SELECT COUNT(*) as count FROM courses`, [], (err, result) => {
    stats.totalCourses = result?.count || 0;

    db.get(`SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'`, [], (err, result) => {
      stats.totalBookings = result?.count || 0;

      db.get(`SELECT COUNT(*) as count FROM waitlist`, [], (err, result) => {
        stats.waitlistEntries = result?.count || 0;

        db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'`, [], (err, result) => {
          stats.revenue = result?.total || 0;

          db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'pending'`, [], (err, result) => {
            stats.pendingPayments = result?.total || 0;

            db.get(`SELECT COUNT(*) as count FROM users`, [], (err, result) => {
              stats.totalUsers = result?.count || 0;
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

app.get('/api/admin/users', (req, res) => {
  db.all(`SELECT id, email, name, phone, role, createdAt FROM users`, [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users || []);
  });
});

app.get('/api/admin/bookings', (req, res) => {
  db.all(
    `SELECT b.*, u.name, u.email, c.name as courseName FROM bookings b
     LEFT JOIN users u ON b.userId = u.id
     LEFT JOIN courses c ON b.courseId = c.id`,
    [],
    (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings || []);
    }
  );
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏊 Swim School API running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api`);
});
