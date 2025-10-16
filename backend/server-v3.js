const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// ============ EMAIL CONFIGURATION ============
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

function sendRealEmail(to, subject, htmlContent) {
  console.log(`📧 Sending email to ${to}: ${subject}`);
  if (process.env.EMAIL_USER) {
    transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html: htmlContent }, (err) => {
      if (err) console.error('Email error:', err);
      else console.log('✅ Email sent');
    });
  } else {
    console.log('⚠️ Email service not configured, logging only');
  }
}

const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// ===================== DATABASE INITIALIZATION =====================

function initializeDatabase() {
  db.serialize(() => {
    // All original tables...
    db.run(`CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      address TEXT,
      phone TEXT,
      operatingHours TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS instructors (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      licenseNumber TEXT,
      specializations TEXT,
      locationId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(locationId) REFERENCES locations(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS course_types (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      ageGroup TEXT,
      duration INTEGER,
      level TEXT,
      maxStudentsDefault INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS courses (
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
    )`);

    // NEW: Course Schedules (individual sessions)
    db.run(`CREATE TABLE IF NOT EXISTS course_schedules (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      sessionDate DATE NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      sessionNumber INTEGER,
      maxCapacity INTEGER,
      currentEnrollment INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(courseId) REFERENCES courses(id),
      UNIQUE(courseId, sessionDate, startTime)
    )`);

    // NEW: Attendance tracking
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      scheduleId TEXT NOT NULL,
      userId TEXT NOT NULL,
      attended BOOLEAN DEFAULT 0,
      arrivedAt DATETIME,
      leftAt DATETIME,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(scheduleId) REFERENCES course_schedules(id),
      FOREIGN KEY(userId) REFERENCES users(id),
      UNIQUE(scheduleId, userId)
    )`);

    // NEW: Student progress tracking
    db.run(`CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseTypeId TEXT NOT NULL,
      currentLevel TEXT,
      skillsAcquired TEXT,
      sessionsCompleted INTEGER DEFAULT 0,
      totalSessions INTEGER DEFAULT 0,
      progressPercentage REAL DEFAULT 0,
      notes TEXT,
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseTypeId) REFERENCES course_types(id),
      UNIQUE(userId, courseTypeId)
    )`);

    // Original tables with enhancements
    db.run(`CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      courseId TEXT,
      name TEXT,
      maxCapacity INTEGER,
      currentEnrollment INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(courseId) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
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
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
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
      stripeCustomerId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
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
      stripePaymentIntentId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseId) REFERENCES courses(id),
      FOREIGN KEY(groupId) REFERENCES groups(id),
      FOREIGN KEY(promoCodeId) REFERENCES promo_codes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
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
      stripeChargeId TEXT,
      paidAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseId) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      userId TEXT,
      groupId TEXT,
      position INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, groupId),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(groupId) REFERENCES groups(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      userId TEXT,
      badgeType TEXT,
      courseId TEXT,
      awardedAt DATETIME,
      certificateNumber TEXT UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseId) REFERENCES courses(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS assessments (
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
    )`);

    // NEW: Notifications log
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      type TEXT,
      subject TEXT,
      message TEXT,
      read BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);

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

const instructorMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'instructor') {
    return res.status(403).json({ error: 'Instructor access required' });
  }
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

      // German welcome email template
      const welcomeEmail = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🌊 Willkommen bei Schwimmschule Next Wave!</h1>
          </div>
          <div style="padding: 2rem; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <p>Hallo <strong>${name}</strong>,</p>
            <p>herzlichen Glückwunsch! Ihr Account wurde erfolgreich bei Schwimmschule Next Wave im Ruhrgebiet erstellt.</p>
            <p>Sie können sich jetzt anmelden und aus unserem Angebot an professionellen Schwimmkursen wählen:</p>
            <ul style="line-height: 1.8;">
              <li><strong>Babyschwimmen</strong> - Für die Kleinsten mit Eltern</li>
              <li><strong>Seepferdchen Kurs</strong> - Erste Schwimmtechniken</li>
              <li><strong>Aufbaukurs</strong> - Für fortgeschrittene Schwimmer</li>
              <li><strong>Aquafitness</strong> - Fitness und Ausdauer im Wasser</li>
            </ul>
            <p style="margin-top: 2rem;">
              <strong>Ihre Login-Daten:</strong><br/>
              E-Mail: ${email}
            </p>
            <p>Viel Spaß beim Durchstöbern unserer Kurse!</p>
            <p style="margin-top: 2rem; color: #666; font-size: 0.9em;">
              Bei Fragen kontaktieren Sie uns unter: info@schwimmschule-nextwave.de
            </p>
          </div>
        </div>
      `;

      sendRealEmail(email, '🌊 Willkommen bei Schwimmschule Next Wave', welcomeEmail);

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

app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, email, name, role FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });
});

// ===================== LOCATIONS =====================

app.get('/api/locations', (req, res) => {
  db.all(`SELECT * FROM locations ORDER BY city`, [], (err, locations) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(locations || []);
  });
});

// ===================== COURSE MANAGEMENT (ADMIN) =====================

app.post('/api/admin/courses', authMiddleware, adminMiddleware, (req, res) => {
  const { courseTypeId, locationId, instructorId, startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents } = req.body;
  const courseId = generateId();

  db.run(
    `INSERT INTO courses (id, courseTypeId, locationId, instructorId, startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [courseId, courseTypeId, locationId, instructorId, startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ courseId, message: 'Course created' });
    }
  );
});

app.put('/api/admin/courses/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents, status } = req.body;

  db.run(
    `UPDATE courses SET startTime = ?, endTime = ?, daysOfWeek = ?, priceNet = ?, priceBrutto = ?, maxStudents = ?, status = ? WHERE id = ?`,
    [startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents, status, req.params.id],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Course updated' });
    }
  );
});

app.delete('/api/admin/courses/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.run(`UPDATE courses SET status = 'archived' WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Course archived' });
  });
});

// ===================== COURSE SCHEDULES (SESSIONS) =====================

app.post('/api/admin/schedules', authMiddleware, adminMiddleware, (req, res) => {
  const { courseId, sessionDate, startTime, endTime, sessionNumber, maxCapacity, notes } = req.body;
  const scheduleId = generateId();

  db.run(
    `INSERT INTO course_schedules (id, courseId, sessionDate, startTime, endTime, sessionNumber, maxCapacity, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [scheduleId, courseId, sessionDate, startTime, endTime, sessionNumber || 1, maxCapacity || 10, notes || ''],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ scheduleId, message: 'Session scheduled' });
    }
  );
});

app.get('/api/schedules/:courseId', (req, res) => {
  db.all(
    `SELECT * FROM course_schedules WHERE courseId = ? ORDER BY sessionDate, startTime`,
    [req.params.courseId],
    (err, schedules) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(schedules || []);
    }
  );
});

app.get('/api/calendar/:locationId', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT cs.*, c.courseTypeId, ct.name as courseName, ct.ageGroup, ct.level, i.name as instructorName, l.name as locationName
    FROM course_schedules cs
    JOIN courses c ON cs.courseId = c.id
    JOIN course_types ct ON c.courseTypeId = ct.id
    JOIN instructors i ON c.instructorId = i.id
    JOIN locations l ON c.locationId = l.id
    WHERE c.locationId = ?
  `;

  let params = [req.params.locationId];

  if (startDate) {
    query += ` AND cs.sessionDate >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND cs.sessionDate <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY cs.sessionDate, cs.startTime`;

  db.all(query, params, (err, events) => {
    if (err) return res.status(500).json({ error: err.message });
    // Transform for react-big-calendar
    const transformed = (events || []).map(e => ({
      id: e.id,
      title: e.courseName,
      start: new Date(`${e.sessionDate}T${e.startTime}`),
      end: new Date(`${e.sessionDate}T${e.endTime}`),
      resource: e
    }));
    res.json(transformed);
  });
});

// ===================== ATTENDANCE TRACKING =====================

app.post('/api/attendance', authMiddleware, instructorMiddleware, (req, res) => {
  const { scheduleId, userId, attended, notes } = req.body;
  const attendanceId = generateId();

  db.run(
    `INSERT OR REPLACE INTO attendance (id, scheduleId, userId, attended, arrivedAt, notes)
     VALUES (?, ?, ?, ?, datetime('now'), ?)`,
    [attendanceId, scheduleId, userId, attended ? 1 : 0, notes || ''],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });

      // Update progress if attended
      if (attended) {
        db.get(
          `SELECT c.courseTypeId FROM course_schedules cs
           JOIN courses c ON cs.courseId = c.id
           WHERE cs.id = ?`,
          [scheduleId],
          (err, row) => {
            if (row) {
              db.run(
                `UPDATE student_progress SET sessionsCompleted = sessionsCompleted + 1
                 WHERE userId = ? AND courseTypeId = ?`,
                [userId, row.courseTypeId]
              );
            }
          }
        );
      }

      res.json({ attendanceId, message: 'Attendance recorded' });
    }
  );
});

app.get('/api/attendance/:scheduleId', authMiddleware, instructorMiddleware, (req, res) => {
  db.all(
    `SELECT a.*, u.name, u.email FROM attendance a
     JOIN users u ON a.userId = u.id
     WHERE a.scheduleId = ?
     ORDER BY u.name`,
    [req.params.scheduleId],
    (err, records) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(records || []);
    }
  );
});

// ===================== STUDENT PROGRESS =====================

app.get('/api/progress/:userId', authMiddleware, (req, res) => {
  if (req.userId !== req.params.userId && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT sp.*, ct.name as courseTypeName FROM student_progress sp
     JOIN course_types ct ON sp.courseTypeId = ct.id
     WHERE sp.userId = ?
     ORDER BY sp.lastUpdated DESC`,
    [req.params.userId],
    (err, progress) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(progress || []);
    }
  );
});

app.post('/api/admin/progress', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, courseTypeId, currentLevel, skillsAcquired, totalSessions, notes } = req.body;
  const progressId = generateId();

  db.get(`SELECT sessionsCompleted FROM student_progress WHERE userId = ? AND courseTypeId = ?`,
    [userId, courseTypeId],
    (err, existing) => {
      if (existing) {
        // Update
        const progressPercentage = totalSessions > 0 ? (existing.sessionsCompleted / totalSessions) * 100 : 0;
        db.run(
          `UPDATE student_progress SET currentLevel = ?, skillsAcquired = ?, totalSessions = ?, progressPercentage = ?, notes = ?, lastUpdated = datetime('now')
           WHERE userId = ? AND courseTypeId = ?`,
          [currentLevel, skillsAcquired, totalSessions, progressPercentage, notes, userId, courseTypeId],
          (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Progress updated' });
          }
        );
      } else {
        // Create
        const progressPercentage = 0;
        db.run(
          `INSERT INTO student_progress (id, userId, courseTypeId, currentLevel, skillsAcquired, totalSessions, progressPercentage, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [progressId, userId, courseTypeId, currentLevel, skillsAcquired, totalSessions, progressPercentage, notes],
          (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ progressId, message: 'Progress created' });
          }
        );
      }
    }
  );
});

// ===================== STRIPE PAYMENT INTEGRATION =====================

app.post('/api/payments/create-intent', authMiddleware, (req, res) => {
  const { bookingId, amount } = req.body;

  db.get(`SELECT u.stripeCustomerId, u.email FROM users u JOIN bookings b ON u.id = b.userId WHERE b.id = ?`,
    [bookingId],
    async (err, booking) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'eur',
          customer: booking.stripeCustomerId,
          metadata: { bookingId }
        });

        res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

app.post('/api/payments/confirm-stripe', authMiddleware, (req, res) => {
  const { bookingId, stripePaymentIntentId } = req.body;

  stripe.paymentIntents.retrieve(stripePaymentIntentId).then(intent => {
    if (intent.status === 'succeeded') {
      db.run(
        `UPDATE payments SET status = 'paid', stripeChargeId = ?, paidAt = datetime('now') WHERE bookingId = ?`,
        [intent.charges.data[0].id, bookingId],
        (err) => {
          if (!err) {
            db.run(`UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?`, [bookingId]);

            // Send confirmation email - German template
            db.get(`SELECT u.email, u.name, c.typeName, c.ageGroup FROM bookings b
                    JOIN users u ON b.userId = u.id
                    JOIN courses course ON b.courseId = course.id
                    JOIN course_types c ON course.courseTypeId = c.id
                    WHERE b.id = ?`, [bookingId], (err, booking) => {
              if (booking) {
                const confirmationEmail = `
                  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0;">✅ Buchung bestätigt!</h1>
                    </div>
                    <div style="padding: 2rem; background: #f9f9f9; border-radius: 0 0 8px 8px;">
                      <p>Hallo <strong>${booking.name}</strong>,</p>
                      <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihre Buchung bei der Schwimmschule Next Wave bestätigt wurde!</p>
                      <div style="background: white; padding: 1.5rem; border-left: 4px solid #667eea; margin: 1.5rem 0; border-radius: 4px;">
                        <p><strong>Buchungsdetails:</strong></p>
                        <p>Kurs: <strong>${booking.typeName}</strong><br/>
                        Altersgruppe: ${booking.ageGroup}<br/>
                        Rechnungsnummer: ${invoiceNumber}</p>
                      </div>
                      <p>Bitte beachten Sie unsere <a href="info@schwimmschule-nextwave.de" style="color: #667eea;">Allgemeinen Geschäftsbedingungen (AGB)</a> und informieren Sie sich über unsere <a href="info@schwimmschule-nextwave.de" style="color: #667eea;">Stornierungsbedingungen</a>.</p>
                      <p style="margin-top: 2rem; color: #666; font-size: 0.9em;">
                        Bei Fragen oder Änderungswünschen kontaktieren Sie uns unter: info@schwimmschule-nextwave.de
                      </p>
                    </div>
                  </div>
                `;
                sendRealEmail(booking.email, '✅ Buchung bestätigt - Schwimmschule Next Wave', confirmationEmail);
              }
            });
          }
          res.json({ message: 'Payment confirmed' });
        }
      );
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ===================== NOTIFICATIONS =====================

app.post('/api/notifications', authMiddleware, adminMiddleware, (req, res) => {
  const { userId, type, subject, message } = req.body;
  const notificationId = generateId();

  db.run(
    `INSERT INTO notifications (id, userId, type, subject, message) VALUES (?, ?, ?, ?, ?)`,
    [notificationId, userId, type, subject, message],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });

      // Send email if important
      if (type === 'urgent' || type === 'reminder') {
        db.get(`SELECT email FROM users WHERE id = ?`, [userId], (err, user) => {
          if (user) {
            sendRealEmail(user.email, subject, `<h2>${subject}</h2><p>${message}</p>`);
          }
        });
      }

      res.json({ notificationId });
    }
  );
});

app.get('/api/notifications', authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [req.userId],
    (err, notifications) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(notifications || []);
    }
  );
});

// ===================== COURSES (ORIGINAL) =====================

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
    WHERE c.status = 'active'
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

// ===================== BOOKINGS =====================

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { courseId, paymentMethod, promoCode, autoRenewal } = req.body;
  const bookingId = generateId();
  const invoiceNumber = generateInvoiceNumber();

  db.get(`SELECT c.*, ct.name as typeName FROM courses c JOIN course_types ct ON c.courseTypeId = ct.id WHERE c.id = ?`,
    [courseId],
    (err, course) => {
      if (err || !course) return res.status(404).json({ error: 'Course not found' });

      let finalAmount = course.priceBrutto;
      let discountApplied = 0;

      if (promoCode) {
        db.get(`SELECT * FROM promo_codes WHERE code = ? AND validFrom <= datetime('now') AND validUntil >= datetime('now')`,
          [promoCode.toUpperCase()],
          (err, promo) => {
            if (promo) {
              if (promo.discountPercent) {
                discountApplied = (finalAmount * promo.discountPercent) / 100;
              } else {
                discountApplied = promo.discountFlat;
              }
              finalAmount = Math.max(0, finalAmount - discountApplied);
              db.run(`UPDATE promo_codes SET usedCount = usedCount + 1 WHERE id = ?`, [promo.id]);
            }

            const vat = calculateVAT(finalAmount);
            const renewalEnd = autoRenewal ? new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString() : null;

            db.run(
              `INSERT INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, discountApplied, finalAmount, invoiceNumber, autoRenewal, renewalEndDate)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [bookingId, req.userId, courseId, paymentMethod || 'sepa', course.priceBrutto, vat.net, vat.vat, discountApplied, finalAmount, invoiceNumber, autoRenewal ? 1 : 0, renewalEnd],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });

                db.run(
                  `INSERT INTO payments (id, bookingId, userId, courseId, amount, amountNet, vatAmount, paymentMethod, invoiceNumber, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [generateId(), bookingId, req.userId, courseId, finalAmount, vat.net, vat.vat, paymentMethod || 'sepa', invoiceNumber, 'pending']
                );

                res.json({ bookingId, invoiceNumber, amount: finalAmount, autoRenewal });
              }
            );
          }
        );
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

            res.json({ bookingId, invoiceNumber, amount: finalAmount, autoRenewal });
          }
        );
      }
    }
  );
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

app.delete('/api/bookings/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM bookings WHERE id = ? AND userId = ?`, [req.params.id, req.userId], (err, booking) => {
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    db.run(`UPDATE bookings SET status = 'cancelled', cancellationRequestedAt = datetime('now') WHERE id = ?`,
      [req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Booking cancelled' });
      }
    );
  });
});

// ===================== ADMIN ENDPOINTS =====================

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    `SELECT id, email, name, role, createdAt FROM users ORDER BY createdAt DESC`,
    [],
    (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(users || []);
    }
  );
});

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

// ===================== ERROR HANDLING =====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ===================== START SERVER =====================

app.listen(PORT, () => {
  console.log(`\n🌊 SCHWIMMSCHULE NEXT WAVE - ENHANCED API\n🚀 Running on http://localhost:${PORT}\n`);
});
