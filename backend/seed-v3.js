const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create tables
function initializeDatabase() {
  return new Promise((resolve) => {
    db.serialize(() => {
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

      db.run(`CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT,
        city TEXT,
        address TEXT,
        phone TEXT,
        operatingHours TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        category TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

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
      )`, () => {
        resolve();
      });
    });
  });
}

async function main() {
  await initializeDatabase();

  db.serialize(() => {
    console.log('🌊 Seeding Schwimmschule Next Wave (Subscriptions Model)...\n');

  // ===== LOCATIONS =====
  const dortmundId = generateId();
  const essenId = generateId();

  db.run(
    `INSERT OR IGNORE INTO locations (id, name, city, address, phone, operatingHours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dortmundId, 'Radisson Blu Dortmund', 'Dortmund', 'Nähe Westfalenhalle', '0172 9831064', 'Samstag 12:00-15:00, Sonntag 12:00-15:00']
  );

  db.run(
    `INSERT OR IGNORE INTO locations (id, name, city, address, phone, operatingHours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [essenId, 'Kruppkrankenhaus Essen', 'Essen', 'Nähe Messe Essen', '0172 9831064', 'Dienstag 18:15-20:30']
  );

  console.log('✅ Locations created');

  // ===== COURSES =====
  const waterflittersCourse = generateId();
  const seahorseCourse = generateId();
  const waterchampionsCourse = generateId();
  const adultBeginnersCourse = generateId();
  const aquafitnessCourse = generateId();

  const courses = [
    {
      id: waterflittersCourse,
      name: 'Wasserflitzer',
      description: 'Erste spielerische Wassererfahrungen für die Kleinsten. Mit den Wasserflitzern lernen Kinder ab ca. 3 Jahren spielerisch den Umgang mit Wasser. Wir möchten, dass die Kinder das Wasser kennenlernen, erste Bewegungen erfahren und vor allem: Spaß dabei haben!',
      category: 'Kinder'
    },
    {
      id: seahorseCourse,
      name: 'Seepferdchen',
      description: 'Erlernen und Üben der ersten Schwimmtechniken. Nachdem die Kinder bereits erste Wassererfahrungen sammeln konnten, lernen sie im Seepferdchen-Kurs erste Schwimmtechniken. Wir arbeiten hier an Wassersicherheit, Auftrieb und ersten Bewegungsabläufen.',
      category: 'Kinder'
    },
    {
      id: waterchampionsCourse,
      name: 'Wasserchampions',
      description: 'Für Kinder mit Seepferdchenabzeichen. Im Champions-Kurs geht es um Vertiefung und Verbesserung der Schwimmtechniken. Wir arbeiten an Ausdauer, Sicherheit und vor allem: an noch mehr Spaß!',
      category: 'Kinder'
    },
    {
      id: adultBeginnersCourse,
      name: 'Schwimmkurse für Anfänger',
      description: 'Sicherer Umgang im Wasser für Erwachsene. Es ist nie zu spät zum Schwimmenlernen! In unserem Anfänger-Kurs für Erwachsene lernt ihr in eurem eigenen Tempo und ohne Druck die Grundlagen des Schwimmens.',
      category: 'Erwachsene'
    },
    {
      id: aquafitnessCourse,
      name: 'Aquafitness',
      description: 'Fitness und Ausdauer im Wasser für alle Altersstufen. Aquafitness ist eine großartige Möglichkeit, fit zu bleiben. Das Wasser trägt euren Körper und schont die Gelenke.',
      category: 'Erwachsene'
    }
  ];

  courses.forEach(course => {
    db.run(
      `INSERT OR IGNORE INTO courses (id, name, description, category)
       VALUES (?, ?, ?, ?)`,
      [course.id, course.name, course.description, course.category]
    );
  });

  console.log('✅ Courses created');

  // ===== SCHEDULES (Bookable class slots with pricing) =====
  const scheduleData = [
    // Dortmund - Wasserflitzer - Saturday
    { courseId: waterflittersCourse, locationId: dortmundId, dayOfWeek: 'Samstag', timeStart: '12:00', timeEnd: '12:30', capacity: 6, monthlyPrice: 49 },
    { courseId: waterflittersCourse, locationId: dortmundId, dayOfWeek: 'Samstag', timeStart: '12:45', timeEnd: '13:15', capacity: 6, monthlyPrice: 49 },

    // Dortmund - Seepferdchen - Saturday
    { courseId: seahorseCourse, locationId: dortmundId, dayOfWeek: 'Samstag', timeStart: '13:30', timeEnd: '14:00', capacity: 6, monthlyPrice: 59 },
    { courseId: seahorseCourse, locationId: dortmundId, dayOfWeek: 'Sonntag', timeStart: '12:00', timeEnd: '12:30', capacity: 6, monthlyPrice: 59 },

    // Dortmund - Wasserchampions - Sunday
    { courseId: waterchampionsCourse, locationId: dortmundId, dayOfWeek: 'Sonntag', timeStart: '13:00', timeEnd: '13:45', capacity: 7, monthlyPrice: 69 },
    { courseId: waterchampionsCourse, locationId: dortmundId, dayOfWeek: 'Sonntag', timeStart: '14:00', timeEnd: '14:45', capacity: 7, monthlyPrice: 69 },

    // Essen - Wasserflitzer - Tuesday
    { courseId: waterflittersCourse, locationId: essenId, dayOfWeek: 'Dienstag', timeStart: '18:15', timeEnd: '18:45', capacity: 6, monthlyPrice: 49 },
    { courseId: waterflittersCourse, locationId: essenId, dayOfWeek: 'Dienstag', timeStart: '19:00', timeEnd: '19:30', capacity: 6, monthlyPrice: 49 },

    // Essen - Seepferdchen - Tuesday
    { courseId: seahorseCourse, locationId: essenId, dayOfWeek: 'Dienstag', timeStart: '19:45', timeEnd: '20:15', capacity: 6, monthlyPrice: 59 },

    // Essen - Aquafitness - Tuesday
    { courseId: aquafitnessCourse, locationId: essenId, dayOfWeek: 'Dienstag', timeStart: '20:30', timeEnd: '21:15', capacity: 12, monthlyPrice: 54 },
  ];

  scheduleData.forEach(schedule => {
    db.run(
      `INSERT OR IGNORE INTO schedules (id, courseId, locationId, dayOfWeek, timeStart, timeEnd, capacity, monthlyPrice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), schedule.courseId, schedule.locationId, schedule.dayOfWeek, schedule.timeStart, schedule.timeEnd, schedule.capacity, schedule.monthlyPrice]
    );
  });

  console.log('✅ Schedules created');

  // ===== DEMO USERS =====
  const user1Id = generateId();
  const user2Id = generateId();
  const adminId = generateId();

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, gdprConsent, stripeCustomerId, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user1Id, 'max@example.com', bcrypt.hashSync('password123', 10), 'Max Mustermann', '0123 456789', '', 1, 'cus_demo_1', 'customer']
  );

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, gdprConsent, stripeCustomerId, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user2Id, 'anna@example.com', bcrypt.hashSync('password123', 10), 'Anna Schmidt', '0234 567890', '', 1, 'cus_demo_2', 'customer']
  );

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, gdprConsent, stripeCustomerId, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [adminId, 'admin@swim.de', bcrypt.hashSync('admin123', 10), 'Admin', '0345 678901', '', 1, 'cus_admin', 'admin']
  );

  console.log('✅ Demo users created');

    setTimeout(() => {
      db.close(() => {
        console.log('\n🎉 Database seeding complete!\n');
        console.log('📊 SCHWIMMSCHULE NEXT WAVE - Subscriptions Model Ready\n');
        console.log('Demo Credentials:');
        console.log('  Customer 1: max@example.com / password123');
        console.log('  Customer 2: anna@example.com / password123');
        console.log('  Admin: admin@swim.de / admin123\n');
        process.exit(0);
      });
    }, 1000);
  });
}

main().catch(console.error);
