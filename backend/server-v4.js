const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const IS_DEVELOPMENT = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_demo';

// Initialize Stripe only with valid key
let stripe = null;
if (!IS_DEVELOPMENT && process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Mock Stripe for development
const mockStripe = {
  customers: {
    create: async (params) => ({ id: 'cus_mock_' + Date.now(), ...params })
  },
  products: {
    create: async (params) => ({ id: 'prod_mock_' + Date.now(), ...params })
  },
  prices: {
    create: async (params) => ({ id: 'price_mock_' + Date.now(), ...params })
  },
  subscriptions: {
    create: async (params) => ({ id: 'sub_mock_' + Date.now(), client_secret: 'secret_mock_' + Date.now(), ...params }),
    del: async (id) => ({ id, deleted: true })
  },
  webhooks: {
    constructEvent: (body, sig, secret) => ({ type: 'mock.event', data: { object: {} } })
  }
};

// Use mock Stripe in development, real Stripe in production
const stripeClient = IS_DEVELOPMENT ? mockStripe : stripe;

if (IS_DEVELOPMENT) {
  console.log('⚠️  DEVELOPMENT MODE: Using mock Stripe (no real charges will occur)');
}

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
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      phone TEXT,
      emergencyContact TEXT,
      gdprConsent BOOLEAN DEFAULT 0,
      stripeCustomerId TEXT,
      role TEXT DEFAULT 'customer',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Locations table
    db.run(`CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      address TEXT,
      phone TEXT,
      operatingHours TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Courses table (expanded with description, category)
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      category TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Schedules table (NEW - defines bookable class slots)
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      locationId TEXT NOT NULL,
      dayOfWeek TEXT,
      timeStart TEXT,
      timeEnd TEXT,
      capacity INTEGER,
      monthlyPrice REAL,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(courseId) REFERENCES courses(id),
      FOREIGN KEY(locationId) REFERENCES locations(id)
    )`);

    // Subscriptions table (NEW - replaces Bookings)
    db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      scheduleId TEXT NOT NULL,
      childName TEXT,
      childDateOfBirth DATE,
      stripeSubscriptionId TEXT,
      stripeCustomerId TEXT,
      status TEXT DEFAULT 'active',
      startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      cancelledAt DATETIME,
      nextBillingDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(scheduleId) REFERENCES schedules(id),
      UNIQUE(stripeSubscriptionId)
    )`);

    // Stripe Prices table (for mapping Stripe price IDs to schedules)
    db.run(`CREATE TABLE IF NOT EXISTS stripe_prices (
      id TEXT PRIMARY KEY,
      scheduleId TEXT NOT NULL,
      stripePriceId TEXT UNIQUE,
      stripeProductId TEXT,
      monthlyPrice REAL,
      currency TEXT DEFAULT 'eur',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(scheduleId) REFERENCES schedules(id)
    )`);

    console.log('✅ Database tables initialized (Subscriptions model)');
  });
}

initializeDatabase();

// ===================== UTILITY FUNCTIONS =====================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===================== AUTHENTICATION =====================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Kein Token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token ungültig' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin-Zugriff erforderlich' });
  next();
};

// ===================== AUTH ROUTES =====================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone, emergencyContact, gdprConsent } = req.body;

  if (!gdprConsent) return res.status(400).json({ error: 'GDPR Zustimmung erforderlich' });

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = generateId();

    // Create Stripe Customer
    const stripeCustomer = await stripeClient.customers.create({
      email: email,
      name: name
    });

    db.run(
      `INSERT INTO users (id, email, password, name, phone, emergencyContact, gdprConsent, stripeCustomerId, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, name, phone || '', emergencyContact || '', gdprConsent ? 1 : 0, stripeCustomer.id, 'customer'],
      function (err) {
        if (err) return res.status(400).json({ error: 'E-Mail existiert bereits' });

        const token = jwt.sign({ userId, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

        // Send welcome email
        const welcomeEmail = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
            <h2>🌊 Willkommen bei Schwimmschule Next Wave!</h2>
            <p>Hallo ${name},</p>
            <p>herzlichen Glückwunsch! Ihr Account wurde erfolgreich erstellt.</p>
            <p>Sie können sich jetzt anmelden und einen Schwimmkurs abonnieren.</p>
            <p>Bis bald im Wasser!</p>
          </div>
        `;
        sendRealEmail(email, '🌊 Willkommen bei Schwimmschule Next Wave', welcomeEmail);

        res.json({ token, user: { id: userId, email, name, role: 'customer' } });
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Ungültige Anmeldedaten' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email, name: user.name, role: user.role } });
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, email, name, role FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    res.json({ user });
  });
});

// ===================== COURSES & SCHEDULES =====================

app.get('/api/courses', (req, res) => {
  db.all(`SELECT * FROM courses WHERE status IS NULL OR status = 'active'`, [], (err, courses) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(courses || []);
  });
});

app.get('/api/courses/:id', (req, res) => {
  db.get(`SELECT * FROM courses WHERE id = ?`, [req.params.id], (err, course) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(course || {});
  });
});

app.get('/api/locations', (req, res) => {
  db.all(`SELECT * FROM locations ORDER BY city`, [], (err, locations) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(locations || []);
  });
});

// Get schedules (class slots) with pricing
app.get('/api/schedules', (req, res) => {
  const { courseId, locationId } = req.query;

  let query = `
    SELECT s.*, c.name as courseName, l.name as locationName, l.city
    FROM schedules s
    JOIN courses c ON s.courseId = c.id
    JOIN locations l ON s.locationId = l.id
    WHERE s.status = 'active'
  `;

  let params = [];

  if (courseId) {
    query += ` AND s.courseId = ?`;
    params.push(courseId);
  }

  if (locationId) {
    query += ` AND s.locationId = ?`;
    params.push(locationId);
  }

  query += ` ORDER BY s.dayOfWeek, s.timeStart`;

  db.all(query, params, (err, schedules) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(schedules || []);
  });
});

// Calendar events endpoint (for visual calendar on frontend)
app.get('/api/calendar-events', (req, res) => {
  const { location, courseType } = req.query;

  let query = `
    SELECT s.*, c.name as courseName, l.name as locationName, l.city, l.address,
           COUNT(CASE WHEN sub.status = 'active' THEN 1 END) as enrolledCount,
           s.capacity - COUNT(CASE WHEN sub.status = 'active' THEN 1 END) as availableSlots
    FROM schedules s
    JOIN courses c ON s.courseId = c.id
    JOIN locations l ON s.locationId = l.id
    LEFT JOIN subscriptions sub ON s.id = sub.scheduleId
    WHERE s.status = 'active'
  `;

  let params = [];

  if (location && location !== 'Alle Standorte') {
    query += ` AND l.name LIKE ?`;
    params.push(`%${location}%`);
  }

  if (courseType && courseType !== 'Alle Kurse') {
    query += ` AND c.name LIKE ?`;
    params.push(`%${courseType}%`);
  }

  query += ` GROUP BY s.id ORDER BY s.dayOfWeek, s.timeStart`;

  db.all(query, params, (err, events) => {
    if (err) return res.status(500).json({ error: err.message });

    // Transform for calendar display
    const calendarEvents = (events || []).map(e => ({
      id: e.id,
      title: `${e.courseName} - ${e.timeStart}`,
      courseId: e.courseId,
      courseName: e.courseName,
      locationName: e.locationName,
      city: e.city,
      address: e.address,
      dayOfWeek: e.dayOfWeek,
      timeStart: e.timeStart,
      timeEnd: e.timeEnd,
      monthlyPrice: e.monthlyPrice,
      capacity: e.capacity,
      enrolledCount: e.enrolledCount,
      availableSlots: e.availableSlots,
      status: e.availableSlots > 0 ? 'Noch ' + e.availableSlots + ' Plätze frei' : 'Ausgebucht'
    }));

    res.json(calendarEvents);
  });
});

// ===================== SUBSCRIPTIONS =====================

// Get user's active subscriptions
app.get('/api/subscriptions', authMiddleware, (req, res) => {
  db.all(`
    SELECT s.*, c.name as courseName, l.name as locationName, l.city, sch.dayOfWeek, sch.timeStart, sch.timeEnd, sch.monthlyPrice
    FROM subscriptions s
    JOIN schedules sch ON s.scheduleId = sch.id
    JOIN courses c ON sch.courseId = c.id
    JOIN locations l ON sch.locationId = l.id
    WHERE s.userId = ? AND s.status = 'active'
    ORDER BY sch.dayOfWeek, sch.timeStart
  `, [req.userId], (err, subscriptions) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(subscriptions || []);
  });
});

// Create a subscription (Stripe Subscription)
app.post('/api/subscriptions', authMiddleware, async (req, res) => {
  try {
    const { scheduleId, childName, childDateOfBirth } = req.body;

    // Get schedule and pricing info
    db.get(`
      SELECT s.*, sp.stripePriceId
      FROM schedules s
      LEFT JOIN stripe_prices sp ON s.id = sp.scheduleId
      WHERE s.id = ?
    `, [scheduleId], async (err, schedule) => {
      if (err || !schedule) {
        return res.status(404).json({ error: 'Kurs nicht gefunden' });
      }

      // Get user's Stripe customer ID
      db.get(`SELECT stripeCustomerId FROM users WHERE id = ?`, [req.userId], async (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        try {
          // Create or get Stripe price
          let stripePriceId = schedule.stripePriceId;

          if (!stripePriceId) {
            // Create product and price in Stripe
            const product = await stripeClient.products.create({
              name: `${schedule.courseName} - ${schedule.dayOfWeek} ${schedule.timeStart}`,
              description: `Schwimmkurs: ${schedule.courseName}`
            });

            const price = await stripeClient.prices.create({
              product: product.id,
              unit_amount: Math.round(schedule.monthlyPrice * 100),
              currency: 'eur',
              recurring: {
                interval: 'month',
                interval_count: 1
              }
            });

            stripePriceId = price.id;

            // Save price mapping
            db.run(`
              INSERT INTO stripe_prices (id, scheduleId, stripePriceId, stripeProductId, monthlyPrice, currency)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [generateId(), scheduleId, stripePriceId, product.id, schedule.monthlyPrice, 'eur']);
          }

          // Create Stripe Subscription
          const subscription = await stripeClient.subscriptions.create({
            customer: user.stripeCustomerId,
            items: [{ price: stripePriceId }],
            payment_behavior: 'default_incomplete',
            collection_method: 'charge_automatically'
          });

          // Create subscription in database
          const subscriptionId = generateId();
          const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          db.run(`
            INSERT INTO subscriptions (id, userId, scheduleId, childName, childDateOfBirth, stripeSubscriptionId, stripeCustomerId, status, nextBillingDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [subscriptionId, req.userId, scheduleId, childName, childDateOfBirth, subscription.id, user.stripeCustomerId, 'active', nextBillingDate], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              subscriptionId,
              stripeSubscriptionId: subscription.id,
              clientSecret: subscription.client_secret,
              monthlyPrice: schedule.monthlyPrice
            });
          });
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
          res.status(500).json({ error: stripeError.message });
        }
      });
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/subscriptions/:id/cancel', authMiddleware, async (req, res) => {
  try {
    db.get(`SELECT stripeSubscriptionId FROM subscriptions WHERE id = ? AND userId = ?`, [req.params.id, req.userId], async (err, subscription) => {
      if (err || !subscription) {
        return res.status(404).json({ error: 'Abonnement nicht gefunden' });
      }

      // Cancel in Stripe
      await stripeClient.subscriptions.del(subscription.stripeSubscriptionId);

      // Update in database
      db.run(`
        UPDATE subscriptions SET status = 'cancelled', cancelledAt = datetime('now')
        WHERE id = ?
      `, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Abonnement gekündigt' });
      });
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== ADMIN ENDPOINTS =====================

// Admin: Create course
app.post('/api/admin/courses', authMiddleware, adminMiddleware, (req, res) => {
  const { name, description, category } = req.body;
  const courseId = generateId();

  db.run(
    `INSERT INTO courses (id, name, description, category) VALUES (?, ?, ?, ?)`,
    [courseId, name, description, category],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ courseId, message: 'Kurs erstellt' });
    }
  );
});

// Admin: Create schedule (bookable class slot)
app.post('/api/admin/schedules', authMiddleware, adminMiddleware, (req, res) => {
  const { courseId, locationId, dayOfWeek, timeStart, timeEnd, capacity, monthlyPrice } = req.body;
  const scheduleId = generateId();

  db.run(
    `INSERT INTO schedules (id, courseId, locationId, dayOfWeek, timeStart, timeEnd, capacity, monthlyPrice)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [scheduleId, courseId, locationId, dayOfWeek, timeStart, timeEnd, capacity, monthlyPrice],
    (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ scheduleId, message: 'Kursslot erstellt' });
    }
  );
});

// Admin: Get all subscriptions
app.get('/api/admin/subscriptions', authMiddleware, adminMiddleware, (req, res) => {
  db.all(`
    SELECT s.*, u.name as userName, u.email, c.name as courseName, l.name as locationName, sch.dayOfWeek, sch.timeStart, sch.monthlyPrice
    FROM subscriptions s
    JOIN users u ON s.userId = u.id
    JOIN schedules sch ON s.scheduleId = sch.id
    JOIN courses c ON sch.courseId = c.id
    JOIN locations l ON sch.locationId = l.id
    ORDER BY s.status DESC, s.createdAt DESC
  `, [], (err, subscriptions) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(subscriptions || []);
  });
});

// Admin: Cancel subscription (on behalf of customer)
app.post('/api/admin/subscriptions/:id/cancel', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    db.get(`SELECT stripeSubscriptionId FROM subscriptions WHERE id = ?`, [req.params.id], async (err, subscription) => {
      if (err || !subscription) {
        return res.status(404).json({ error: 'Abonnement nicht gefunden' });
      }

      // Cancel in Stripe
      await stripeClient.subscriptions.del(subscription.stripeSubscriptionId);

      // Update in database
      db.run(`
        UPDATE subscriptions SET status = 'cancelled', cancelledAt = datetime('now')
        WHERE id = ?
      `, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Abonnement gekündigt' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get class roster (all children in a schedule)
app.get('/api/admin/rosters/:scheduleId', authMiddleware, adminMiddleware, (req, res) => {
  db.all(`
    SELECT s.id, s.childName, s.childDateOfBirth, u.name as parentName, u.email, u.phone, s.status, s.startDate
    FROM subscriptions s
    JOIN users u ON s.userId = u.id
    WHERE s.scheduleId = ? AND s.status = 'active'
    ORDER BY s.childName
  `, [req.params.scheduleId], (err, children) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(children || []);
  });
});

// Admin: Dashboard with MRR
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const stats = {};

  db.get(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`, [], (err, result) => {
    stats.activeSubscriptions = result?.count || 0;

    db.get(`SELECT COUNT(*) as count FROM subscriptions`, [], (err, result) => {
      stats.totalSubscriptions = result?.count || 0;

      // Calculate MRR (Monthly Recurring Revenue)
      db.get(`
        SELECT COALESCE(SUM(sch.monthlyPrice), 0) as mrr
        FROM subscriptions s
        JOIN schedules sch ON s.scheduleId = sch.id
        WHERE s.status = 'active'
      `, [], (err, result) => {
        stats.monthlyRecurringRevenue = result?.mrr || 0;

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

// ===================== STRIPE WEBHOOKS =====================

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

  try {
    const event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);

    console.log(`📨 Webhook received: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        db.run(
          `UPDATE subscriptions SET status = 'cancelled' WHERE stripeSubscriptionId = ?`,
          [subscription.id],
          (err) => {
            if (err) console.error('Webhook error:', err);
            else console.log('✅ Subscription cancelled in DB');
          }
        );
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        db.run(
          `UPDATE subscriptions SET status = 'active', nextBillingDate = datetime('now', '+30 days')
           WHERE stripeSubscriptionId = ?`,
          [invoice.subscription],
          (err) => {
            if (err) console.error('Webhook error:', err);
            else console.log('✅ Payment succeeded, subscription active');
          }
        );
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        db.run(
          `UPDATE subscriptions SET status = 'past_due' WHERE stripeSubscriptionId = ?`,
          [failedInvoice.subscription],
          (err) => {
            if (err) console.error('Webhook error:', err);
            else console.log('⚠️ Payment failed, subscription past_due');
          }
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ===================== ERROR HANDLING =====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Interner Fehler' });
});

// ===================== START SERVER =====================

app.listen(PORT, () => {
  console.log(`\n🌊 SCHWIMMSCHULE NEXT WAVE - SUBSCRIPTIONS API\n🚀 Running on http://localhost:${PORT}\n`);
});
