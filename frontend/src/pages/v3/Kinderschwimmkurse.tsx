interface Props { onNavigate: (p: string) => void; }
export default function Kinderschwimmkurse({ onNavigate }: Props) {
  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>Kinderschwimmkurse</h1>
        <p>Schwimmen für Kinder - Mit Freude und Sicherheit</p>
      </div>
      <h2>Kinder sind einzigartig – und genauso gestalten wir unsere Schwimmkurse</h2>
      <p>Während das eine Kind bereits mit drei Jahren durchs Becken taucht, benötigt ein anderes Kind mit fünf Jahren noch Zeit, um den Spaß am Schwimmen zu finden. Für uns ist nicht das Alter entscheidend, sondern der individuelle Entwicklungsstand.</p>
      
      <h2>Unsere Kursstufen</h2>
      <div className="card-grid-v3">
        <div className="card-v3">
          <h3>Wasserflitzer</h3>
          <p>Erste spielerische Wassererfahrungen für die Kleinsten (ab ca. 3 Jahren). Wir möchten, dass die Kinder das Wasser kennenlernen, erste Bewegungen erfahren und vor allem: Spaß dabei haben!</p>
          <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>Kurs finden</button>
        </div>
        <div className="card-v3">
          <h3>Seepferdchen</h3>
          <p>Erlernen und Üben der ersten Schwimmtechniken. Nachdem die Kinder bereits erste Wassererfahrungen sammeln konnten, lernen sie im Seepferdchen-Kurs erste Schwimmtechniken.</p>
          <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>Kurs finden</button>
        </div>
        <div className="card-v3">
          <h3>Wasserchampions</h3>
          <p>Für Kinder mit Seepferdchenabzeichen. Im Champions-Kurs geht es um Vertiefung und Verbesserung der Schwimmtechniken und noch mehr Spaß!</p>
          <button className="btn-primary-v3 mt-2" onClick={() => onNavigate('kurs-finden')}>Kurs finden</button>
        </div>
      </div>
    </div>
  );
}
