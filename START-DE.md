# Update auf Version 0.4

ECHO HABITAT 0.4 — UPDATE FÜR GITHUB / VERCEL

Das Paket enthält nur neue oder geänderte Dateien gegenüber deinem hochgeladenen echo-habitat-main.zip.
Es ist kein vollständiges Projekt: Nichts im bestehenden GitHub-Repository löschen.
Die zusätzliche ChatGPT-Vorschau wird mit diesem Paket nicht veröffentlicht.

1. VERCEL VORBEREITEN
Öffne dein bestehendes Projekt in Vercel und dessen Environment Variables
(gegebenenfalls unter Settings).

Für die Umgebung Production:
- BLOB_READ_WRITE_TOKEN: den vorhandenen Wert beibehalten.
  Er muss weiterhin zu deinem bisherigen privaten Blob-Speicher gehören.
  Keinen neuen Speicher anlegen, sonst erscheint eine neue Welt.
- HABITAT_OWNER_KEY: neu hinzufügen. Verwende einen zufällig erzeugten Schlüssel
  aus deinem Passwortmanager mit mindestens 32 Zeichen (empfohlen: 64).
  Speichere ihn sicher: Damit meldest du dich später als Besitzer an.
- CRON_SECRET: einen ANDEREN zufälligen Schlüssel mit mindestens 32 Zeichen hinzufügen.
  Er schützt den täglichen Hintergrundaufruf.

Schlüssel nur in Vercel hinterlegen, niemals in GitHub oder im Chat veröffentlichen.
Ohne HABITAT_OWNER_KEY bleibt die Seite absichtlich für alle schreibgeschützt.
Ohne CRON_SECRET funktioniert das Nachholen beim Besuch, aber nicht der tägliche Job.
Umgebungsänderungen gelten erst für ein neues Deployment.

2. DATEIEN AUF GITHUB AKTUALISIEREN
- ZIP herunterladen, Rechtsklick > Alle extrahieren.
- Den entpackten Ordner echo-habitat-update öffnen.
- https://github.com/WenZ0o/echo-habitat öffnen.
- Auf der Hauptseite des Repositorys bleiben, nicht in einen Unterordner wechseln.
- Add file > Upload files wählen.
- ALLE Dateien und Unterordner AUS echo-habitat-update in das Uploadfeld ziehen.
  Auch components, app, db, lib, scripts und public gehören dazu!
  Nicht die ZIP selbst und nicht den äußeren Ordner hochladen.
- Warten, bis alle Dateien aufgelistet und die Uploads fertig sind.
- Commit-Nachricht: Update Echo Habitat to 0.4
- Auf main übernehmen, falls erlaubt, und Commit changes anklicken.
  Bei einem geschützten main-Branch einen Branch / Pull Request verwenden.
- Keine bestehenden Ordner vorher löschen. Gleichnamige Dateien werden aktualisiert,
  unveränderte Dateien bleiben erhalten. Versteckte Konfigurationsdateien müssen
  für dieses Update nicht manuell hinzugefügt werden.

Zur Kontrolle müssen die Dateien danach direkt an diesen Stellen liegen:
package.json
components/habitat.tsx
components/world-map.tsx
app/api/access/route.ts
public/world-island.png
NICHT unter einem zusätzlichen Ordner echo-habitat-update/.

3. VERCEL DEPLOYEN
Wenn dein Vercel-Projekt mit diesem GitHub-Repository und main verbunden ist,
stößt die Übernahme auf main normalerweise das neue Deployment an.
In Deployments auf Ready warten.
Falls du die Schlüssel erst danach eingetragen hast: das aktuelle Deployment
über Redeploy erneut bereitstellen.
Framework: Next.js. Node: 24.x. Die Build-Einstellungen stehen in vercel.json.

4. TESTEN
- Deine Vercel-Adresse öffnen und diese Seite einmal mit Strg+F5 neu laden.
- Oben Owner sign-in anklicken und deinen HABITAT_OWNER_KEY eingeben.
- Mit Play die gemeinsame Uhr starten, falls sie pausiert ist.
- Etwa 15 Sekunden warten: Der Zykluszähler sollte steigen.
- Bewohner anklicken, Follow work und die Bezirksnavigation ausprobieren.
- Pausieren hält die Welt für alle an; Play setzt sie für alle fort.
- Visitor link kopiert einen schreibgeschützten Ansichtslink.
  Der Link ändert NICHT die Sichtbarkeit deiner Seite.
- Die Welt holt verstrichene Zeit beim Besuch nach. Der vorbereitete Vercel-Cron
  synchronisiert sie zusätzlich einmal täglich. Es läuft kein dauerhafter KI-Prozess.
- Deine bisherigen Erinnerungen und Gebäude werden beim ersten Laden migriert.
  Die neue gemeinsame Echtzeituhr beginnt bei der Migration.
- New beginning löscht die gemeinsame Welt. Nicht zum Testen anklicken.

Falls nur Visitor mode erscheint und Owner sign-in fehlt:
HABITAT_OWNER_KEY prüfen und danach neu deployen.
Falls die Welt nicht lädt:
Den bestehenden BLOB_READ_WRITE_TOKEN und die private Blob-Verbindung prüfen.

PRIVAT BLEIBEN
Besuchermodus schützt Aktionen, nicht das Lesen.
Vorhandenen Zugriffsschutz der Vercel-Seite beibehalten.
Dieses Paket ändert weder GitHub-Sichtbarkeit noch Vercel Deployment Protection.
Ein privates GitHub-Repository macht eine bereits veröffentlichte Website nicht automatisch privat.

GEPRÜFT
17 automatisierte Tests: Simulation, Migration, gemeinsame Uhr, konkurrierende
Zugriffe, Besitzeranmeldung, Cron-Zugriff und private Blob-Schreibvorgänge.
Zusätzlich Next.js-Produktionsbuild und Trennung von Server-/Browser-Zugangsdaten.
Kein Live-Deployment auf deinem GitHub- oder Vercel-Konto durch ChatGPT.

Offizielle Anleitungen:
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
https://vercel.com/docs/environment-variables/managing-environment-variables
https://vercel.com/docs/cron-jobs/manage-cron-jobs

