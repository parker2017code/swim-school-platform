import { useState } from 'react';

export default function FAQ() {
  const [active, setActive] = useState<number | null>(null);

  const faqs = [
    {
      q: "Warum Next Wave?",
      a: "Wenn ihr auf der Suche nach einem Schwimmkurs seid, dann werdet ihr hier fündig. Wir arbeiten individuell, passend zu den Bedürfnissen jedes Schülers – nicht nach Alter. Unsere erfahrenen Trainer vermitteln Sicherheit, Vertrauen und Spaß im Wasser."
    },
    {
      q: "Ab welchem Alter können Kinder an den Kursen teilnehmen?",
      a: "Unsere Wasserflitzer-Kurse starten in der Regel ab ca. 3 Jahren. Für jüngere Kinder mit Begleitung können wir individuelle Lösungen anbieten."
    },
    {
      q: "Wie laufen die Kurse ab?",
      a: "Unsere Kurse laufen im 4-Wochen Takt. Der Unterricht findet regelmäßig zur gleichen Zeit an einem unserer Standorte statt. Das monatliche Abonnement verlängert sich automatisch nach 4 Wochen."
    },
    {
      q: "Wie kann ich einen Kurs buchen?",
      a: "Klicken Sie auf 'KURS FINDEN', wählen Sie einen Kurs aus und folgen Sie dem Buchungsprozess. Sie müssen sich registrieren und können dann direkt abonnieren."
    },
    {
      q: "Kann ich jederzeit kündigen?",
      a: "Ja! Sie können jederzeit kündigen. Es gibt keine Mindestlaufzeit oder versteckten Gebühren."
    },
    {
      q: "Was ist, wenn ich einen Kurs verpasse?",
      a: "Besprechen Sie das bitte mit uns. Wir versuchen, Lösungen zu finden oder Sie in einen anderen Kurs zu verschieben."
    }
  ];

  return (
    <div className="page-section-v3">
      <div className="page-hero-v3">
        <h1>Häufig gestellte Fragen</h1>
        <p>Hier finden Sie Antworten auf die wichtigsten Fragen</p>
      </div>

      <div className="accordion-v3">
        {faqs.map((faq, i) => (
          <div key={i} className="accordion-item-v3">
            <div
              className={`accordion-header-v3 ${active === i ? 'active' : ''}`}
              onClick={() => setActive(active === i ? null : i)}
            >
              {faq.q}
              <span>{active === i ? '−' : '+'}</span>
            </div>
            {active === i && (
              <div className="accordion-content-v3 active">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
