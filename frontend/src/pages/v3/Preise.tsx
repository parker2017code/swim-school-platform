export default function Preise() {
  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>Unsere Preise</h1>
        <p>Transparente monatliche Abonnements</p>
      </div>

      <div className="alert-info-v3">
        <strong>💡 Hinweis:</strong> Unsere Kurse laufen im 4-Wochen Takt mit monatlichem Abonnement. Der Vertrag verlängert sich automatisch nach 4 Wochen. Sie können jederzeit kündigen.
      </div>

      <h2>Preisübersicht</h2>
      <table className="table-v3">
        <thead>
          <tr>
            <th>Kurs</th>
            <th>Alter/Zielgruppe</th>
            <th>Dauer</th>
            <th>Monatlich</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Wasserflitzer</td>
            <td>Ab ca. 3 Jahren</td>
            <td>30 Min</td>
            <td><strong>€49</strong></td>
          </tr>
          <tr>
            <td>Seepferdchen (30min)</td>
            <td>4-5 Jahre</td>
            <td>30 Min</td>
            <td><strong>€59</strong></td>
          </tr>
          <tr>
            <td>Seepferdchen (40min)</td>
            <td>4-5 Jahre</td>
            <td>40 Min</td>
            <td><strong>€69</strong></td>
          </tr>
          <tr>
            <td>Wasserchampions</td>
            <td>Ab Seepferdchen</td>
            <td>45 Min</td>
            <td><strong>€69</strong></td>
          </tr>
          <tr>
            <td>Schwimmkurse für Anfänger</td>
            <td>Erwachsene</td>
            <td>50 Min</td>
            <td><strong>€59</strong></td>
          </tr>
          <tr>
            <td>Aquafitness</td>
            <td>Alle</td>
            <td>45 Min</td>
            <td><strong>€54</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="alert-success-v3" style={{ marginTop: '2rem' }}>
        <strong>✅ Was ist dabei?</strong>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>4 Stunden Unterricht pro Monat</li>
          <li>Kleine Gruppen mit persönlicher Betreuung</li>
          <li>Professionelle, zertifizierte Trainer</li>
          <li>Keine versteckten Kosten</li>
          <li>Jederzeit kündbar</li>
        </ul>
      </div>
    </div>
  );
}
