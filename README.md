# 🏊 Swim School Booking Platform

A complete, fully functional full-stack booking system for Schwimmschule Next Wave with backend (Node.js/Express), frontend (React), database (SQLite), payments, emails, and admin dashboard.

## Features

✅ **User Authentication**
- Register new customers
- Login with JWT tokens
- Role-based access (admin, customer, instructor)
- Password hashing with bcrypt

✅ **Course Management**
- Browse 5 German swim courses
- View course details, pricing, and availability
- Real-time availability tracking
- Filter by age group and level

✅ **Booking System**
- Book courses with instant confirmation
- Automatic waitlist when course is full
- Auto-promotion from waitlist on cancellations
- Download booking confirmations

✅ **Payment Processing**
- Mock Stripe integration (ready for real Stripe)
- Payment intent creation
- Payment confirmation and receipts
- Payment history tracking

✅ **Waitlist Management**
- Join waitlist for full courses
- View position in queue
- Auto-notification when promoted
- Remove from waitlist

✅ **Email Notifications**
- Welcome emails on registration
- Booking confirmation emails
- Payment receipts
- Waitlist promotion notifications
- Admin notifications

✅ **Admin Dashboard**
- Real-time statistics (revenue, bookings, users)
- Course management
- Booking management
- User management
- Payment tracking
- Waitlist monitoring

✅ **Responsive Design**
- Mobile-friendly interface
- Tablet optimized
- Desktop full-featured
- All in German language

## Demo Credentials

```
Admin Login:
  Email: admin@swim.de
  Password: admin123

Customer 1:
  Email: max@example.com
  Password: password123

Customer 2:
  Email: anna@example.com
  Password: password123

Instructor:
  Email: trainer@swim.de
  Password: password123
```

## Quick Start

### 1. Start Backend Server

```bash
cd backend
npm install
npm run seed        # Populate database with demo data
npm start           # Start server on http://localhost:5000
```

The API will be available at `http://localhost:5000`

### 2. Start Frontend

```bash
cd frontend
npm start           # Start React app on http://localhost:3000
```

The frontend will be available at `http://localhost:3000`

### 3. Test the System

1. Go to http://localhost:3000
2. Login with demo credentials (e.g., max@example.com / password123)
3. Browse courses
4. Book a course
5. View your bookings
6. (Admin) Access admin dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create new booking
- `DELETE /api/bookings/:id` - Cancel booking

### Waitlist
- `GET /api/waitlist` - Get user's waitlist entries
- `DELETE /api/waitlist/:id` - Leave waitlist

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/bookings` - All bookings

## Database

SQLite database with tables:
- **users** - Customers, instructors, admins
- **courses** - Swim courses
- **bookings** - Course bookings
- **payments** - Payment records
- **waitlist** - Waitlist entries

## Technologies Used

### Backend
- Node.js with Express
- SQLite3 database
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

### Frontend
- React with TypeScript
- Axios for API calls
- Tailwind CSS for styling
- React Router for navigation
- React Query for state management

### Integrations
- Mock Stripe (ready for real implementation)
- Email notifications (console logging for demo)
- Calendar event tracking ready

## Project Structure

```
swim-school-platform/
├── backend/
│   ├── server.js          # Express server with all routes
│   ├── seed.js            # Database seeding script
│   ├── swim_school.db     # SQLite database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ...
│   │   └── components/
│   └── package.json
└── README.md
```

## Running Tests

### Test Backend Endpoints

```bash
# Get all courses
curl http://localhost:5000/api/courses

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"max@example.com","password":"password123"}'

# Create booking (requires token)
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"courseId":"course1"}'
```

## Key Features in Action

### Booking Flow
1. Customer logs in
2. Browses courses
3. Books a course
4. Pays with (mock) Stripe
5. Receives confirmation email
6. Sees booking in dashboard

### Waitlist Flow
1. Customer attempts to book full course
2. Auto-added to waitlist with position
3. Receives waitlist confirmation email
4. When someone cancels:
   - Customer auto-promoted to confirmed booking
   - Receives promotion notification email
   - Booking appears in dashboard

### Admin Flow
1. Admin logs in
2. Views real-time dashboard statistics
3. Manages courses and bookings
4. Tracks payments
5. Monitors waitlist
6. Sends communications

## Email Notifications

The system logs emails to console (demo mode). In production, implement:
- Nodemailer for SMTP
- SendGrid API
- AWS SES
- Custom email service

Email types:
- Welcome email on registration
- Booking confirmation with course details
- Payment receipt
- 24-hour reminder before class
- Waitlist promotion notification
- Cancellation confirmation
- Admin alerts

## Payment Processing

Currently uses mock Stripe integration. To enable real payments:

1. Create Stripe account at https://stripe.com
2. Get API keys from dashboard
3. Update backend with real keys
4. Implement Stripe webhook handling
5. Test with Stripe test cards

## Future Enhancements

- [ ] Real Stripe payment processing
- [ ] Email service integration (Nodemailer/SendGrid)
- [ ] Google Calendar sync
- [ ] SMS notifications
- [ ] Instructor portal
- [ ] Class attendance tracking
- [ ] Certificate generation
- [ ] Mobile app (React Native)
- [ ] Video call for remote classes
- [ ] Group booking discounts
- [ ] Package pricing
- [ ] Student progress tracking

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Database errors:**
```bash
# Remove old database
rm backend/swim_school.db

# Re-seed
npm run seed
```

**CORS errors:**
- Ensure backend is running on port 5000
- Frontend axios baseURL is set to http://localhost:5000

## Support

For issues or questions:
1. Check API logs in terminal
2. Review console.log emails in backend terminal
3. Check browser console for frontend errors
4. Verify database with `npm run seed`

## License

MIT

---

**Built with ❤️ for Schwimmschule Next Wave**

🌊 **Ready to make a splash!** 🌊
