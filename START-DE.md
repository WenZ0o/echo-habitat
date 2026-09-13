# ECHO HABITAT – Kurzstart

## Sofort ausprobieren

Öffne den bereitgestellten Website-Link. Du musst dafür nichts installieren.

1. Klicke auf **Moss**, **Lux** oder **Echo** – auf der Karte oder unter dem Habitat.
2. Rechts siehst du Gedanken, Erinnerungen und unter **Connections** die Beziehungen.
3. Unter **A gentle nudge** löst du Regen, einen Fund oder einen Stromausfall aus.
4. **Pause** hält die Simulation an. Das Symbol daneben geht einen Schritt weiter. Mit **1× / 2× / 4×** wechselst du das Tempo.
5. **Chronicle** zeigt die Geschichte. Dein Stand wird auf dem Server gespeichert. Wenn du später zurückkommst, holt der Server einen begrenzten Teil der verstrichenen Zeit nach und zeigt dir eine Zusammenfassung.
6. Unter **A world they build** siehst du Vorräte, die letzte gemeinsame Abstimmung, Bauphasen, Beiträge und bereits erschlossene Gebiete.
7. Über **Visitor link** kopierst du einen Link mit `?mode=visitor`. Dort kann ein Freund beobachten und Profile/Chronicle öffnen, aber die normalen Änderungs-Buttons werden nicht angeboten.
8. **New beginning** startet nach einer Bestätigung eine neue Welt und löscht auch Gebäude und Vorräte.

Die Simulation ist regelbasiert und verwendet geschriebene Dialoge. Sie benötigt keinen KI-Schlüssel. Eine Anbindung an ein Sprachmodell ist noch nicht enthalten. Während die Besitzerseite offen ist, läuft sie wie bisher. Nach einer Abwesenheit wird beim nächsten Öffnen aus der vergangenen Echtzeit ein begrenzter Offline-Fortschritt berechnet (maximal 96 Zyklen pro Rückkehr).

## Die drei bauen selbstständig weiter

Moss sammelt Pflanzenmaterial, Lux brauchbare Bauteile und Echo Erkenntnisse. Sobald mehrere Pläne bezahlbar sind, treffen sich die drei am Reflection Pool und stimmen ab. Die Entscheidung und jede Stimme werden sichtbar gespeichert. Die Brücke bleibt der letzte Schritt eines Distrikts.

Während des Bauens bewegen sich die Figuren zur Baustelle. Der Marker zeigt den Fortschritt, und das Projekt wechselt sichtbar von **foundation** über **frame** zu **finishing**. Nach einer fertigen Brücke erscheint ein zusätzlicher Inselteil auf der Karte und der nächste Distrikt beginnt. Pausen, Stromausfälle und Neuladen löschen den Baufortschritt nicht.

Bestehende Spielstände aus Version 1 und 2 werden auf Version 3 übernommen. Erinnerungen, Beziehungen und die bisherige Zeit bleiben erhalten.

Hinweis zum Besuchermodus: Er ist für einen normalen geteilten Freundes-Link gedacht und verhindert Änderungen über die Oberfläche. Er ersetzt noch keine echte Anmeldung/Benutzerberechtigung gegen absichtliche Manipulation.

## Auf dein GitHub hochladen

1. Lade `echo-habitat-source.zip` herunter und entpacke es. Öffne darin den Ordner `echo-habitat`; dort liegt `package.json`.
2. Öffne [github.com/new](https://github.com/new), wähle dein Konto und den Namen **echo-habitat**. **Public** macht den Code auf deinem Profil sichtbar; **Private** hält ihn privat. Lass das Repository zunächst ohne automatisch erzeugte README, Lizenz oder Gitignore anlegen. Klicke **Create repository**.
3. Klicke **uploading an existing file**. Ziehe zuerst den gesamten Unterordner **components** in die Upload-Fläche. Bestätige mit **Commit changes**.
4. Gehe zur obersten Ebene des Repositorys zurück. Klicke **Add file → Upload files** und lade alle übrigen Dateien und Ordner aus dem entpackten Projekt hoch. **components** diesmal weglassen. Wieder mit **Commit changes** bestätigen.
5. Prüfe, dass `package.json`, `README.md`, `app/`, `components/`, `lib/` und `public/` direkt auf der Startseite des Repositorys stehen. Lade die entpackten Inhalte hoch, nicht nur die ZIP-Datei und nicht einen zusätzlichen äußeren Projektordner.

Die zwei Uploads berücksichtigen GitHubs Grenze von 100 Dateien je Browser-Upload. Nimm auch die Konfigurationsdateien und -ordner mit Punkt am Anfang mit, zum Beispiel `.github`, `.gitignore` und `.npmrc`. Falls dein Dateimanager sie ausblendet, aktiviere dort die Anzeige versteckter Dateien. Der enthaltene Workflow unter `.github/workflows/verify.yml` prüft Tests, TypeScript und Build nach dem Upload.

Quellen: [Neues Repository anlegen](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [Dateien hochladen und Größenlimits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

GitHub allein veröffentlicht die Anwendung nicht. Für diese Version verwendest du **Vercel**:

1. Importiere das Repository in Vercel. `vercel.json` stellt den Build automatisch auf normales Next.js um.
2. Öffne im Vercel-Projekt **Storage → Create Database → Blob** und wähle **Private**. Dafür ist kein Cloudflare-Konto nötig.
3. Verbinde den Blob Store mit dem Projekt und starte danach einmal **Redeploy**.
4. Deine Vercel-URL ist anschließend die Website. Für einen Freund hängst du `?mode=visitor` an.


## Auf deinem PC entwickeln

Die genaue Reihenfolge steht in der README unter **Run locally**. Du brauchst Node.js 24 und pnpm 11.25.0. Zuerst werden die Abhängigkeiten installiert, dann wird das Projekt gebaut und einmalig die lokale Datenbank angelegt. Danach startet `pnpm dev` die lokale Anwendung.

Für Änderungen an Aussehen und Texten sind vor allem `components/habitat.tsx`, `components/construction-board.tsx` und `app/globals.css` relevant. Die Entscheidungen der Figuren stehen in `lib/habitat/engine.ts`, ihre Persönlichkeiten in `lib/habitat/residents.ts`. Neue Baupläne, Kosten und Verbesserungen stehen in `lib/habitat/construction.ts`.
