# Philippe Saxer – interaktives Portfolio

Ein prozeduraler Three.js-Arbeitsplatz mit scrollgesteuerter Kamera über GSAP ScrollTrigger. Die Inhalte und Projektlinks stehen zusätzlich als semantisches HTML zur Verfügung. Über «Inhalte lesen» lässt sich eine responsive Textansicht öffnen; ohne JavaScript oder WebGL erscheint sie automatisch.

## Lokal starten

```sh
npm install
npm run dev
```

`npm run build` erstellt die Produktionsfassung in `dist/`; `npm run preview` zeigt sie lokal an.

## Auf GitHub Pages veröffentlichen

In den Repository-Einstellungen unter **Pages → Build and deployment → Source** einmalig **GitHub Actions** auswählen. Danach baut `.github/workflows/deploy.yml` bei jedem Push auf `main` die Website und veröffentlicht den Inhalt von `dist/`. Die eigene Domain `philippesaxer.ch` bleibt in den Pages-Einstellungen und in `public/CNAME` hinterlegt. Die Quelldateien allein dürfen nicht direkt veröffentlicht werden, da der Browser die npm-Abhängigkeiten erst nach dem Vite-Build laden kann.

## Bedienung

Scrollen bewegt die Kamera. Die Tasten auf der 3D-Tastatur zeigen die zugehörigen Projekte, die Pfeile im Notizbuch blättern durch vier Seiten, und das Telefon enthält Kontakt und Datenschutzeinstellungen.

## Suche und Pflege

Die Website enthält eine indexierbare Startseite. `public/robots.txt` und `public/sitemap.xml` werden beim Build unverändert veröffentlicht. Die Projektlinks führen zu bestehenden Seiten auf philippesaxer.ch; sie gehören nicht zu diesem Repository und sind deshalb nicht in dessen Sitemap enthalten. Die Inhalte, Projektangaben, JSON-LD und die 3D-Texte sollten bei Änderungen gemeinsam aktualisiert werden. Die EFZ-Ausbildung ist als angestrebter Abschluss beschrieben, nicht als erworbene Qualifikation.

Nach der Veröffentlichung Canonical-URL, Weiterleitungen, Sitemap und Projektlinks auf dem Zielserver prüfen und die Sitemap in der jeweiligen Suchmaschinen-Konsole einreichen. Rankings, Indexierung und Darstellung in KI-Antworten können nicht garantiert werden. Web-Vitals-Werte müssen mit echten Nutzungsdaten und auf realen Geräten gemessen werden.

## Vor einer Veröffentlichung

- Impressum, Datenschutzhinweise und Nutzungsbedingungen mit den vollständigen, rechtlich passenden Angaben ergänzen und prüfen lassen.
- Kontakt und Newsletter bereiten eine Nachricht im E-Mail-Programm vor; es gibt keinen Versandserver und keine automatische Newsletter-Anmeldung. Ein späteres Backend muss serverseitig validieren und einen echten CSRF-Schutz bereitstellen.
- Optionale Integrationen ausschliesslich über den Consent-Manager in `scene.js` registrieren und ihre Datenverarbeitung in der Datenschutzerklärung beschreiben.
- Die Projektlinks und die E-Mail-Adresse verweisen auf die zum Erstellungszeitpunkt öffentlich zugängliche Website von Philippe Saxer.
