const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

db.serialize(() => {
  console.log('🌊 Seeding Schwimmschule Next Wave Database...\n');

  // SEED LOCATIONS - RUHRGEBIET
  const dortmundId = generateId();
  const essenId = generateId();
  const bochumId = generateId();

  db.run(
    `INSERT OR IGNORE INTO locations (id, name, city, address, phone, operatingHours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dortmundId, 'Schwimmzentrum Dortmund-Mitte', 'Dortmund-Mitte', 'Kasernenstraße 45, 44147 Dortmund', '+49 (0)231 123-4567', 'Mo-Fr: 15:00-20:00, Sa-So: 10:00-18:00']
  );

  db.run(
    `INSERT OR IGNORE INTO locations (id, name, city, address, phone, operatingHours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [essenId, 'Grugabad Essen', 'Essen', 'Virchowstraße 167, 45147 Essen', '+49 (0)201 456-7890', 'Mo-Fr: 15:00-20:00, Sa-So: 10:00-18:00']
  );

  db.run(
    `INSERT OR IGNORE INTO locations (id, name, city, address, phone, operatingHours)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [bochumId, 'Hallenbad Bochum', 'Bochum', 'Universitätsstraße 101, 44799 Bochum', '+49 (0)234 789-0123', 'Mo-Fr: 15:00-20:00, Sa-So: 10:00-18:00']
  );

  console.log('✅ Locations (Ruhrgebiet) created');

  // SEED INSTRUCTORS
  const trainer1Id = generateId();
  const trainer2Id = generateId();
  const trainer3Id = generateId();
  const trainer4Id = generateId();

  db.run(`INSERT OR IGNORE INTO instructors (id, name, email, phone, licenseNumber, specializations, locationId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [trainer1Id, 'Hanna Schmidt', 'hanna@swim.de', '+49 (0)172 983-1064', 'LIZENZ-001', 'Babyschwimmen, Anfänger, Aquafit', dortmundId]);

  db.run(`INSERT OR IGNORE INTO instructors (id, name, email, phone, licenseNumber, specializations, locationId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [trainer2Id, 'Marco Rossi', 'marco@swim.de', '+49 (0)172 983-1065', 'LIZENZ-002', 'Fortgeschrittene, Aufbaukurs', essenId]);

  db.run(`INSERT OR IGNORE INTO instructors (id, name, email, phone, licenseNumber, specializations, locationId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [trainer3Id, 'Sarah Müller', 'sarah@swim.de', '+49 (0)172 983-1066', 'LIZENZ-003', 'Seepferdchen, Aquafit', dortmundId]);

  db.run(`INSERT OR IGNORE INTO instructors (id, name, email, phone, licenseNumber, specializations, locationId)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [trainer4Id, 'Klaus Weber', 'klaus@swim.de', '+49 (0)172 983-1067', 'LIZENZ-004', 'Aufbaukurs, Fortgeschrittene', bochumId]);

  console.log('✅ Instructors (Ruhrgebiet) created');

  // SEED COURSE TYPES - GERMAN COURSES
  const courseTypes = [
    { id: generateId(), name: 'Babyschwimmen', description: 'Wassereinstieg mit Eltern für die Kleinsten', ageGroup: '0-3 Jahre', duration: 30, level: 'Anfänger', maxStudents: 8 },
    { id: generateId(), name: 'Seepferdchen Kurs (30min)', description: 'Erste Schwimmtechniken - Anfänger Level', ageGroup: '4-5 Jahre', duration: 30, level: 'Anfänger', maxStudents: 6 },
    { id: generateId(), name: 'Seepferdchen Kurs (40min)', description: 'Seepferdchen mit erweiterten Techniken', ageGroup: '4-5 Jahre', duration: 40, level: 'Anfänger', maxStudents: 6 },
    { id: generateId(), name: 'Aufbaukurs Kinder', description: 'Weiterführender Kurs für geübte Schwimmer', ageGroup: '6-8 Jahre', duration: 45, level: 'Fortgeschritten', maxStudents: 7 },
    { id: generateId(), name: 'Aufbaukurs Bronze', description: 'Vorbereitung auf Schwimmabzeichen Bronze', ageGroup: '8-10 Jahre', duration: 45, level: 'Fortgeschritten', maxStudents: 7 },
    { id: generateId(), name: 'Schwimmen für Erwachsene', description: 'Sicheres Schwimmen für Anfänger', ageGroup: 'Erwachsene', duration: 50, level: 'Anfänger', maxStudents: 8 },
    { id: generateId(), name: 'Aquafitness', description: 'Fitness und Ausdauer im Wasser', ageGroup: 'Alle', duration: 45, level: 'Alle', maxStudents: 12 },
    { id: generateId(), name: 'Aqua Zumba', description: 'Lateinamerikanische Tänze im Wasser', ageGroup: 'Alle', duration: 45, level: 'Alle', maxStudents: 12 },
    { id: generateId(), name: 'Triathlontraining', description: 'Spezielles Training für Triathleten', ageGroup: 'Erwachsene', duration: 60, level: 'Fortgeschritten', maxStudents: 10 },
  ];

  courseTypes.forEach(ct => {
    db.run(
      `INSERT OR IGNORE INTO course_types (id, name, description, ageGroup, duration, level, maxStudentsDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ct.id, ct.name, ct.description, ct.ageGroup, ct.duration, ct.level, ct.maxStudents]
    );
  });

  console.log('✅ Course types created');

  // SEED COURSES WITH LOCATION-SPECIFIC PRICING - RUHRGEBIET
  const courses = [
    // Dortmund-Mitte Courses
    { locationId: dortmundId, typeIdx: 0, instructorId: trainer1Id, startTime: '10:00', endTime: '10:30', daysOfWeek: 'Sa,So', priceNet: 59.66, priceBrutto: 71 },
    { locationId: dortmundId, typeIdx: 1, instructorId: trainer1Id, startTime: '10:45', endTime: '11:15', daysOfWeek: 'Sa,So', priceNet: 67.23, priceBrutto: 80 },
    { locationId: dortmundId, typeIdx: 2, instructorId: trainer3Id, startTime: '11:30', endTime: '12:10', daysOfWeek: 'Sa,So', priceNet: 78.99, priceBrutto: 94 },
    { locationId: dortmundId, typeIdx: 3, instructorId: trainer3Id, startTime: '12:30', endTime: '13:15', daysOfWeek: 'Sa,So', priceNet: 78.99, priceBrutto: 94 },
    { locationId: dortmundId, typeIdx: 6, instructorId: trainer1Id, startTime: '14:00', endTime: '14:45', daysOfWeek: 'Mi,Do', priceNet: 45.38, priceBrutto: 54 },

    // Essen (Grugabad) Courses
    { locationId: essenId, typeIdx: 0, instructorId: trainer2Id, startTime: '15:00', endTime: '15:30', daysOfWeek: 'Mo,Mi,Fr', priceNet: 59.66, priceBrutto: 71 },
    { locationId: essenId, typeIdx: 1, instructorId: trainer2Id, startTime: '16:00', endTime: '16:30', daysOfWeek: 'Mo,Mi,Fr', priceNet: 67.23, priceBrutto: 80 },
    { locationId: essenId, typeIdx: 2, instructorId: trainer2Id, startTime: '17:00', endTime: '17:40', daysOfWeek: 'Di,Do', priceNet: 78.99, priceBrutto: 94 },
    { locationId: essenId, typeIdx: 4, instructorId: trainer2Id, startTime: '18:00', endTime: '18:45', daysOfWeek: 'Di,Do', priceNet: 78.99, priceBrutto: 94 },
    { locationId: essenId, typeIdx: 7, instructorId: trainer2Id, startTime: '19:00', endTime: '19:45', daysOfWeek: 'Sa', priceNet: 45.38, priceBrutto: 54 },

    // Bochum Courses
    { locationId: bochumId, typeIdx: 1, instructorId: trainer4Id, startTime: '15:30', endTime: '16:00', daysOfWeek: 'Di,Do', priceNet: 67.23, priceBrutto: 80 },
    { locationId: bochumId, typeIdx: 3, instructorId: trainer4Id, startTime: '16:15', endTime: '17:00', daysOfWeek: 'Mo,Mi', priceNet: 78.99, priceBrutto: 94 },
    { locationId: bochumId, typeIdx: 4, instructorId: trainer4Id, startTime: '17:15', endTime: '18:00', daysOfWeek: 'Mo,Mi', priceNet: 78.99, priceBrutto: 94 },
    { locationId: bochumId, typeIdx: 5, instructorId: trainer4Id, startTime: '18:30', endTime: '19:20', daysOfWeek: 'Di,Do', priceNet: 70.59, priceBrutto: 84 },
    { locationId: bochumId, typeIdx: 8, instructorId: trainer4Id, startTime: '19:00', endTime: '20:00', daysOfWeek: 'Sa', priceNet: 84.03, priceBrutto: 100 },
  ];

  courses.forEach((course, idx) => {
    db.run(
      `INSERT OR IGNORE INTO courses (id, courseTypeId, locationId, instructorId, startTime, endTime, daysOfWeek, priceNet, priceBrutto, maxStudents, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), courseTypes[course.typeIdx].id, course.locationId, course.instructorId, course.startTime, course.endTime, course.daysOfWeek, course.priceNet, course.priceBrutto, courseTypes[course.typeIdx].maxStudents, 'active']
    );
  });

  console.log('✅ Courses created');

  // SEED PROMO CODES
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  db.run(
    `INSERT OR IGNORE INTO promo_codes (id, code, description, discountPercent, maxUses, usedCount, validFrom, validUntil, firstTimeOnly)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), 'FIRST10', '10% Rabatt für Erstteilnehmer', 10, 100, 0, now.toISOString(), future.toISOString(), 1]
  );

  db.run(
    `INSERT OR IGNORE INTO promo_codes (id, code, description, discountPercent, maxUses, usedCount, validFrom, validUntil, firstTimeOnly)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateId(), 'SUMMER20', '20% Rabatt im Sommer', 20, 50, 0, now.toISOString(), future.toISOString(), 0]
  );

  console.log('✅ Promo codes created');

  // SEED DEMO USERS
  const user1Id = generateId();
  const user2Id = generateId();
  const adminId = generateId();

  const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, guardianConsent, gdprConsent, role, childrenAges)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user1Id, 'max@example.com', hashPassword('password123'), 'Max Mustermann', '+49 (0)123 456789', '+49 (0)987 654321', 1, 1, 'customer', '5,7']
  );

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, guardianConsent, gdprConsent, role, childrenAges)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user2Id, 'anna@example.com', hashPassword('password123'), 'Anna Schmidt', '+49 (0)234 567890', '+49 (0)876 543210', 1, 1, 'customer', '4,8']
  );

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password, name, phone, emergencyContact, gdprConsent, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [adminId, 'admin@swim.de', hashPassword('admin123'), 'Admin', '+49 (0)345 678901', '', 1, 'admin']
  );

  console.log('✅ Demo users created');

  // Fetch courses for demo bookings
  db.all(`SELECT id, priceBrutto FROM courses LIMIT 3`, [], (err, courses) => {
    if (courses && courses.length >= 2) {
      // Demo bookings
      const booking1Id = generateId();
      const payment1Id = generateId();
      const invoice1 = `RECHNUNG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-000001`;

      db.run(
        `INSERT OR IGNORE INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, finalAmount, invoiceNumber, paymentStatus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [booking1Id, user1Id, courses[0].id, 'sepa', courses[0].priceBrutto, (courses[0].priceBrutto / 1.19).toFixed(2), (courses[0].priceBrutto * 0.19 / 1.19).toFixed(2), courses[0].priceBrutto, invoice1, 'paid', 'confirmed']
      );

      db.run(
        `INSERT OR IGNORE INTO payments (id, bookingId, userId, courseId, amount, amountNet, vatAmount, paymentMethod, invoiceNumber, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [payment1Id, booking1Id, user1Id, courses[0].id, courses[0].priceBrutto, (courses[0].priceBrutto / 1.19).toFixed(2), (courses[0].priceBrutto * 0.19 / 1.19).toFixed(2), 'sepa', invoice1, 'paid', new Date().toISOString()]
      );

      const booking2Id = generateId();
      const payment2Id = generateId();
      const invoice2 = `RECHNUNG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-000002`;

      db.run(
        `INSERT OR IGNORE INTO bookings (id, userId, courseId, paymentMethod, amount, amountNet, vatAmount, finalAmount, invoiceNumber, paymentStatus, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [booking2Id, user2Id, courses[1].id, 'bank-transfer', courses[1].priceBrutto, (courses[1].priceBrutto / 1.19).toFixed(2), (courses[1].priceBrutto * 0.19 / 1.19).toFixed(2), courses[1].priceBrutto, invoice2, 'pending', 'confirmed']
      );

      db.run(
        `INSERT OR IGNORE INTO payments (id, bookingId, userId, courseId, amount, amountNet, vatAmount, paymentMethod, invoiceNumber, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [payment2Id, booking2Id, user2Id, courses[1].id, courses[1].priceBrutto, (courses[1].priceBrutto / 1.19).toFixed(2), (courses[1].priceBrutto * 0.19 / 1.19).toFixed(2), 'bank-transfer', invoice2, 'pending']
      );

      console.log('✅ Demo bookings & payments created');
    }
  });

  setTimeout(() => {
    db.close(() => {
      console.log('\n🎉 Database seeding complete!\n');
      console.log('📊 SCHWIMMSCHULE NEXT WAVE - Demo Data Ready\n');
      console.log('Demo Credentials:');
      console.log('  Customer 1: max@example.com / password123');
      console.log('  Customer 2: anna@example.com / password123');
      console.log('  Admin: admin@swim.de / admin123\n');
      console.log('Promo Codes:');
      console.log('  FIRST10 - 10% discount (first-time only)');
      console.log('  SUMMER20 - 20% discount\n');
      process.exit(0);
    });
  }, 1000);
});
