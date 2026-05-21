# Epics & Stories: Klausur-Korrektor

**Version:** 1.0
**Datum:** 2026-05-21
**Projekt:** Klausur-Korrektor — MVP

---

## Epic 1: Projekt-Setup

**Ziel:** Lauffähiges Next.js-Projekt, lokal startbar, auf GitHub, mit Vercel verbunden und API-Key sicher hinterlegt.

---

### Story 1.1: Next.js + TailwindCSS initialisieren

**Als** Entwicklerin
**möchte ich** ein neues Next.js-Projekt mit TailwindCSS in `~/ai-ready-day/projects/klausur-korrektor/` erstellen
**damit** ich eine saubere, lauffähige Basis für alle weiteren Stories habe.

**Akzeptanzkriterien:**
- [ ] `npx create-next-app@latest` ausgeführt im Ordner `~/ai-ready-day/projects/klausur-korrektor/`, TypeScript und App Router aktiviert, alle sinnvollen Defaults übernommen
- [ ] Projekt startet mit `npm run dev` auf `localhost:3000` ohne Fehler
- [ ] TailwindCSS ist eingebunden und funktioniert (eine grüne Test-Klasse wie `bg-green-200` ist sichtbar)
- [ ] `.env.local` angelegt mit `ANTHROPIC_API_KEY=` (Platzhalter, leer lassen)
- [ ] `.env.example` angelegt mit `ANTHROPIC_API_KEY=` (wird in Git eingecheckt)
- [ ] `.env.local` ist in `.gitignore` eingetragen

**Technische Hinweise (aus Architecture Doc):**
- Framework: Next.js >= 14 mit App Router
- Styling: TailwindCSS mit `postcss` und `autoprefixer`
- Ordnerstruktur wie in Architecture Doc Abschnitt 1 beschrieben anlegen

---

### Story 1.2: GitHub Repo erstellen + Vercel verbinden

**Als** Entwicklerin
**möchte ich** das lokale Projekt auf GitHub pushen und mit Vercel verbinden
**damit** die App automatisch deployt wird und der `ANTHROPIC_API_KEY` sicher als Server-Umgebungsvariable verfügbar ist.

**Akzeptanzkriterien:**
- [ ] Neues GitHub-Repository `klausur-korrektor` angelegt und lokales Projekt gepusht (`git init`, `git add .`, `git commit`, `git push`)
- [ ] `.env.local` ist NICHT auf GitHub sichtbar (`.gitignore` prüfen)
- [ ] Vercel-Projekt angelegt und mit dem GitHub-Repo verbunden (Framework: Next.js wird automatisch erkannt)
- [ ] `ANTHROPIC_API_KEY` als Environment Variable in Vercel hinterlegt (Settings → Environment Variables, alle drei Environments: Production, Preview, Development)
- [ ] Erstes automatisches Deployment erfolgreich — App ist unter einer öffentlichen Vercel-URL erreichbar

**Technische Hinweise (aus Architecture Doc):**
- Deployment-Schritte: Architecture Doc Abschnitt 7
- API-Key-Quelle: https://console.anthropic.com → Settings → API Keys

---

## Epic 2: Upload-Formular & PDF-Verarbeitung

**Ziel:** Die Lehrerin kann zwei PDFs hochladen. Der Text wird serverseitig extrahiert und steht für die Claude-Analyse bereit.

---

### Story 2.1: Upload-Formular (Komponente `UploadForm.tsx`)

**Als** Lehrerin
**möchte ich** auf der Startseite ein Formular mit zwei PDF-Upload-Feldern sehen
**damit** ich meinen Erwartungshorizont und die Schüler-Klausur hochladen kann.

**Akzeptanzkriterien:**
- [ ] Komponente `components/UploadForm.tsx` erstellt als Client-Komponente (`"use client"`)
- [ ] Formular zeigt zwei Datei-Felder: "Erwartungshorizont (PDF)" und "Schüler-Klausur (PDF)", beide als Pflichtfeld mit `accept="application/pdf"`
- [ ] Clientseitige Validierung: beide Felder müssen ausgefüllt sein, Dateityp muss PDF sein, Dateigrösse max. 10 MB — bei Fehler wird eine deutschsprachige Fehlermeldung im Formular angezeigt
- [ ] "Analysieren"-Button vorhanden, wird während laufender Analyse deaktiviert
- [ ] Komponente ist in `app/page.tsx` eingebunden und auf `localhost:3000` sichtbar

**Technische Hinweise (aus Architecture Doc):**
- Komponenten-Details: Architecture Doc Abschnitt 5.1
- State für Dateien, Lade-Zustand und Fehlermeldungen in React-State halten
- Bei Erfolg: Annotations in `sessionStorage` ablegen, dann mit `router.push("/results")` weiterleiten

---

### Story 2.2: API-Route `/api/analyze` — PDF-Text-Extraktion

**Als** Entwicklerin
**möchte ich** eine API-Route bauen, die zwei PDF-Dateien entgegennimmt und deren Text extrahiert
**damit** der Klausur- und Erwartungshorizont-Text für die Claude-Analyse bereitsteht.

**Akzeptanzkriterien:**
- [ ] Datei `app/api/analyze/route.ts` erstellt, nimmt `POST`-Requests mit `multipart/form-data` entgegen (Felder: `erwartungshorizont`, `klausur`)
- [ ] Hilfsfunktion in `lib/pdf.ts` mit `pdf-parse` extrahiert den Text aus beiden PDFs serverseitig
- [ ] Paket `pdf-parse` und `@types/pdf-parse` via `npm install` installiert
- [ ] Route gibt bei Erfolg ein JSON mit dem extrahierten Text zurück (Zwischenschritt — noch ohne Claude-Aufruf)
- [ ] Route gibt bei ungültigem Request einen HTTP 400 mit deutschsprachiger Fehlermeldung zurück

**Technische Hinweise (aus Architecture Doc):**
- API-Design: Architecture Doc Abschnitt 3 (POST `/api/analyze`)
- PDF-Parsing: `lib/pdf.ts` mit `pdf-parse`
- PDFs werden NIE auf dem Server gespeichert — nur im Arbeitsspeicher verarbeiten

---

### Story 2.3: Ladeanzeige während der Verarbeitung

**Als** Lehrerin
**möchte ich** nach dem Klick auf "Analysieren" eine Ladeanzeige sehen
**damit** ich weiss, dass die KI arbeitet und ich warten soll.

**Akzeptanzkriterien:**
- [ ] Während des API-Calls zeigt `UploadForm.tsx` eine Ladeanzeige mit dem Text "KI analysiert deine Klausur..." (oder ähnlich auf Deutsch)
- [ ] Das Formular ist während der Analyse nicht bedienbar (Button deaktiviert, Felder nicht veränderbar)
- [ ] Die Ladeanzeige verschwindet sobald das Ergebnis vorliegt oder ein Fehler auftritt
- [ ] Kein doppeltes Abschicken möglich (Button bleibt deaktiviert bis Antwort da)

**Technische Hinweise (aus Architecture Doc):**
- Lade-State bereits in Story 2.1 vorbereitet — hier sichtbar machen
- PRD Abschnitt 3.2 für genaue UX-Anforderungen

---

## Epic 3: Claude-Integration & Ampel-Logik

**Ziel:** Die extrahierten PDF-Texte werden an Claude übergeben. Claude liefert ein strukturiertes JSON-Array mit Bewertungen zurück. Fehler werden sauber abgefangen.

---

### Story 3.1: Claude API Wrapper (`lib/claude.ts`)

**Als** Entwicklerin
**möchte ich** einen wiederverwendbaren Wrapper für Claude-API-Aufrufe bauen
**damit** ich den System-Prompt, User-Prompt und das erwartete Output-Format zentral definiert habe.

**Akzeptanzkriterien:**
- [ ] Datei `lib/claude.ts` erstellt mit einer Funktion `analyzeKlausur(erwartungshorizontText: string, klausurText: string): Promise<Annotation[]>`
- [ ] Paket `@anthropic-ai/sdk` via `npm install` installiert
- [ ] System-Prompt exakt wie in Architecture Doc Abschnitt 4 implementiert (Rolle, Ampelsystem, JSON-only-Anweisung)
- [ ] User-Prompt mit `{erwartungshorizont_text}` und `{klausur_text}` wie in Architecture Doc Abschnitt 4 implementiert
- [ ] `max_tokens` auf 8000 gesetzt, Modell: `claude-sonnet-4-6`
- [ ] TypeScript-Typ `Annotation` (mit Feldern `text`, `bewertung`, `erklaerung`) in `lib/types.ts` definiert

**Technische Hinweise (aus Architecture Doc):**
- Prompt-Design: Architecture Doc Abschnitt 4 (vollständig übernehmen)
- `ANTHROPIC_API_KEY` wird ausschliesslich aus `process.env.ANTHROPIC_API_KEY` gelesen — niemals hardcoded
- Kein Streaming — auf vollständige Antwort warten

---

### Story 3.2: API-Route `/api/analyze` — Claude-Integration

**Als** Entwicklerin
**möchte ich** die API-Route aus Story 2.2 um den Claude-Aufruf erweitern
**damit** die Route aus zwei PDFs ein vollständiges Annotations-Array zurückgibt.

**Akzeptanzkriterien:**
- [ ] `app/api/analyze/route.ts` ruft nach der PDF-Text-Extraktion den Claude-Wrapper aus `lib/claude.ts` auf
- [ ] Die Route gibt bei Erfolg HTTP 200 mit dem Response-Format aus Architecture Doc Abschnitt 3 zurück: `{ "success": true, "annotations": [...] }`
- [ ] JSON-Parsing der Claude-Antwort in einer `try/catch`-Klammer — falls Claude Text drumherum schreibt, wird mit Regex `/\[[\s\S]*\]/` der JSON-Block extrahiert
- [ ] Jede Annotation wird auf Vollständigkeit geprüft (Felder `text`, `bewertung`, `erklaerung` vorhanden; `bewertung` ist einer von: `gruen`, `gelb`, `rot`) — andernfalls HTTP 500

**Technische Hinweise (aus Architecture Doc):**
- Response-Format: Architecture Doc Abschnitt 3
- Robustheit des JSON-Parsings: Architecture Doc Abschnitt 4 (Robustheit)

---

### Story 3.3: Fehlerbehandlung (leere PDFs, API-Fehler, JSON-Parse-Fehler)

**Als** Lehrerin
**möchte ich** verständliche Fehlermeldungen sehen wenn etwas schief geht
**damit** ich weiss was ich tun soll statt vor einem leeren Bildschirm zu sitzen.

**Akzeptanzkriterien:**
- [ ] Wenn ein PDF keinen extrahierbaren Text enthält: HTTP 400 mit Meldung "PDF enthält keinen lesbaren Text" — im Browser im Formular sichtbar angezeigt
- [ ] Wenn die Claude API nicht antwortet oder einen Fehler zurückgibt: HTTP 500 mit Meldung "Analyse fehlgeschlagen, bitte versuche es erneut" — im Browser angezeigt
- [ ] Wenn Claude-Antwort kein gültiges JSON-Array ist: HTTP 500 mit sprechender Fehlermeldung
- [ ] Wenn eine hochgeladene Datei kein PDF ist (clientseitig nicht abgefangen): HTTP 400 mit Meldung "Bitte nur PDF-Dateien hochladen"
- [ ] Alle Fehlermeldungen sind auf Deutsch

**Technische Hinweise (aus Architecture Doc):**
- Fehler-Codes: Architecture Doc Abschnitt 3 (400 / 500)
- PRD Abschnitt 3.6 für alle Fehler-Cases

---

## Epic 4: Ergebnis-Anzeige & PDF-Export

**Ziel:** Die Lehrerin sieht die farbig annotierte Klausur im Browser und kann ein annotiertes PDF herunterladen.

---

### Story 4.1: Ergebnis-Seite mit `AnnotatedText.tsx`

**Als** Lehrerin
**möchte ich** nach der Analyse eine Seite sehen, auf der der Klausurtext farbig markiert ist
**damit** ich auf einen Blick erkenne welche Antworten korrekt, unvollständig oder falsch sind.

**Akzeptanzkriterien:**
- [ ] Seite `app/results/page.tsx` erstellt, liest Annotations-Array aus `sessionStorage`
- [ ] Komponente `components/AnnotatedText.tsx` erstellt, empfängt `annotations`-Array als Prop
- [ ] Jede Textstelle wird als `<span>` mit TailwindCSS-Hintergrundfarbe gerendert: `bg-green-200` (gruen), `bg-yellow-200` (gelb), `bg-red-200` (rot)
- [ ] Erklärung jeder Textstelle ist als Browser-Tooltip sichtbar (`title`-Attribut) oder als Inline-Text
- [ ] Kleine Legende auf der Seite erklärt die Farben: "Grün = korrekt, Gelb = unvollständig, Rot = falsch"
- [ ] Wenn kein Annotations-Array in `sessionStorage` vorhanden: Weiterleitung zurück zu `/`

**Technische Hinweise (aus Architecture Doc):**
- Komponenten-Details: Architecture Doc Abschnitt 5.2
- Tailwind-Klassen: `bg-green-200 hover:bg-green-300`, `bg-yellow-200 hover:bg-yellow-300`, `bg-red-200 hover:bg-red-300`
- `sessionStorage` als Zwischen-Speicher für Annotations

---

### Story 4.2: PDF-Download — API-Route + `DownloadButton.tsx`

**Als** Lehrerin
**möchte ich** die annotierte Klausur als PDF herunterladen
**damit** ich das Ergebnis ausdrucken oder per E-Mail teilen kann.

**Akzeptanzkriterien:**
- [ ] API-Route `app/api/generate-pdf/route.ts` erstellt, nimmt `POST`-Request mit JSON-Body `{ "annotations": [...] }` entgegen
- [ ] Hilfsfunktion in `lib/generatePdf.ts` mit `@react-pdf/renderer` baut ein PDF-Dokument mit farbigen Textstellen (`backgroundColor`: `#bbf7d0` grün / `#fef08a` gelb / `#fecaca` rot) und Erklärungen darunter
- [ ] Paket `@react-pdf/renderer` via `npm install` installiert
- [ ] API-Route gibt das PDF als `Content-Type: application/pdf` zurück (direkter Browser-Download)
- [ ] Komponente `components/DownloadButton.tsx` erstellt mit einem "PDF herunterladen"-Button, der die API-Route aufruft und den Download auslöst
- [ ] Button ist auf der Ergebnis-Seite (`app/results/page.tsx`) eingebunden

**Technische Hinweise (aus Architecture Doc):**
- API-Design: Architecture Doc Abschnitt 3 (POST `/api/generate-pdf`)
- PDF-Farben: Architecture Doc Abschnitt 3 (`#bbf7d0`, `#fef08a`, `#fecaca`)

---

### Story 4.3: "Neue Klausur analysieren"-Button + End-to-End-Test

**Als** Lehrerin
**möchte ich** nach Abschluss einer Analyse einfach eine neue starten können
**damit** ich mehrere Klausuren hintereinander korrigieren kann — und als Entwicklerin möchte ich den gesamten Flow einmal durchgetestet haben.

**Akzeptanzkriterien:**
- [ ] "Neue Klausur analysieren"-Button auf der Ergebnis-Seite vorhanden, leert `sessionStorage` und navigiert zurück zu `/`
- [ ] End-to-End-Test manuell durchgeführt: zwei echte Test-PDFs (Erwartungshorizont + Klausur) hochladen, Ergebnis abwarten, farbige Annotationen prüfen, PDF herunterladen
- [ ] App läuft stabil lokal auf `localhost:3000`
- [ ] App ist live auf Vercel deployt und unter öffentlicher URL erreichbar und funktionsfähig
- [ ] Kein `ANTHROPIC_API_KEY` ist im Frontend-Code oder in der GitHub-History sichtbar (Code-Review)

**Technische Hinweise:**
- Erfolgs-Kriterien: PRD Abschnitt 8 (vollständige Checkliste)
- `.env.local` niemals committen

---

*Erstellt von Bob (BMAD Scrum Master) — 2026-05-21*
