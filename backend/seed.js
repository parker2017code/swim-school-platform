const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'swim_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to database for seeding');
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function seedDatabase() {
  // Demo Users
  const admin = {
    id: 'admin123',
    email: 'admin@swim.de',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    phone: '+49123456789',
    role: 'admin'
  };

  const customer1 = {
    id: 'customer1',
    email: 'max@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Max Müller',
    phone: '+49987654321',
    role: 'customer'
  };

  const customer2 = {
    id: 'customer2',
    email: 'anna@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Anna Schmidt',
    phone: '+49555666777',
    role: 'customer'
  };

  const instructor = {
    id: 'instructor1',
    email: 'trainer@swim.de',
    password: bcrypt.hashSync('password123', 10),
    name: 'Trainer Hans',
    phone: '+49111222333',
    role: 'instructor'
  };

  // Clear and seed users
  db.run(`DELETE FROM users`, () => {
    [admin, customer1, customer2, instructor].forEach(user => {
      db.run(
        `INSERT INTO users (id, email, password, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.password, user.name, user.phone, user.role]
      );
    });
    console.log('✅ Users seeded');
  });

  // Demo Courses - 5 real German swim courses
  const courses = [
    {
      id: 'course1',
      name: 'Wasserflitzerkurse',
      description: 'Spielerischer Einstieg ins Wasser für die kleinsten Schwimmer',
      instructor: 'Trainer Hans',
      level: 'Anfänger',
      ageGroup: '3-4 Jahre',
      price: 80,
      maxStudents: 8,
      startTime: '15:00',
      endTime: '15:45',
      days: 'Montag, Mittwoch'
    },
    {
      id: 'course2',
      name: 'Seepferchenkurse',
      description: 'Erste Schwimmtechniken und Wassersicherheit',
      instructor: 'Trainer Hans',
      level: 'Anfänger',
      ageGroup: '4-5 Jahre',
      price: 80,
      maxStudents: 10,
      startTime: '16:00',
      endTime: '16:45',
      days: 'Dienstag, Donnerstag'
    },
    {
      id: 'course3',
      name: 'Wasserchampions',
      description: 'Fortgeschrittene Schwimmtechniken für sichere Schwimmer',
      instructor: 'Trainer Hans',
      level: 'Fortgeschrittene',
      ageGroup: '6-8 Jahre',
      price: 94,
      maxStudents: 12,
      startTime: '16:00',
      endTime: '16:50',
      days: 'Montag, Mittwoch'
    },
    {
      id: 'course4',
      name: 'Anfängerkurse',
      description: 'Grundlagen des Schwimmens für Anfänger aller Altersgruppen',
      instructor: 'Trainer Hans',
      level: 'Anfänger',
      ageGroup: '9-12 Jahre',
      price: 80,
      maxStudents: 10,
      startTime: '17:00',
      endTime: '17:45',
      days: 'Dienstag, Freitag'
    },
    {
      id: 'course5',
      name: 'Aquafitnesskurse',
      description: 'Fitness und Ausdauer im Wasser für Erwachsene',
      instructor: 'Trainer Hans',
      level: 'Anfänger',
      ageGroup: 'Erwachsene',
      price: 50,
      maxStudents: 15,
      startTime: '19:00',
      endTime: '19:50',
      days: 'Montag, Donnerstag'
    }
  ];

  // Clear and seed courses
  db.run(`DELETE FROM courses`, () => {
    courses.forEach(course => {
      db.run(
        `INSERT INTO courses (id, name, description, instructor, level, ageGroup, price, maxStudents, startTime, endTime, days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [course.id, course.name, course.description, course.instructor, course.level, course.ageGroup, course.price, course.maxStudents, course.startTime, course.endTime, course.days]
      );
    });
    console.log('✅ Courses seeded (5 German swim courses)');
  });

  // Clear and seed sample bookings
  db.run(`DELETE FROM bookings`, () => {
    const booking1 = {
      id: 'booking1',
      userId: 'customer1',
      courseId: 'course1',
      amount: 80,
      paymentStatus: 'paid'
    };
    const booking2 = {
      id: 'booking2',
      userId: 'customer2',
      courseId: 'course3',
      amount: 94,
      paymentStatus: 'pending'
    };

    [booking1, booking2].forEach(booking => {
      db.run(
        `INSERT INTO bookings (id, userId, courseId, amount, paymentStatus) VALUES (?, ?, ?, ?, ?)`,
        [booking.id, booking.userId, booking.courseId, booking.amount, booking.paymentStatus]
      );
    });
    console.log('✅ Sample bookings seeded');
  });

  // Clear and seed payments
  db.run(`DELETE FROM payments`, () => {
    const payment1 = {
      id: 'payment1',
      bookingId: 'booking1',
      userId: 'customer1',
      amount: 80,
      status: 'paid'
    };

    db.run(
      `INSERT INTO payments (id, bookingId, userId, amount, status) VALUES (?, ?, ?, ?, ?)`,
      [payment1.id, payment1.bookingId, payment1.userId, payment1.amount, payment1.status]
    );
    console.log('✅ Sample payments seeded');
  });

  // Clear waitlist
  db.run(`DELETE FROM waitlist`, () => {
    console.log('✅ Waitlist cleared');
  });

  console.log('\n🎉 Database seeding complete!\n');
  console.log('📋 DEMO LOGIN CREDENTIALS:');
  console.log('   Admin: admin@swim.de / admin123');
  console.log('   Customer 1: max@example.com / password123');
  console.log('   Customer 2: anna@example.com / password123');
  console.log('   Instructor: trainer@swim.de / password123\n');

  setTimeout(() => {
    db.close();
    process.exit(0);
  }, 1000);
}

seedDatabase().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
