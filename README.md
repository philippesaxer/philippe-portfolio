# Philippe Saxer – Portfolio

Die 3D-Ansicht öffnet sich beim normalen Einstieg und wird separat nachgeladen. Die Leseansicht funktioniert auch ohne JavaScript; direkte Links auf Inhalte öffnen sie unmittelbar. Die semantischen Projektkarten in `index.html` sind die gemeinsame Quelle für Titel, Kategorie, Kurzbeschreibung und Technologien in beiden Ansichten. Die Projektauswahl beruht auf öffentlichen Repositories und der früheren Projektdokumentation; Illustrationen sind als solche gekennzeichnet. Projekterklärungen stehen direkt bei den Karten.

## Lokal starten

```sh
npm install
npm run dev
npm run build
npm run preview
```

Der Build in `dist/` wird über `.github/workflows/deploy.yml` auf GitHub Pages veröffentlicht. `public/CNAME`, `robots.txt` und `sitemap.xml` bleiben im Build erhalten.

## Bedienung

In der 3D-Ansicht wählen die Punkte am rechten Rand den Standort; die Linie zeigt den Fortschritt. Die Schaltfläche auf dem Bildschirm öffnet die Leseansicht; für Tastaturbedienung erscheinen die entsprechenden Aktionen beim Fokussieren. Im Projektnotizbuch kann man blättern und einen Eintrag zur eigenen Projekterklärung öffnen. In der Leseansicht wechselt das Projektkarussell automatisch; Punkte und Pfeile steuern es. Es hält beim Darüberfahren, bei Tastaturfokus oder während einer geöffneten Projekterklärung an. Bei reduzierter Bewegung gibt es keinen automatischen Wechsel. Die Leseansicht und der direkte E-Mail-Link bleiben jederzeit verfügbar. Bei fehlendem JavaScript, WebGL oder einem fehlgeschlagenen 3D-Download bleibt die Leseansicht nutzbar. Bei Kontextverlust bitte die Seite neu laden. Reduzierte Bewegung deaktiviert Kamerafahrten.

## Vor einer Veröffentlichung

- Die unterschiedlichen Schulbezeichnungen BMZ und TBZ / BMS sind nicht belegt und wurden daher vorläufig nicht genannt. Die richtige Bezeichnung ergänzen.
- Persönlichen Beitrag, Zeitraum, Status und Lernerfahrungen für die Projekte anhand eigener Angaben ergänzen; vorhandene Beschreibungen und Links überprüfen.
- Vollständiges Impressum und Datenschutzhinweise, insbesondere Hosting und Verbindungsdaten, mit den tatsächlichen Angaben ergänzen und rechtlich prüfen lassen.
- Es sind keine Analyse- oder Werbedienste und kein Formularversand eingebunden. Falls sich dies ändert, Datenschutz und erforderliche Einwilligungen neu prüfen.
- Nach der Veröffentlichung Canonical-URL, Weiterleitungen, Sitemap, E-Mail und Projektlinks prüfen. Leistung mit echten Nutzungsdaten und auf realen Geräten messen.

Die lokalen WebP-Dateien in `public/project-images/` zeigen vorhandene Projektaufnahmen und -grafiken; die Migros-Prop-Hunt-Illustration ist als solche gekennzeichnet. Die Uhr-Aufnahme zeigt den geprüften Stand der öffentlichen Version. Aktualisierungen erfolgen in der jeweiligen Projektkarte in `index.html`.
