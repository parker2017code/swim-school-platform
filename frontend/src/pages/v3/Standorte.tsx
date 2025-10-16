export default function Standorte() {
  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>Unsere Standorte</h1>
        <p>Besuchen Sie uns an einem unserer Standorte im Ruhrgebiet</p>
      </div>

      <div className="card-grid-v3">
        <div className="card-v3">
          <h3>📍 Dortmund</h3>
          <p><strong>Radisson Blu Dortmund</strong></p>
          <p>Nähe Westfalenhalle</p>
          <p style={{ marginTop: '1rem', color: '#667eea', fontWeight: 'bold' }}>
            Samstag: 12:00-15:00<br/>
            Sonntag: 12:00-15:00
          </p>
          <p>📞 0172 9831064</p>
        </div>

        <div className="card-v3">
          <h3>📍 Essen</h3>
          <p><strong>Kruppkrankenhaus Essen</strong></p>
          <p>Nähe Messe Essen</p>
          <p style={{ marginTop: '1rem', color: '#667eea', fontWeight: 'bold' }}>
            Dienstag: 18:15-20:30
          </p>
          <p>📞 0172 9831064</p>
        </div>
      </div>
    </div>
  );
}
