interface Props { onNavigate: (p: string) => void; }
export default function Erwachsenenkurse({ onNavigate }: Props) {
  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>Erwachsenenkurse</h1>
        <p>Schwimmen für Erwachsene - Es ist nie zu spät!</p>
      </div>
      <h2>Wir starten dort, wo ihr steht!</h2>
      <p>Egal, ob ihr zum ersten Mal schwimmen lernen wollt oder eure Technik und Fitness verbessern möchtet – in unseren Kursen für Erwachsene arbeiten wir nach euren Bedürfnissen und Zielen.</p>
      
      <h2>Unsere Kursangebote</h2>
      <div className="card-grid-v3">
        <div className="card-v3">
          <h3>Schwimmkurse für Anfänger</h3>
          <p>Sicherer Umgang im Wasser für absolute Anfänger. In eurem eigenen Tempo und ohne Druck lernt ihr die Grundlagen des Schwimmens.</p>
          <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>Kurs finden</button>
        </div>
        <div className="card-v3">
          <h3>Aquafitness</h3>
          <p>Fitness und Ausdauer im Wasser für alle Altersstufen und Können. Das Wasser trägt euren Körper und schont die Gelenke.</p>
          <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>Kurs finden</button>
        </div>
      </div>
    </div>
  );
}
