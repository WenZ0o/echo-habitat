# ECHO HABITAT – Kurzstart

## Sofort ausprobieren

Öffne den bereitgestellten Website-Link. Du musst dafür nichts installieren.

1. Klicke auf **Moss**, **Lux** oder **Echo** – auf der Karte oder unter dem Habitat.
2. Rechts siehst du Gedanken, Erinnerungen und unter **Connections** die Beziehungen.
3. Unter **A gentle nudge** löst du Regen, einen Fund oder einen Stromausfall aus.
4. **Pause** hält die Simulation an. Das Symbol daneben geht einen Schritt weiter. Mit **1× / 2× / 4×** wechselst du das Tempo.
5. **Chronicle** zeigt die Geschichte. Dein Stand wird auf dem Server gespeichert.
6. Unter **A world they build** siehst du Vorräte, Baufortschritt, den Beitrag jeder Figur und bereits erschlossene Gebiete.
7. **New beginning** startet nach einer Bestätigung eine neue Welt und löscht auch Gebäude und Vorräte.

Die Simulation ist regelbasiert und verwendet geschriebene Dialoge. Sie benötigt keinen KI-Schlüssel. Eine Anbindung an ein Sprachmodell ist noch nicht enthalten. Die Welt entwickelt sich weiter, solange die Seite sichtbar ist und die Simulation läuft. Beim Schließen der Seite stoppt der Ablauf dieses Tabs; weitere offene Tabs können dieselbe Welt weiterbewegen.

## Die drei bauen selbstständig weiter

Moss sammelt Pflanzenmaterial, Lux brauchbare Bauteile und Echo Erkenntnisse. Sobald genügend Material vorhanden ist, beginnen sie gemeinsam das nächste Gebäude. Du musst keine Bauaufträge anklicken.

Die Reihenfolge ist **Garten → Solarterrasse → Aussichtspunkt → Regenfänger → Werkstatt → Brücke**. Die Gebäude verbessern Pflanzenwachstum, Energie oder Materialgewinnung. Die Brücke öffnet ein neues Gebiet, in dem der Kreislauf erneut beginnt. Pausen, Stromausfälle und das Neuladen der Seite löschen den Baufortschritt nicht.

Die Inselgrafik hat drei Ausbaustufen: Ausgangswelt, erste Erweiterung nach dem Aussichtspunkt und ausgebaute Insel nach der Brücke. Weitere Gebiete werden über Bauzahlen und die Gebietsanzeige dargestellt. Die Karte wird nicht unbegrenzt als neue Landschaft gezeichnet.

Bestehende Spielstände aus Version 1 werden übernommen. Erinnerungen, Beziehungen und die bisherige Zeit bleiben erhalten.

## Auf dein GitHub hochladen

1. Lade `echo-habitat-source.zip` herunter und entpacke es. Öffne darin den Ordner `echo-habitat`; dort liegt `package.json`.
2. Öffne [github.com/new](https://github.com/new), wähle dein Konto und den Namen **echo-habitat**. **Public** macht den Code auf deinem Profil sichtbar; **Private** hält ihn privat. Lass das Repository zunächst ohne automatisch erzeugte README, Lizenz oder Gitignore anlegen. Klicke **Create repository**.
3. Klicke **uploading an existing file**. Ziehe zuerst den gesamten Unterordner **components** in die Upload-Fläche. Bestätige mit **Commit changes**.
4. Gehe zur obersten Ebene des Repositorys zurück. Klicke **Add file → Upload files** und lade alle übrigen Dateien und Ordner aus dem entpackten Projekt hoch. **components** diesmal weglassen. Wieder mit **Commit changes** bestätigen.
5. Prüfe, dass `package.json`, `README.md`, `app/`, `components/`, `lib/` und `public/` direkt auf der Startseite des Repositorys stehen. Lade die entpackten Inhalte hoch, nicht nur die ZIP-Datei und nicht einen zusätzlichen äußeren Projektordner.

Die zwei Uploads berücksichtigen GitHubs Grenze von 100 Dateien je Browser-Upload. Nimm auch die Konfigurationsdateien und -ordner mit Punkt am Anfang mit, zum Beispiel `.github`, `.gitignore` und `.npmrc`. Falls dein Dateimanager sie ausblendet, aktiviere dort die Anzeige versteckter Dateien. Der enthaltene Workflow unter `.github/workflows/verify.yml` prüft Tests, TypeScript und Build nach dem Upload.

Quellen: [Neues Repository anlegen](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [Dateien hochladen und Größenlimits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

Der aktuelle Website-Stand wird separat gehostet. Das Hochladen zu GitHub allein stellt die Anwendung mit ihrer Datenbank nicht auf GitHub Pages bereit.

## Auf deinem PC entwickeln

Die genaue Reihenfolge steht in der README unter **Run locally**. Du brauchst Node.js 24 und pnpm 11.25.0. Zuerst werden die Abhängigkeiten installiert, dann wird das Projekt gebaut und einmalig die lokale Datenbank angelegt. Danach startet `pnpm dev` die lokale Anwendung.

Für Änderungen an Aussehen und Texten sind vor allem `components/habitat.tsx`, `components/construction-board.tsx` und `app/globals.css` relevant. Die Entscheidungen der Figuren stehen in `lib/habitat/engine.ts`, ihre Persönlichkeiten in `lib/habitat/residents.ts`. Neue Baupläne, Kosten und Verbesserungen stehen in `lib/habitat/construction.ts`.
