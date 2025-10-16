import React from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div>
      <div className="page-hero-v3">
        <h1>🌊 Willkommen bei Schwimmschule Next Wave!</h1>
        <p>Schwimmen lernen mit Freude und Sicherheit</p>
        <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>
          Jetzt einen Kurs finden
        </button>
      </div>

      <div className="page-section-v3">
        <h2>Warum Next Wave?</h2>
        <div className="card-grid-v3">
          <div className="card-v3">
            <h3>👨‍🏫 Individuelle Betreuung</h3>
            <p>Wir unterrichten nach dem individuellen Entwicklungsstand, nicht nach Alter. Jedes Kind lernt in seinem eigenen Tempo.</p>
          </div>
          <div className="card-v3">
            <h3>🎯 Zertifizierte Trainer</h3>
            <p>Unsere Trainer haben Trainerlizenz und jahrelange Erfahrung in Kinderschwimmkursen, Erwachsenenkursen und Aquafitness.</p>
          </div>
          <div className="card-v3">
            <h3>💧 Wassersicherheit</h3>
            <p>Unser Fokus liegt nicht nur auf Technik, sondern auch auf Vertrauen, Sicherheit und Spaß im Wasser.</p>
          </div>
        </div>
      </div>

      <div className="page-section-v3">
        <h2>Unsere Kursangebote</h2>
        <h3>Kinderschwimmkurse</h3>
        <button className="btn-secondary-v3" onClick={() => onNavigate('kinderschwimmkurse')}>
          Mehr erfahren
        </button>

        <h3 style={{ marginTop: '2rem' }}>Erwachsenenkurse</h3>
        <button className="btn-secondary-v3" onClick={() => onNavigate('erwachsenenkurse')}>
          Mehr erfahren
        </button>
      </div>
    </div>
  );
}
