import React, { useState } from 'react';

interface LegalPageProps {
  onNavigate: (page: string) => void;
  pageType: 'agb' | 'privacy' | 'impressum';
}

export default function LegalPages({ onNavigate, pageType }: LegalPageProps) {
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    heading: {
      fontSize: '2rem',
      color: '#1f2937',
      marginBottom: '2rem',
      borderBottom: '3px solid #667eea',
      paddingBottom: '1rem'
    },
    section: {
      marginBottom: '2rem',
      lineHeight: '1.8',
      color: '#4b5563'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '1rem',
      marginTop: '1.5rem'
    },
    button: {
      marginTop: '2rem',
      padding: '0.75rem 1.5rem',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold'
    }
  };

  const renderAGB = () => (
    <>
      <h1 style={styles.heading}>Allgemeine Geschäftsbedingungen (AGB)</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Geltungsbereich</h2>
        <p>
          Diese AGB gelten für die Buchung und Durchführung von Schwimmkursen der Schwimmschule Next Wave im Ruhrgebiet.
          Mit der Anmeldung zu einem Kurs akzeptieren Sie diese Bedingungen.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Anmeldung und Vertragsschluss</h2>
        <p>
          Die Anmeldung zu einem Kurs erfolgt über unsere Webseite oder persönlich. Der Vertrag kommt durch die Bestätigung
          der Buchung zustande. Eine schriftliche Bestätigung wird per E-Mail versendet.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>3. Preise und Zahlungsbedingungen</h2>
        <p>
          Die auf der Webseite angezeigten Preise sind Bruttopreise inklusive Mehrwertsteuer. Die Zahlung erfolgt per SEPA-Lastschrift,
          Banküberweisung oder Kreditkarte. Die Rechnung wird mit Buchungsbestätigung versendet.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>4. Stornung und Rückgabe</h2>
        <p>
          <strong>Kostenfreie Stornierung:</strong> Bis 14 Tage vor Kursbeginn können Sie kostenfrei stornieren.<br/>
          <strong>Teilweise kostenpflichtig:</strong> 7-14 Tage vor Kursbeginn behalten wir 50% der Kursgebühr ein.<br/>
          <strong>Kostenpflichtig:</strong> Weniger als 7 Tage vor Kursbeginn behalten wir 100% der Kursgebühr ein.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>5. Haftung und Versicherung</h2>
        <p>
          Schwimmschule Next Wave ist nicht haftbar für persönliche Gegenstände. Wir empfehlen den Abschluss einer
          Unfallversicherung. Die Teilnahme erfolgt auf eigenes Risiko.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>6. Änderungen und Ausfälle</h2>
        <p>
          Wir behalten uns vor, Kurszeiten zu verschieben oder Kurse abzusagen, wenn die erforderliche Teilnehmerzahl nicht erreicht wird.
          In diesem Fall erfolgt eine Rückerstattung oder Umbuchung auf einen anderen Kurs.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>7. Verhaltensrichtlinien</h2>
        <p>
          Alle Teilnehmer müssen die Hausregeln befolgen. Störendes Verhalten kann zum Ausschluss aus dem Kurs führen.
          In diesem Fall findet keine Erstattung statt.
        </p>
      </div>
    </>
  );

  const renderPrivacy = () => (
    <>
      <h1 style={styles.heading}>Datenschutzerklärung</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Verantwortlicher für Datenverarbeitung</h2>
        <p>
          Schwimmschule Next Wave<br/>
          Ruhrgebiet, Deutschland<br/>
          Die Datenschutzerklärung gilt für die Verarbeitung personenbezogener Daten durch unsere Schwimmschule.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Erhobene Daten</h2>
        <p>
          Bei der Anmeldung erheben wir: Name, E-Mail-Adresse, Telefonnummer, Notfalltelefonn, Alter der Teilnehmer (bei Kindern),
          und bei Bedarf Bankdaten für Zahlungen. Diese Daten werden nur für die Kursverwaltung verwendet.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>3. Zweck der Verarbeitung</h2>
        <p>
          Ihre Daten werden verarbeitet für:<br/>
          • Vertragsverwaltung und Kursorganisation<br/>
          • Zahlungsabwicklung<br/>
          • Kommunikation über Kursinformationen<br/>
          • Notfallkontakte
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>4. Rechtliche Grundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Basis des Vertrags (DSGVO Art. 6 Abs. 1 Buchstabe b) und mit Ihrer Einwilligung (DSGVO Art. 6 Abs. 1 Buchstabe a).
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>5. Speicherdauer</h2>
        <p>
          Ihre Daten werden für die Dauer des Vertrags und darüber hinaus gemäß gesetzlicher Aufbewahrungspflichten (7 Jahre für Geschäftsunterlagen) gespeichert.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>6. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf:<br/>
          • Auskunft über Ihre Daten<br/>
          • Berichtigung unrichtiger Daten<br/>
          • Löschung Ihrer Daten<br/>
          • Widerspruch gegen die Verarbeitung<br/>
          • Datenportabilität<br/><br/>
          Kontaktieren Sie uns unter: datenschutz@schwimmschule-nextwave.de
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>7. Cookies und Tracking</h2>
        <p>
          Unsere Webseite verwendet nur technisch notwendige Cookies. Keine Tracking- oder Werbe-Cookies werden eingesetzt.
        </p>
      </div>
    </>
  );

  const renderImpressum = () => (
    <>
      <h1 style={styles.heading}>Impressum</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Anbieter</h2>
        <p>
          Schwimmschule Next Wave<br/>
          Ruhrgebiet, Deutschland
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Standorte</h2>
        <p>
          <strong>Dortmund-Mitte:</strong><br/>
          Schwimmzentrum Dortmund-Mitte<br/>
          Kasernenstraße 45, 44147 Dortmund<br/>
          Tel: +49 (0)231 123-4567<br/><br/>

          <strong>Essen (Grugabad):</strong><br/>
          Grugabad Essen<br/>
          Virchowstraße 167, 45147 Essen<br/>
          Tel: +49 (0)201 456-7890<br/><br/>

          <strong>Bochum:</strong><br/>
          Hallenbad Bochum<br/>
          Universitätsstraße 101, 44799 Bochum<br/>
          Tel: +49 (0)234 789-0123
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Kontakt</h2>
        <p>
          E-Mail: info@schwimmschule-nextwave.de<br/>
          Web: www.schwimmschule-nextwave.de<br/>
          Telefon: +49 (0)231 123-4567
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Geschäftsführung</h2>
        <p>
          Vertreten durch: Schwimmschule Next Wave GmbH
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser Webseite werden mit größter Sorgfalt erstellt. Wir übernehmen jedoch keine Haftung für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte. Für externe Links sind wir nicht verantwortlich.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Bildrechte</h2>
        <p>
          Alle auf dieser Webseite verwendeten Bilder und Grafiken sind Eigentum von Schwimmschule Next Wave oder lizenziert.
          Eine Vervielfältigung ohne Zustimmung ist nicht gestattet.
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Gültig seit</h2>
        <p>
          Oktober 2025
        </p>
      </div>
    </>
  );

  const getTitle = () => {
    switch (pageType) {
      case 'agb':
        return 'AGB';
      case 'privacy':
        return 'Datenschutz';
      case 'impressum':
        return 'Impressum';
      default:
        return 'Rechtliche Informationen';
    }
  };

  return (
    <div style={styles.container}>
      {pageType === 'agb' && renderAGB()}
      {pageType === 'privacy' && renderPrivacy()}
      {pageType === 'impressum' && renderImpressum()}

      <button style={styles.button} onClick={() => onNavigate('home')}>
        ← Zur Startseite
      </button>
    </div>
  );
}
