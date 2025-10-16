import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  courseName: string;
  locationName: string;
  city: string;
  dayOfWeek: string;
  timeStart: string;
  timeEnd: string;
  monthlyPrice: number;
  availableSlots: number;
  status: string;
}

interface Props {
  onNavigate: (page: string) => void;
}

export default function Kalender({ onNavigate }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [location, setLocation] = useState('Alle Standorte');
  const [courseType, setCourseType] = useState('Alle Kurse');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchLocations();
    fetchCourseTypes();
    fetchEvents();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/locations');
      const data = await res.json();
      const uniqueCities = Array.from(new Set(data.map((l: any) => l.city))) as string[];
      setLocations(['Alle Standorte', ...uniqueCities]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses');
      const data = await res.json();
      const uniqueTypes = Array.from(new Set(data.map((c: any) => c.typeName))) as string[];
      setCourseTypes(['Alle Kurse', ...uniqueTypes]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (location !== 'Alle Standorte') params.append('location', location);
      if (courseType !== 'Alle Kurse') params.append('courseType', courseType);

      const res = await fetch(
        `http://localhost:5000/api/calendar-events?${params.toString()}`
      );
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [location, courseType]);

  // Group events by day
  const daysOrder: Record<string, number> = {
    Montag: 1,
    Dienstag: 2,
    Mittwoch: 3,
    Donnerstag: 4,
    Freitag: 5,
    Samstag: 6,
    Sonntag: 7
  };

  const groupedEvents = events.reduce((acc, event) => {
    const day = event.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDays = Object.keys(groupedEvents).sort(
    (a, b) => (daysOrder[a] || 0) - (daysOrder[b] || 0)
  );

  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>📅 Unser Kurskalender</h1>
        <p>Alle verfügbaren Kurse auf einen Blick</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="form-group-v3" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>📍 Standort</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="form-control-v3"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group-v3" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>🏊 Kurstyp</label>
          <select
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
            className="form-control-v3"
          >
            {courseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="spinner-v3"></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {sortedDays.map((day) => (
            <div key={day} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.25rem' }}>
                {day}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupedEvents[day].map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      borderLeftColor: '#667eea',
                      borderLeftWidth: '4px'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1f2937' }}>
                      {event.courseName}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      ⏰ {event.timeStart}-{event.timeEnd}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      📍 {event.locationName}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 'bold', color: '#667eea' }}>
                      €{event.monthlyPrice}/Monat
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: event.availableSlots > 0 ? '#d1fae5' : '#fee2e2',
                        color: event.availableSlots > 0 ? '#065f46' : '#991b1b'
                      }}
                    >
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>
              {selectedEvent.courseName}
            </h2>

            <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #667eea' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>📍 Ort:</strong> {selectedEvent.locationName}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>📅 Zeit:</strong> {selectedEvent.dayOfWeek}, {selectedEvent.timeStart} Uhr
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>💶 Preis:</strong> €{selectedEvent.monthlyPrice} / Monat
              </p>
              <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#667eea' }}>
                {selectedEvent.status}
              </p>
            </div>

            <button
              className="btn-primary-v3 btn-block-v3"
              onClick={() => {
                onNavigate('kurs-finden');
                setSelectedEvent(null);
              }}
              disabled={selectedEvent.availableSlots === 0}
              style={{ padding: '0.75rem', marginBottom: '1rem' }}
            >
              {selectedEvent.availableSlots > 0 ? '🛒 Zum Buchen' : '❌ Ausgebucht'}
            </button>

            <button
              className="btn-secondary-v3 btn-block-v3"
              onClick={() => setSelectedEvent(null)}
              style={{ padding: '0.75rem' }}
            >
              ← Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
