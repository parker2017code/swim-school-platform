// @ts-nocheck
export default function CourseDetail({ onNavigate, onAddToCart }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>📖 Kurs Details</h1>
      <p style={{ color: '#9ca3af', marginTop: '1rem' }}>
        Diese Seite wird noch entwickelt. Verwenden Sie die Kursbrowsing-Seite, um einen Kurs auszuwählen.
      </p>
      <button className="btn btn-primary" onClick={() => onNavigate('courses')} style={{ marginTop: '2rem' }}>
        ← Zurück zu Kursen
      </button>
    </div>
  );
}
