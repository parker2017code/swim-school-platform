# 🌊 Schwimmschule Next Wave - Complete Platform Specification

## Business Overview
**Founder:** Hanna (Trainer-Lizenzinhaber)
**Philosophy:** Individual-centered, flexible 4-week courses, no long-term contracts
**Locations:** Dortmund (Radisson Bl) & Essen (Kruppkrankenhaus)
**Tagline:** "Kleine Wellen machen große Schwimmer!"

---

## Locations & Operating Hours

### Dortmund (Nähe Westfalenhalle, Radisson Blu Hotel)
- **Saturday:** 12:00-15:00
- **Sunday:** 12:00-15:00

### Essen (Nähe Messe Essen, Kruppkrankenhaus)
- **Tuesday:** 18:15-20:30

---

## Course Types & Pricing

| Course | Ages | Duration | Max Students | Dortmund | Essen | Location |
|--------|------|----------|--------------|----------|-------|----------|
| **Wasserflitzer** | 3+ | 30min | 6 | €80 | €85 | Both |
| **Seepferdchen (30min)** | 4+ | 30min | 6 | €80 | €85 | Both |
| **Seepferdchen (40min)** | 4+ | 40min | 6 | €94 | €99 | Both |
| **Wasserchampions** | Post-Seepferdchen | 40min | 7 | €94 | €99 | Both |
| **Anfängerkurse Erw.** | Adults | 45min | 8 | €79 | €84 | Both |
| **Aquafitnesskurse** | All | 45min | 10 | €49 | €54 | Both |
| Aqua Dance (80s/90s) | All | 45min | 10 | €49 | €54 | Both |
| Aqua Taylor Swift | All | 45min | 10 | €49 | €54 | Both |
| Aqua Latin Splash | All | 45min | 10 | €49 | €54 | Both |

---

## Business Model Features

### 4-Week Flexible Cycles
- Auto-renewal after each 4-week block
- Cancellation: 2 weeks before month-end (flexible exit)
- No long-term contracts

### Assessment Lessons
- Every student starts with entry assessment
- Trainer evaluates individual level
- Ensures proper group placement

### Group Structure
- **Children courses:** Max 6 per group
- **Adult/Champion courses:** Max 7-10 per group
- **Staffing:** 1 trainer IN water + 1 assistant at poolside

### Badge Tracking
- Seepferdchen certificate
- Bronze badge
- Silver badge
- Custom achievement tracking

---

## System Requirements

### Database Tables Needed
1. **locations** - Dortmund & Essen
2. **instructors** - Trainer profiles
3. **course_types** - Wasserflitzer, Seepferdchen, etc.
4. **courses** - Actual course offerings (location + type + schedule)
5. **groups** - Class groups with max capacity
6. **group_members** - Students assigned to groups
7. **assessments** - Pre-booking evaluations
8. **badges** - Achievement tracking
9. **promo_codes** - Discount codes (10% first-time)
10. **auto_renewals** - Track 4-week renewal cycles
11. **users** - Parents/guardians (already exists)
12. **bookings** - Course enrollments (already exists)

### API Endpoints Needed (Beyond Existing)
- `GET /api/locations` - List locations
- `GET /api/course-types` - List course types
- `GET /api/courses?location=dortmund&type=wasserflitzer` - Filter courses
- `POST /api/assessments` - Schedule assessment lesson
- `POST /api/bookings?autoRenew=true` - Book with auto-renewal
- `PATCH /api/bookings/:id/cancel` - Cancel with 2-week notice
- `GET /api/students/:id/badges` - View achievements
- `POST /api/promo-codes/validate` - Apply discount code
- `GET /api/groups/:id/members` - View group roster

### Frontend Pages Needed
1. **Location Selector** - Choose Dortmund or Essen
2. **Course Catalog** - Filter by location, type, age group
3. **Assessment Booking** - Schedule pre-lesson evaluation
4. **Course Booking** - With auto-renewal toggle
5. **4-Week Management** - View cycles, renewal schedule, cancel with 2-week notice
6. **Instructor Dashboard** - Manage groups, attendance, notes
7. **Parent Portal** - View child progress, badges, schedule
8. **Admin Console** - Manage locations, pricing, instructors, group assignments

---

## Special Features

### Parent/Guardian Features
- Emergency contact storage
- Guardian consent for minors
- Progress tracking
- Badge/certificate downloads
- Notification preferences

### Instructor Features
- Group management (view roster, attendance)
- Student notes & progress tracking
- Badge assignment
- Attendance taking

### Admin Features
- Location & pricing management
- Instructor assignment
- Group creation & capacity management
- Revenue reporting by location
- Discount code creation & tracking
- Auto-renewal cycle management

---

## Contact Information
- **Email:** info@schwimmschule-nextwave.de
- **Phone:** 0172 9831064
- **Contact Form:** Integrated in platform

---

## Implementation Priority

### Phase 1 (CRITICAL - MVP)
- [x] Core authentication & GDPR compliance
- [ ] Multi-location support (Dortmund & Essen)
- [ ] Real course types with location-specific pricing
- [ ] Basic group management (max 6-7 students)
- [ ] Discount code system (10% first-time)

### Phase 2 (IMPORTANT)
- [ ] Assessment lesson scheduling
- [ ] 4-week auto-renewal system
- [ ] 2-week flexible cancellation
- [ ] Badge tracking system
- [ ] Instructor management

### Phase 3 (ENHANCEMENT)
- [ ] Advanced parent portal
- [ ] Attendance tracking
- [ ] Progress reports
- [ ] Mobile app
- [ ] SMS notifications

---

## Status: ✅ Requirements Documented & Approved
Next Step: Implement Phase 1 (Multi-location, course types, pricing, groups, discounts)
