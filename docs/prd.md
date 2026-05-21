# PRD: Klausur-Korrektor
**Version:** 1.0 — MVP  
**Datum:** 2026-05-21  
**Status:** Freigegeben zur Umsetzung

---

## 1. Produktübersicht

### Was ist der Klausur-Korrektor?

Der Klausur-Korrektor ist eine Web-App, die Lehrer:innen bei der inhaltlichen Korrektur von Klausuren unterstützt. Die Lehrperson lädt zwei PDFs hoch — den Erwartungshorizont (Musterlösung) und die Schüler-Klausur — und bekommt in Sekunden eine farblich annotierte Auswertung im Browser angezeigt.

### Für wen?

Lehrer:innen aller Schulformen und Fächer, die Klausuren mit einem vorhandenen Erwartungshorizont korrigieren.

### Problem

Die manuelle inhaltliche Überprüfung einer Schülerklausur gegen einen Erwartungshorizont ist zeitaufwändig und fehleranfällig. Lehrkräfte müssen ständig zwischen Musterlösung und Schülerantwort hin- und herspringen.

### Lösung

Eine KI (Claude von Anthropic) übernimmt den Vergleich automatisch und markiert jede Textstelle im Ampelsystem: Grün (korrekt), Gelb (unvollständig), Rot (falsch/fehlend). Die Lehrperson kann das Ergebnis als farbig annotiertes PDF herunterladen — ohne Login, ohne Installation.

---

## 2. User Story

**Als Lehrerin**  
möchte ich meinen Erwartungshorizont und die Klausur eines Schülers als PDF hochladen,  
damit ich sofort eine farblich annotierte Übersicht bekomme, die mir zeigt welche Antworten korrekt, unvollständig oder falsch sind —  
**ohne** selbst jede Zeile manuell mit der Musterlösung vergleichen zu müssen.

---

## 3. Funktionale Anforderungen

### 3.1 Upload-Formular (Startseite)

- Die App zeigt beim Aufruf ein Formular mit genau zwei Upload-Feldern:
  - Feld 1: "Erwartungshorizont (PDF)"
  - Feld 2: "Schüler-Klausur (PDF)"
- Beide Felder sind Pflichtfelder — das Formular kann nicht abgeschickt werden, wenn eines leer ist
- Akzeptierte Dateiformate: ausschliesslich PDF (.pdf)
- Maximale Dateigrösse je PDF: 10 MB
- Ein "Analysieren"-Button löst den Upload und die Analyse aus

### 3.2 Ladeanzeige

- Nach dem Abschicken des Formulars wird eine Ladeanzeige eingeblendet
- Die Ladeanzeige zeigt den Text "KI analysiert deine Klausur..." (oder ähnlich)
- Das Formular ist während der Analyse nicht bedienbar (kein doppeltes Abschicken)
- Die Ladeanzeige bleibt sichtbar bis das Ergebnis vollständig vorliegt

### 3.3 KI-Analyse (Backend / API Route)

- Der Text aus dem Erwartungshorizont-PDF wird serverseitig extrahiert
- Der Text aus der Schüler-Klausur-PDF wird serverseitig extrahiert
- Beide Texte werden als Kontext an die Claude API übergeben
- Claude analysiert den Klausurtext satz- oder absatzweise gegen den Erwartungshorizont
- Claude gibt eine strukturierte Antwort zurück: für jede Textstelle eine Bewertung (grün / gelb / rot) sowie eine kurze Erklärung (1-2 Sätze), warum diese Bewertung vergeben wurde

### 3.4 Ampelsystem

| Farbe | Bedeutung | Kriterium |
|-------|-----------|-----------|
| Grün  | Korrekt und vollständig | Inhalt stimmt mit Erwartungshorizont überein |
| Gelb  | Unvollständig, unklar oder teilweise richtig | Inhalt ist teilweise vorhanden, aber nicht vollständig oder unpräzise |
| Rot   | Falsch, fehlend oder widerspricht dem Erwartungshorizont | Inhalt fehlt oder ist inhaltlich falsch |

### 3.5 Ergebnis-Seite

- Die Ergebnis-Seite zeigt den Klausurtext des Schülers vollständig an
- Jede Textstelle (Satz oder Absatz) ist farbig hinterlegt entsprechend der Ampel-Bewertung:
  - Grün = grüne Hinterlegung / Markierung
  - Gelb = gelbe Hinterlegung / Markierung
  - Rot = rote Hinterlegung / Markierung
- Bei jeder Markierung ist eine kurze Erklärung sichtbar (als Text direkt darunter oder als Tooltip)
- Ein "PDF herunterladen"-Button erzeugt ein farbig annotiertes PDF des Ergebnisses (gleiche Farben wie im Browser)
- Die Ergebnis-Seite hat einen "Neue Klausur analysieren"-Button, der zurück zum Upload-Formular führt

### 3.6 Fehlerbehandlung

- Wenn eine hochgeladene Datei kein gültiges PDF ist: Fehlermeldung im Formular anzeigen
- Wenn die Claude API nicht antwortet oder einen Fehler zurückgibt: verständliche Fehlermeldung anzeigen ("Analyse fehlgeschlagen, bitte versuche es erneut")
- Wenn ein PDF keinen extrahierbaren Text enthält (z.B. gescanntes Bild ohne OCR): Hinweismeldung anzeigen ("PDF enthält keinen lesbaren Text")

---

## 4. Nicht-funktionale Anforderungen

### 4.1 Performance

- Die Analyse soll in der Regel innerhalb von 30 Sekunden abgeschlossen sein (abhängig von PDF-Länge und Claude API Response Time)
- Die App soll bei einer einzelnen Anfrage stabil funktionieren (kein Concurrent-Load-Test erforderlich für MVP)

### 4.2 Sicherheit

- PDFs werden ausschliesslich im Arbeitsspeicher verarbeitet — keine Speicherung auf dem Server oder in einer Datenbank
- Keine personenbezogenen Daten werden persistiert (DSGVO-konform by design)
- API-Keys (Claude API Key) werden ausschliesslich als Server-Side Environment Variables gespeichert, niemals im Frontend-Code

### 4.3 UX / Usability

- Die App muss ohne Einweisung bedienbar sein — keine Dokumentation oder Anleitung nötig
- Klare, deutschsprachige Beschriftungen und Fehlermeldungen
- Mobile-Ansicht ist kein Ziel für MVP (Desktop-Browser reicht)
- Barrierefreiheit: kein explizites Ziel für MVP, aber keine unnötigen Barrieren einbauen

---

## 5. Technische Constraints

| Constraint | Detail |
|------------|--------|
| Frontend-Framework | Next.js mit App Router |
| Styling | TailwindCSS |
| KI-Provider | Claude API (Anthropic) |
| Hosting | Vercel |
| Datenbank | Keine — kein persistenter State |
| Authentifizierung | Keine — kein Login, keine User-Accounts |
| Session-Handling | Keine — jede Anfrage ist zustandslos |
| Parallelverarbeitung | Keine — eine Klausur nach der anderen |
| PDF-Text-Extraktion | Serverseitig (API Route in Next.js), nicht im Browser |
| Umgebungsvariablen | ANTHROPIC_API_KEY als Vercel Environment Variable |

---

## 6. Out of Scope (Version 1)

Folgendes ist explizit **nicht** Teil des MVP und wird nicht gebaut:

- Rechtschreibprüfung oder Grammatikkorrektur
- Batch-Verarbeitung (mehrere Klausuren gleichzeitig)
- Benutzer-Accounts, Login oder Authentifizierung
- Speicherung von Klausuren oder Ergebnissen
- Punktevergabe oder Benotung
- Vergleich mehrerer Schülerantworten untereinander
- Unterstützung für andere Dateiformate als PDF (Word, Bild, etc.)
- OCR für gescannte PDFs ohne eingebetteten Text
- E-Mail-Versand des Ergebnisses
- Mehrsprachigkeit (nur Deutsch im MVP)

---

## 7. Epics & MVP-Scope

### Epic 1: Projekt-Setup & Grundstruktur
Aufsetzen des Next.js-Projekts mit TailwindCSS, Vercel-Deployment-Pipeline und Umgebungsvariablen-Konfiguration.

**Enthält:**
- Next.js App mit App Router initialisieren
- TailwindCSS einrichten
- Vercel-Projekt anlegen und mit Repository verbinden
- ANTHROPIC_API_KEY als Environment Variable hinterlegen
- Basis-Routing: `/` (Upload) und `/result` (Ergebnis)

### Epic 2: Upload-Formular & PDF-Verarbeitung
Das Herzstück der Daten-Eingabe: Zwei PDFs entgegennehmen, Text extrahieren, an die API übergeben.

**Enthält:**
- Upload-Formular mit zwei PDF-Feldern (Client-Komponente)
- API Route `/api/analyze` (serverseitig)
- PDF-Text-Extraktion aus beiden Dateien (serverseitig)
- Validierung: nur PDF, max. 10 MB, beide Felder Pflicht
- Ladeanzeige während der Verarbeitung

### Epic 3: Claude-Integration & Ampel-Logik
Die KI-Analyse — Kernfunktion der App.

**Enthält:**
- Prompt-Engineering: System-Prompt + User-Prompt mit beiden PDF-Texten
- Strukturierte Ausgabe von Claude: Array von Textstellen mit Bewertung (grün/gelb/rot) und Erklärung
- Fehlerbehandlung für API-Fehler und unlesbare PDFs
- Response-Parsing und Weitergabe an das Frontend

### Epic 4: Ergebnis-Anzeige & PDF-Export
Die Ausgabe für die Lehrperson — das sichtbare Ergebnis der Analyse und der PDF-Download.

**Enthält:**
- Ergebnis-Seite mit annotiertem Klausurtext im Browser
- Farbige Hinterlegung je Textstelle (Grün / Gelb / Rot via TailwindCSS)
- Kurze Erklärung je Markierung (Tooltip oder Inline-Text)
- "PDF herunterladen"-Button — generiert ein farbig annotiertes PDF des Ergebnisses
- "Neue Klausur analysieren"-Button
- Responsive Darstellung für Desktop

---

## 8. Erfolgs-Kriterien

Die App gilt für den heutigen Tag als **fertig**, wenn folgende Kriterien erfüllt sind:

| # | Kriterium | Prüfmethode |
|---|-----------|-------------|
| 1 | App startet lokal auf `localhost:3000` ohne Fehler | Manueller Test: `npm run dev` starten |
| 2 | Upload-Formular nimmt zwei PDFs entgegen | Manueller Test: zwei Test-PDFs hochladen |
| 3 | Klausurtext wird farbig annotiert im Browser angezeigt | Manueller Test: Ergebnis-Seite prüfen |
| 4 | Ampel-Markierungen sind nachvollziehbar (Grün = richtig, Rot = falsch) | Inhaltlicher Test mit bekanntem Erwartungshorizont |
| 4b | "PDF herunterladen"-Button erzeugt ein herunterladbares, farbig annotiertes PDF | Manueller Test: PDF öffnen und Markierungen prüfen |
| 5 | App ist live auf Vercel deployt und unter einer öffentlichen URL erreichbar | Vercel Dashboard prüfen, URL im Browser öffnen |
| 6 | Kein API-Key ist im Frontend-Code sichtbar | Code-Review: nur `process.env` auf Server-Side |

---

*Erstellt von John (BMAD Product Manager) — 2026-05-21*
