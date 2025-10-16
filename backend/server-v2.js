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

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// ===================== DATABASE INITIALIZATION =====================

function initializeDatabase() {
  db.serialize(() => {
    // LOCATIONS TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT,
        city TEXT,
        address TEXT,
        phone TEXT,
        operatingHours TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // INSTRUCTORS TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS instructors (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        licenseNumber TEXT,
        specializations TEXT,
        locationId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(locationId) REFERENCES locations(id)
      )
    `);

    // COURSE TYPES TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS course_types (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        ageGroup TEXT,
        duration INTEGER,
        level TEXT,
        maxStudentsDefault INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // COURSES TABLE (NOW WITH LOCATION & TYPE)
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        courseTypeId TEXT,
        locationId TEXT,
        instructorId TEXT,
        startTime TEXT,
        endTime TEXT,
        daysOfWeek TEXT,
        priceNet REAL,
        priceBrutto REAL,
        maxStudents INTEGER,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(courseTypeId) REFERENCES course_types(id),
        FOREIGN KEY(locationId) REFERENCES locations(id),
        FOREIGN KEY(instructorId) REFERENCES instructors(id)
      )
    `);

    // GROUPS TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        courseId TEXT,
        name TEXT,
        maxCapacity INTEGER,
        currentEnrollment INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(courseId) REFERENCES courses(id)
      )
    `);

    // PROMO CODES TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        description TEXT,
        discountPercent REAL,
        discountFlat REAL,
        maxUses INTEGER,
        usedCount INTEGER DEFAULT 0,
        validFrom DATETIME,
        validUntil DATETIME,
        firstTimeOnly BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // USERS TABLE (ENHANCED)
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
        childrenAges TEXT,
        resetToken TEXT,
        resetTokenExpires DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BOOKINGS TABLE (ENHANCED WITH AUTO-RENEWAL)
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        userId TEXT,
        courseId TEXT,
        groupId TEXT,
        paymentMethod TEXT DEFAULT 'sepa',
        amount REAL,
        amountNet REAL,
        vatAmount REAL,
        promoCodeId TEXT,
        discountApplied REAL DEFAULT 0,
        finalAmount REAL,
        invoiceNumber TEXT UNIQUE,
        status TEXT DEFAULT 'confirmed',
        paymentStatus TEXT DEFAULT 'pending',
        autoRenewal BOOLEAN DEFAULT 0,
        renewalEndDate DATETIME,
        cancellationRequestedAt DATETIME,
        cancellationEffectiveDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id),
        FOREIGN KEY(groupId) REFERENCES groups(id),
        FOREIGN KEY(promoCodeId) REFERENCES promo_codes(id)
      )
    `);

    // PAYMENTS TABLE (DETAILED TRACKING)
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        bookingId TEXT UNIQUE,
        userId TEXT,
        courseId TEXT,
        amount REAL,
        amountNet REAL,
        vatAmount REAL,
        status TEXT DEFAULT 'pending',
        paymentMethod TEXT,
        transactionId TEXT,
        invoiceNumber TEXT,
        paidAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(bookingId) REFERENCES bookings(id),
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      )
    `);

    // WAITLIST TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id TEXT PRIMARY KEY,
        userId TEXT,
        groupId TEXT,
        position INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, groupId),
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(groupId) REFERENCES groups(id)
      )
    `);

    // BADGES TABLE (CERTIFICATES)
    db.run(`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        userId TEXT,
        badgeType TEXT,
        courseId TEXT,
        awardedAt DATETIME,
        certificateNumber TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      )
    `);

    // ASSESSMENTS TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        userId TEXT,
        locationId TEXT,
        courseTypeId TEXT,
        scheduledFor DATETIME,
        notes TEXT,
        recommendedLevel TEXT,
        status TEXT DEFAULT 'scheduled',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(locationId) REFERENCES locations(id),
        FOREIGN KEY(courseTypeId) REFERENCES course_types(id)
      )
    `);

    console.log('✅ Database tables initialized');
  });
}

initializeDatabase();

// ===================== UTILITY FUNCTIONS =====================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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

function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RECHNUNG-${date}-${random}`;
}

function sendEmail(to, subject, body) {
  console.log(`\n📧 EMAIL:\nTo: ${to}\nSubject: ${subject}\nBody: ${body}\n`);
}

// ===================== AUTHENTICATION =====================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ===================== AUTH ROUTES =====================

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone, emergencyContact, guardianConsent, gdprConsent, childrenAges } = req.body;

  if (!gdprConsent) return res.status(400).json({ error: 'GDPR consent required' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateId();

  db.run(
    `INSERT INTO users (id, email, password, name, phone, emergencyContact, guardianConsent, gdprConsent, childrenAges, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email, hashedPassword, name, phone || '', emergencyContact || '', guardianConsent ? 1 : 0, gdprConsent ? 1 : 0, childrenAges || '', 'customer'],
    function (err) {
      if (err) return res.status(400).json({ error: 'Email already exists' });

      const token = jwt.sign({ userId, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

      sendEmail(email, '🌊 Willkommen bei Schwimmschule Next Wave', `Hallo ${name},\n\nwillkommen! Ihr Account wurde erstellt.\n\nViele Grüße,\nSchwimmschule Next Wave`);

      res.json({ token, user: { id: userId, email, name, role: 'customer' } });
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
    res.json({ token, user: { id: user.id, email, name: user.name, role: user.role } });
  });
});

app.post('/api/auth/password-reset-request', (req, res) => {
  const { email } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = generateId();
    const resetExpires = new Date(Date.now() + 3600000).toISOString();

    db.run(
      `UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE id = ?`,
      [resetToken, resetExpires, user.id],
      (err) => {
        if (err) return res.status(400).json({ error: err.message });
        sendEmail(email, '🔐 Passwort zurücksetzen', `Hier ist Ihr Reset-Link: ${resetToken}\nGültig für 1 Stunde.`);
        res.json({ message: 'Reset email sent' });
      }
    );
  });
});

app.post('/api/auth/password-reset', (req, res) => {
  const { resetToken, newPassword } = req.body;

  db.get(`SELECT * FROM users WHERE resetToken = ? AND resetTokenExpires > datetime('now')`, [resetToken], (err, user) => {
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.run(
      `UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?`,
      [hashedPassword, user.id],
      (err) => {
        if (err) return res.status(400).json({ error: err.message });
        sendEmail(user.email, '✅ Passwort geändert', 'Ihr Passwort wurde erfolgreich aktualisiert.');
        res.json({ message: 'Password reset successfully' });
      }
    );
  });
});

// ===================== LOCATIONS =====================

app.get('/api/locations', (req, res) => {
  db.all(`SELECT * FROM locations ORDER BY city`, [], (err, locations) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(locations || []);
  });
});

// ===================== COURSE TYPES & COURSES =====================

app.get('/api/course-types', (req, res) => {
  db.all(`SELECT * FROM course_types ORDER BY name`, [], (err, types) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(types || []);
  });
});

app.get('/api/courses', (req, res) => {
  const { locationId, typeId } = req.query;

  let query = `
    SELECT c.*, ct.name as typeName, ct.ageGroup, ct.duration, ct.level, l.city,
      COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as enrolledCount,
      COUNT(DISTINCT CASE WHEN w.id THEN w.id END) as waitlistCount
    FROM courses c
    JOIN course_types ct ON c.courseTypeId = ct.id
    JOIN locations l ON c.locationId = l.id
    LEFT JOIN bookings b ON c.id = b.courseId
    LEFT JOIN waitlist w ON c.id = (SELECT courseId FROM courses WHERE id = w.id)
    WHERE 1=1
  `;

  let params = [];

  if (locationId) {
    query += ` AND c.locationId = ?`;
    params.push(locationId);
  }

  if (typeId) {
    query += ` AND c.courseTypeId = ?`;
    params.push(typeId);
  }

  query += ` GROUP BY c.id ORDER BY c.startTime`;

  db.all(query, params, (err, courses) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(courses || []);
  });
});

// ===================== PROMO CODES =====================

app.post('/api/promo-codes/validate', (req, res) => {
  const { code, userId } = req.body;

  db.get(`SELECT * FROM promo_codes WHERE code = ? AND validFrom <= datetime('now') AND validUntil >= datetime('now')`, [code.toUpperCase()], (err, promo) => {
    if (err || !promo) return res.status(404).json({ error: 'Invalid or expired promo code' });

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ error: 'Promo code limit reached' });
    }

    // Check if first-time only
    if (promo.firstTimeOnly) {
      db.get(`SELECT COUNT(*) as count FROM bookings WHERE userId = ?`, [userId], (err, result) => {
        if (result.count > 0) return res.status(400).json({ error: 'This code is for first-time bookings only' });
        res.json({ valid: true, promo });
      });
    } else {
      res.json({ valid: true, promo });
    }
  });
});

// ===================== BOOKINGS =====================

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { courseId, paymentMethod, promoCode, autoRenewal } = req.body;
  const bookingId = generateId();
  const invoiceNumber = generateInvoiceNumber();

  db.get(`SELECT c.*, ct.name as typeName FROM courses c JOIN course_types ct ON c.courseTypeId = ct.id WHERE c.id = ?`, [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ error: 'Course not found' });

    db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      let finalAmount = course.priceBrutto;
      let discountApplied = 0;

      // Apply promo code if provided
      if (promoCode) {
        db.get(`SELECT * FROM promo_codes WHERE code = ?`, [promoCode.toUpperCase()], (err, promo) => {
          if (promo) {
            if (promo.discountPercent) {
              discountApplied = (finalAmount * promo.discountPercent) / 100;
            } else {
              discountApplied = promo.discountFlat;
            }
            finalAmount = Math.max(0, finalAmount - discountApplied);

            // Update promo usage
            db.run(`UPDATE promo_codes SET usedCount = usedCount + 1 WHERE id = ?`, [promo.id]);
          }

          const vat = calculateVAT(finalAmount);

          // Create booking
          const renewalEnd = autoRenewal ? new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString() : null;

          db.run(
            `INSERT INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, promoCodeId, discountApplied, finalAmount, invoiceNumber, autoRenewal, renewalEndDate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookingId, req.userId, courseId, paymentMethod || 'sepa', course.priceBrutto, vat.net, vat.vat, promoCode ? promoCode.toUpperCase() : null, discountApplied, finalAmount, invoiceNumber, autoRenewal ? 1 : 0, renewalEnd],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              // Create payment record
              db.run(
                `INSERT INTO payments (id, bookingId, userId, courseId, amount, amountNet, vatAmount, paymentMethod, invoiceNumber, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [generateId(), bookingId, req.userId, courseId, finalAmount, vat.net, vat.vat, paymentMethod || 'sepa', invoiceNumber, 'pending']
              );

              sendEmail(user.email, `✅ Buchung bestätigt - ${course.typeName}`, `Hallo ${user.name},\n\nIhre Buchung wurde bestätigt!\n\nKurs: ${course.typeName}\nRechnungsnummer: ${invoiceNumber}\nBetrag: €${finalAmount.toFixed(2)}\n\nViele Grüße,\nSchwimmschule Next Wave`);

              res.json({
                status: 'booked',
                bookingId,
                invoiceNumber,
                amount: finalAmount,
                autoRenewal
              });
            }
          );
        });
      } else {
        const vat = calculateVAT(finalAmount);
        const renewalEnd = autoRenewal ? new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString() : null;

        db.run(
          `INSERT INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, finalAmount, invoiceNumber, autoRenewal, renewalEndDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [bookingId, req.userId, courseId, paymentMethod || 'sepa', course.priceBrutto, vat.net, vat.vat, finalAmount, invoiceNumber, autoRenewal ? 1 : 0, renewalEnd],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.run(
              `INSERT INTO payments (id, bookingId, userId, courseId, amount, amountNet, vatAmount, paymentMethod, invoiceNumber, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [generateId(), bookingId, req.userId, courseId, finalAmount, vat.net, vat.vat, paymentMethod || 'sepa', invoiceNumber, 'pending']
            );

            sendEmail(user.email, `✅ Buchung bestätigt - ${course.typeName}`, `Hallo ${user.name},\n\nIhre Buchung wurde bestätigt!\n\nKurs: ${course.typeName}\nRechnungsnummer: ${invoiceNumber}\nBetrag: €${finalAmount.toFixed(2)}\n\nViele Grüße,\nSchwimmschule Next Wave`);

            res.json({
              status: 'booked',
              bookingId,
              invoiceNumber,
              amount: finalAmount,
              autoRenewal
            });
          }
        );
      }
    });
  });
});

app.get('/api/bookings', authMiddleware, (req, res) => {
  db.all(
    `SELECT b.*, c.id as courseId, ct.name as courseName, l.city FROM bookings b
     JOIN courses c ON b.courseId = c.id
     JOIN course_types ct ON c.courseTypeId = ct.id
     JOIN locations l ON c.locationId = l.id
     WHERE b.userId = ? AND b.status != 'cancelled'
     ORDER BY b.createdAt DESC`,
    [req.userId],
    (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings || []);
    }
  );
});

app.patch('/api/bookings/:id/cancel', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM bookings WHERE id = ? AND userId = ?`, [req.params.id, req.userId], (err, booking) => {
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const cancellationEffectiveDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    db.run(
      `UPDATE bookings SET cancellationRequestedAt = datetime('now'), cancellationEffectiveDate = ? WHERE id = ?`,
      [cancellationEffectiveDate.toISOString(), req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cancellation requested', effectiveDate: cancellationEffectiveDate });
      }
    );
  });
});

// ===================== PAYMENTS =====================

app.post('/api/payments/confirm', authMiddleware, (req, res) => {
  const { bookingId, transactionId } = req.body;

  db.run(
    `UPDATE payments SET status = 'paid', paidAt = datetime('now'), transactionId = ? WHERE bookingId = ?`,
    [transactionId || generateId(), bookingId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(`UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?`, [bookingId]);

      res.json({ message: 'Payment confirmed' });
    }
  );
});

app.get('/api/payments/history', authMiddleware, (req, res) => {
  db.all(
    `SELECT p.*, ct.name as courseName, l.city FROM payments p
     JOIN courses c ON p.courseId = c.id
     JOIN course_types ct ON c.courseTypeId = ct.id
     JOIN locations l ON c.locationId = l.id
     WHERE p.userId = ?
     ORDER BY p.createdAt DESC`,
    [req.userId],
    (err, payments) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(payments || []);
    }
  );
});

// ===================== ADMIN DASHBOARD =====================

app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const stats = {};

  db.get(`SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'`, [], (err, result) => {
    stats.totalBookings = result?.count || 0;

    db.get(`SELECT COUNT(*) as count FROM payments WHERE status = 'paid'`, [], (err, result) => {
      stats.confirmedPayments = result?.count || 0;

      db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'`, [], (err, result) => {
        stats.totalRevenue = result?.total || 0;

        db.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'pending'`, [], (err, result) => {
          stats.pendingPayments = result?.total || 0;

          db.get(`SELECT COUNT(*) as count FROM users`, [], (err, result) => {
            stats.totalUsers = result?.count || 0;

            db.get(`SELECT COUNT(*) as count FROM courses`, [], (err, result) => {
              stats.totalCourses = result?.count || 0;

              res.json(stats);
            });
          });
        });
      });
    });
  });
});

app.get('/api/admin/payments', authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    `SELECT p.*, u.name as userName, u.email, ct.name as courseName, l.city FROM payments p
     JOIN users u ON p.userId = u.id
     JOIN courses c ON p.courseId = c.id
     JOIN course_types ct ON c.courseTypeId = ct.id
     JOIN locations l ON c.locationId = l.id
     ORDER BY p.createdAt DESC`,
    [],
    (err, payments) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(payments || []);
    }
  );
});

app.get('/api/admin/bookings', authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    `SELECT b.*, u.name, u.email, ct.name as courseName, l.city FROM bookings b
     JOIN users u ON b.userId = u.id
     JOIN courses c ON b.courseId = c.id
     JOIN course_types ct ON c.courseTypeId = ct.id
     JOIN locations l ON c.locationId = l.id
     WHERE b.status != 'cancelled'
     ORDER BY b.createdAt DESC`,
    [],
    (err, bookings) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(bookings || []);
    }
  );
});

// ===================== WAITLIST ENDPOINTS =====================

app.post('/api/waitlist', authMiddleware, (req, res) => {
  const { courseId } = req.body;
  const waitlistId = generateId();

  db.get(`SELECT g.id FROM groups g WHERE g.courseId = ?`, [courseId], (err, group) => {
    if (!group) return res.status(404).json({ error: 'Group not found' });

    db.get(`SELECT COUNT(*) as count FROM waitlist WHERE groupId = ?`, [group.id], (err, result) => {
      const position = (result?.count || 0) + 1;

      db.run(
        `INSERT INTO waitlist (id, userId, groupId, position) VALUES (?, ?, ?, ?)`,
        [waitlistId, req.userId, group.id, position],
        (err) => {
          if (err) return res.status(400).json({ error: 'Already on waitlist' });
          res.json({ waitlistId, position });
        }
      );
    });
  });
});

app.get('/api/waitlist', authMiddleware, (req, res) => {
  db.all(
    `SELECT w.*, c.id as courseId, ct.name as courseName, l.city FROM waitlist w
     JOIN groups g ON w.groupId = g.id
     JOIN courses c ON g.courseId = c.id
     JOIN course_types ct ON c.courseTypeId = ct.id
     JOIN locations l ON c.locationId = l.id
     WHERE w.userId = ?
     ORDER BY w.position`,
    [req.userId],
    (err, waitlist) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(waitlist || []);
    }
  );
});

// ===================== BADGE ENDPOINTS =====================

app.post('/api/badges/award', authMiddleware, (req, res) => {
  const { userId, badgeType, courseId } = req.body;
  if (req.userRole !== 'admin' && req.userRole !== 'instructor') {
    return res.status(403).json({ error: 'Only instructors can award badges' });
  }

  const badgeId = generateId();
  const certNumber = `CERT-${Date.now()}`;

  db.run(
    `INSERT INTO badges (id, userId, badgeType, courseId, awardedAt, certificateNumber)
     VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    [badgeId, userId, badgeType, courseId, certNumber],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      sendEmail(userId, `🏅 Badge Awarded!`, `Congratulations! You earned a ${badgeType} badge!`);
      res.json({ badgeId, certificateNumber: certNumber });
    }
  );
});

app.get('/api/badges/:userId', (req, res) => {
  db.all(
    `SELECT b.*, ct.name as courseName FROM badges b
     LEFT JOIN courses c ON b.courseId = c.id
     LEFT JOIN course_types ct ON c.courseTypeId = ct.id
     WHERE b.userId = ?
     ORDER BY b.awardedAt DESC`,
    [req.params.userId],
    (err, badges) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(badges || []);
    }
  );
});

// ===================== ASSESSMENT ENDPOINTS =====================

app.post('/api/assessments', authMiddleware, (req, res) => {
  const { locationId, courseTypeId, scheduledFor } = req.body;
  const assessmentId = generateId();

  db.run(
    `INSERT INTO assessments (id, userId, locationId, courseTypeId, scheduledFor, status)
     VALUES (?, ?, ?, ?, ?, 'scheduled')`,
    [assessmentId, req.userId, locationId, courseTypeId, scheduledFor],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      sendEmail(req.userId, '📋 Assessment Scheduled', `Your swimming assessment has been scheduled for ${scheduledFor}`);
      res.json({ assessmentId });
    }
  );
});

app.get('/api/assessments', authMiddleware, (req, res) => {
  db.all(
    `SELECT a.*, l.name as locationName, ct.name as courseTypeName FROM assessments a
     JOIN locations l ON a.locationId = l.id
     JOIN course_types ct ON a.courseTypeId = ct.id
     WHERE a.userId = ?
     ORDER BY a.scheduledFor DESC`,
    [req.userId],
    (err, assessments) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(assessments || []);
    }
  );
});

app.post('/api/assessments/:id/complete', authMiddleware, (req, res) => {
  const { notes, recommendedLevel } = req.body;
  if (req.userRole !== 'admin' && req.userRole !== 'instructor') {
    return res.status(403).json({ error: 'Only instructors can complete assessments' });
  }

  db.run(
    `UPDATE assessments SET notes = ?, recommendedLevel = ?, status = 'completed' WHERE id = ?`,
    [notes, recommendedLevel, req.params.id],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Assessment completed' });
    }
  );
});

// ===================== BOOKING MODIFICATION =====================

app.patch('/api/bookings/:id/reschedule', authMiddleware, (req, res) => {
  const { newCourseId } = req.body;

  db.get(`SELECT * FROM bookings WHERE id = ? AND userId = ?`, [req.params.id, req.userId], (err, booking) => {
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    db.run(
      `UPDATE bookings SET courseId = ? WHERE id = ?`,
      [newCourseId, req.params.id],
      (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Booking rescheduled successfully' });
      }
    );
  });
});

// ===================== ERROR HANDLING =====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ===================== START SERVER =====================

app.listen(PORT, () => {
  console.log(`\n🌊 SCHWIMMSCHULE NEXT WAVE API\n🚀 Running on http://localhost:${PORT}\n`);
});
