# Produkt-Brief: Klausur-Korrektor

## Das Problem
Lehrer:innen verbringen viel Zeit mit der manuellen Korrektur von Klausuren. Die inhaltliche Überprüfung gegen einen Erwartungshorizont ist zeitintensiv und fehleranfällig.

## Die Lösung
Eine Web-App, die Lehrer:innen bei der Klausurkorrektur unterstützt:
1. Erwartungshorizont als PDF hochladen (Musterlösung)
2. Schüler:innen-Klausur als PDF hochladen
3. KI (Claude) vergleicht Klausurtext mit Erwartungshorizont
4. Ergebnis: Annotierter Text im Browser mit Ampelsystem

## Ampelsystem
- Grün = korrekt und vollständig
- Gelb = unvollständig oder unklar
- Rot = falsch oder fehlend

## Zielgruppe
Lehrer:innen aller Schulformen und Fächer

## MVP (Version 1 — für heute)
- Eine Klausur nach der anderen (kein Batch)
- Ergebnis als herunterladbares PDF (farbig annotiert)
- Nur inhaltliche Ampel-Korrektur (Schritt 2)
- Kein Login erforderlich
- Keine Datenspeicherung

## Nicht in Version 1
- Rechtschreibprüfung (Schritt 1)
- Mehrere Klausuren gleichzeitig
- Benutzer-Accounts

## Technischer Stack
- Frontend: Next.js (App-Router) + TailwindCSS
- KI: Claude API (Anthropic)
- Hosting: Vercel
- Keine Datenbank

## Erfolgs-Definition für heute
Die App kann:
1. Lokal auf localhost:3000 gestartet werden
2. Einen Erwartungshorizont-PDF und eine Klausur-PDF entgegennehmen
3. Das Ergebnis farbig annotiert im Browser anzeigen
4. Das korrigierte Ergebnis als PDF herunterladen
5. Live auf Vercel deployt sein (teilbare URL)
