import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';

interface HomePageProps {
  onNavigate: (page: string) => void;
  user: any;
}

interface Course {
  id: string;
  typeName: string;
  ageGroup: string;
  level: string;
  price: number;
  priceBrutto: number;
  maxStudents: number;
  enrolledCount: number;
}

export default function HomePage({ onNavigate, user }: HomePageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/courses');
      const data = await response.json();
      setCourses(data.slice(0, 6)); // Show only 6 featured courses
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
    setLoading(false);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">🌊 Schwimmschule Next Wave</h1>
          <p className="hero-subtitle">
            Schwimmen lernen mit Freude und Sicherheit
          </p>
          <p className="hero-description">
            Professionelle Schwimmkurse für Kinder und Erwachsene im Ruhrgebiet. Unsere zertifizierten Trainer bieten maßgeschneiderte Kurse für alle Altersgruppen und Fähigkeitsstufen – von den ersten Schwimmversuchen bis zu fortgeschrittenen Techniken.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('courses')}>
              🔍 Kurse Erkunden
            </button>
            {!user && (
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('login')}>
                👤 Jetzt Registrieren
              </button>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-visual">
            🌊💧🏊‍♂️🏊‍♀️
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="features">
        <h2 className="section-title">Warum Schwimmschule Next Wave?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Erfahrene Trainer</h3>
            <p>Unsere zertifizierten Schwimminstruktoren haben jahrelange Erfahrung und sind leidenschaftlich daran interessiert, jedem zu helfen.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Spezialisierte Programme</h3>
            <p>Wir bieten Programme für jede Altersgruppe und jedes Fähigkeitsniveau, vom Anfänger bis zum fortgeschrittenen Schwimmer.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏊‍♀️</div>
            <h3>Kleine Gruppen</h3>
            <p>Mit kleineren Klassen kann unser Trainer jedem Schüler persönliche Aufmerksamkeit und Feedback geben.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Flexible Termine</h3>
            <p>Wir bieten eine Vielzahl von Kurszeiten an, um verschiedenen Zeitplänen und Familien zu entsprechen.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Bestätigung & Zertifikate</h3>
            <p>Nach dem Abschluss erhalten die Schüler ein Zertifikat, das ihren Fortschritt und ihre Erfolge dokumentiert.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Transparente Preise</h3>
            <p>Alle Preise sind klar und transparent. Es gibt keine versteckten Gebühren oder Überraschungen.</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="featured-courses">
        <h2 className="section-title">Beliebte Kurse</h2>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course.id} className="course-card-featured">
                <div className="course-header">
                  <h3>{course.typeName}</h3>
                  <span className="badge badge-primary">{course.level}</span>
                </div>
                <div className="course-body">
                  <p className="course-age"><strong>Altersgruppe:</strong> {course.ageGroup}</p>
                  <p className="course-price">
                    <strong style={{ fontSize: '1.5rem', color: '#667eea' }}>
                      €{course.priceBrutto}
                    </strong>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                      / Kurs
                    </span>
                  </p>
                  <div className="course-availability">
                    <div className="availability-bar">
                      <div
                        className="availability-fill"
                        style={{ width: `${((course.maxStudents - course.enrolledCount) / course.maxStudents) * 100}%` }}
                      ></div>
                    </div>
                    <p className="availability-text">
                      {course.maxStudents - course.enrolledCount} / {course.maxStudents} Plätze frei
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => onNavigate('courses')}
                  style={{ marginTop: '1rem' }}
                >
                  Details Anzeigen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Bereit zu beginnen?</h2>
          <p>Wählen Sie einen Kurs und machen Sie den ersten Schritt zu besseren Schwimmfähigkeiten!</p>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('courses')}>
            ➡️ Zu den Kursen
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Glückliche Schüler</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15+</div>
            <div className="stat-label">Erfahrene Trainer</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Kurse pro Monat</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">95%</div>
            <div className="stat-label">Kundenzufriedenheit</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Häufig Gestellte Fragen</h2>
        <div className="faq-grid">
          <details className="faq-item">
            <summary>Welche Altersgruppen können sich anmelden?</summary>
            <p>Wir bieten Kurse für alle Altersgruppen an, von 3 Jahren bis zu Erwachsenen. Jedes Programm ist auf die spezifischen Anforderungen der Altersgruppe zugeschnitten.</p>
          </details>
          <details className="faq-item">
            <summary>Wie buche ich einen Kurs?</summary>
            <p>Klicken Sie einfach auf „Kurse erkunden", wählen Sie einen Kurs, der Ihnen gefällt, und folgen Sie dem Checkout-Prozess. Es ist schnell, einfach und sicher!</p>
          </details>
          <details className="faq-item">
            <summary>Kann ich einen Kurs stornieren?</summary>
            <p>Ja! Sie können Ihre Buchung bis zu 14 Tage vor dem Kursbeginn kostenlos stornieren. Danach gelten je nach Zeitpunkt unterschiedliche Rückgabebedingungen.</p>
          </details>
          <details className="faq-item">
            <summary>Welche Zahlungsmethoden akzeptieren Sie?</summary>
            <p>Wir akzeptieren Kreditkarten, SEPA-Lastschrift und Banküberweisung. Alle Zahlungen werden über Stripe sicher verarbeitet.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
