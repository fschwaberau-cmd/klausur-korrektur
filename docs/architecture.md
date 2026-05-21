# Architecture Document: Klausur-Korrektor
**Version:** 1.0 — MVP
**Datum:** 2026-05-21
**Status:** Freigegeben zur Umsetzung
**Autor:** Winston (BMAD Architect)

---

## 0. Einleitung (für Nicht-Techniker:innen)

Dieses Dokument ist der **technische Bauplan** für den Klausur-Korrektor. Es beschreibt:

- welche Dateien existieren müssen
- was diese Dateien tun
- wie die Daten durch die App fliessen
- wie die KI (Claude) angesprochen wird
- wie alles am Ende ins Internet kommt (Deployment)

Es ist gedacht für die Entwicklerin (Amelia), die die App tatsächlich baut. Es ist absichtlich klein und einfach gehalten — wir bauen heute ein MVP, keinen Konzern.

---

## 1. Ordnerstruktur (Dateibaum)

So sieht das fertige Projekt im Datei-Explorer aus:

```
klausur-korrektor/
├── app/
│   ├── layout.tsx              (Root-Layout: HTML-Grundgerüst + Tailwind-Styles)
│   ├── page.tsx                (Startseite mit Upload-Formular)
│   ├── globals.css             (TailwindCSS-Importe + globale Styles)
│   ├── results/
│   │   └── page.tsx            (Ergebnis-Seite mit annotiertem Text)
│   └── api/
│       └── analyze/
│           └── route.ts        (API-Route: empfängt PDFs, ruft Claude auf)
├── components/
│   ├── UploadForm.tsx          (Client-Komponente: Upload-Formular + Submit-Logik)
│   ├── AnnotatedText.tsx       (Client-Komponente: rendert farbig markierten Text)
│   └── DownloadButton.tsx      (Client-Komponente: löst PDF-Download aus)
├── lib/
│   ├── claude.ts               (Wrapper für Claude API Calls)
│   ├── pdf.ts                  (PDF-Text-Extraktion mit pdf-parse)
│   ├── generatePdf.ts          (PDF-Generierung mit @react-pdf/renderer)
│   └── types.ts                (TypeScript-Typen für Annotation, API-Response)
├── public/                     (statische Dateien, leer für MVP)
├── .env.local                  (lokale Environment Variables — NICHT in Git!)
├── .env.example                (Vorlage für Environment Variables)
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

**Erklärung der wichtigsten Ordner:**

- `app/` — Next.js (App-Router) findet hier automatisch die Seiten. `page.tsx` = die Startseite, `results/page.tsx` = die `/results`-Seite.
- `app/api/` — alles unter diesem Ordner ist **Server-Code** (läuft NICHT im Browser, sondern auf Vercel). Genau hier dürfen wir den API-Key benutzen.
- `components/` — wiederverwendbare UI-Bausteine (React-Komponenten).
- `lib/` — Hilfsfunktionen, die nichts mit der Anzeige zu tun haben (Claude-Aufruf, PDF-Lesen, Typen).

---

## 2. Datenfluss (Schritt für Schritt)

So fliessen die Daten, wenn eine Lehrerin die App benutzt:

1. **Lehrerin öffnet die App** im Browser → Next.js liefert `app/page.tsx` aus.
2. **Sie sieht das Upload-Formular** (Komponente `UploadForm.tsx`) mit zwei Datei-Feldern und einem "Analysieren"-Button.
3. **Sie wählt zwei PDFs aus** (Erwartungshorizont + Klausur) und klickt auf "Analysieren".
4. **Das Formular packt beide Dateien in ein `FormData`-Objekt** (das ist der Standard-Weg im Browser, Dateien zu verschicken) und schickt einen `POST`-Request an `/api/analyze`.
5. **Im Browser erscheint die Ladeanzeige** ("KI analysiert deine Klausur...").
6. **Auf dem Server (Vercel) übernimmt `app/api/analyze/route.ts`:**
   a. Beide PDFs werden aus dem `FormData` entpackt.
   b. Mit `pdf-parse` wird der Text aus beiden PDFs extrahiert.
   c. Wenn ein PDF keinen Text enthält → Fehler-Response zurück.
   d. Der Wrapper in `lib/claude.ts` baut den Prompt und ruft die Claude API auf.
   e. Claude antwortet mit einem JSON-Array aus Textstellen + Bewertung + Erklärung.
   f. Die API-Route gibt dieses Array als JSON zurück an den Browser.
7. **Der Browser empfängt das JSON**, speichert es zwischen (z. B. in `sessionStorage` oder via React-State + Navigation) und navigiert auf `/results`.
8. **`app/results/page.tsx` rendert die Komponente `AnnotatedText`**, die jede Textstelle farbig hinterlegt (grün/gelb/rot) und die Erklärung als Tooltip anzeigt.
9. **Klick auf "PDF herunterladen"** → `DownloadButton.tsx` ruft `/api/generate-pdf` auf. Die API-Route nutzt `@react-pdf/renderer`, baut ein PDF-Dokument mit den farbigen Annotationen und gibt es als Datei-Download zurück.
10. **Klick auf "Neue Klausur analysieren"** → zurück zur Startseite, Daten verworfen.

**Wichtig:** PDFs werden NIE auf dem Server gespeichert — sie leben nur im Arbeitsspeicher während der Verarbeitung.

---

## 3. API-Design

Es gibt genau **zwei** API-Routen. Bewusst minimalistisch.

### POST `/api/analyze`

**Request:**
- Methode: `POST`
- Content-Type: `multipart/form-data`
- Body (FormData):
  - `erwartungshorizont` — Datei (PDF, max. 10 MB)
  - `klausur` — Datei (PDF, max. 10 MB)

**Response (Erfolg — HTTP 200):**
```json
{
  "success": true,
  "annotations": [
    {
      "text": "Die Photosynthese findet in den Chloroplasten statt.",
      "bewertung": "gruen",
      "erklaerung": "Korrekt. Stimmt mit dem Erwartungshorizont überein."
    },
    {
      "text": "Dabei wird Sauerstoff produziert.",
      "bewertung": "gelb",
      "erklaerung": "Teilweise richtig — die Rolle von CO2 fehlt."
    },
    {
      "text": "Pflanzen atmen wie Tiere.",
      "bewertung": "rot",
      "erklaerung": "Falsch. Pflanzen betreiben Photosynthese, keine reine Atmung."
    }
  ]
}
```

**Response (Fehler — HTTP 400 / 500):**
```json
{
  "success": false,
  "error": "PDF enthält keinen lesbaren Text."
}
```

**Fehler-Codes:**
- `400` — Validierungsfehler (Datei fehlt, kein PDF, zu gross, kein Text)
- `500` — Server-Fehler (Claude API nicht erreichbar, unerwarteter Fehler)

### POST `/api/generate-pdf`

**Request:**
- Methode: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "annotations": [ { "text": "...", "bewertung": "gruen", "erklaerung": "..." } ]
}
```

**Response (Erfolg — HTTP 200):**
- Content-Type: `application/pdf`
- Body: Binärdaten des generierten PDFs (direkter Download im Browser)

**Implementierung:** `lib/generatePdf.ts` nutzt `@react-pdf/renderer` um ein PDF-Dokument zu bauen. Jede Textstelle wird als `<Text>` mit entsprechender `backgroundColor` (`#bbf7d0` grün / `#fef08a` gelb / `#fecaca` rot) gerendert. Die Erklärung erscheint als kleinerer Text darunter.

---

## 4. Claude-Prompt-Design

Wir sprechen Claude über die offizielle **Anthropic SDK** (`@anthropic-ai/sdk`) an. Modell: `claude-sonnet-4-6`.

### System-Prompt (definiert Claudes Rolle)

```
Du bist eine erfahrene Lehrkraft und Korrekturassistenz für Klausuren.

Deine Aufgabe:
Du erhältst zwei Texte:
1. Einen Erwartungshorizont (die Musterlösung)
2. Eine Schülerklausur

Du vergleichst die Schülerklausur Satz für Satz oder Absatz für Absatz mit dem Erwartungshorizont und bewertest jede Textstelle nach folgendem Ampelsystem:

- "gruen"  = korrekt und vollständig (Inhalt stimmt mit Erwartungshorizont überein)
- "gelb"   = unvollständig, unklar oder teilweise richtig
- "rot"    = falsch, fehlend oder widerspricht dem Erwartungshorizont

WICHTIG:
- Bewerte ausschliesslich INHALT, nicht Rechtschreibung oder Grammatik.
- Gib für jede Textstelle eine kurze Erklärung (1-2 Sätze).
- Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Fliesstext drumherum.
- Das JSON ist ein Array aus Objekten mit den Feldern: text, bewertung, erklaerung.
- "bewertung" darf nur einen der drei Werte haben: "gruen", "gelb", "rot".
- Erhalte die Reihenfolge der Textstellen wie in der Schülerklausur.
- Lasse keine Textstelle aus — der gesamte Schülerklausur-Text muss abgedeckt sein.
```

### User-Prompt (die eigentliche Anfrage)

```
ERWARTUNGSHORIZONT:
---
{erwartungshorizont_text}
---

SCHÜLERKLAUSUR:
---
{klausur_text}
---

Analysiere die Schülerklausur gegen den Erwartungshorizont und gib das Ergebnis als JSON-Array zurück.
```

### Erwartetes Output-Format

```json
[
  {
    "text": "<Original-Textstelle aus der Schülerklausur>",
    "bewertung": "gruen" | "gelb" | "rot",
    "erklaerung": "<kurze Begründung, 1-2 Sätze>"
  }
]
```

### Robustheit

- **Kein Streaming** (laut Constraint) — wir warten auf die komplette Antwort.
- **JSON-Parsing in einer try/catch-Klammer** — wenn Claude doch mal Text drumrum schreibt, extrahieren wir mit einem Regex den JSON-Block (`/\[[\s\S]*\]/`).
- **Validierung des Outputs:** Jede Annotation muss `text`, `bewertung` (einer von drei Werten) und `erklaerung` haben. Andernfalls Fehler-Response.
- **Token-Limit `max_tokens`** auf hohen Wert setzen (z. B. 8000), damit lange Klausuren nicht abgeschnitten werden.

---

## 5. Komponenten-Beschreibung

### 5.1 `UploadForm.tsx` (Client-Komponente, `"use client"`)

**Was sie tut:**
- Rendert das HTML-Formular mit zwei `<input type="file" accept="application/pdf">`.
- Hält den State für beide Dateien, eine Lade-Anzeige und Fehlermeldungen.
- Validiert clientseitig: beide Dateien gewählt? Beide PDF? Beide unter 10 MB?
- Beim Klick auf "Analysieren":
  1. Lade-State setzen (Button deaktivieren, Spinner zeigen).
  2. `FormData` bauen, beide Dateien anhängen.
  3. `fetch("/api/analyze", { method: "POST", body: formData })` ausführen.
  4. Antwort verarbeiten:
     - Bei Erfolg: Annotations in `sessionStorage` ablegen und mit `router.push("/results")` weiterleiten.
     - Bei Fehler: Fehlermeldung im Formular anzeigen.

**Warum Client-Komponente?** Weil sie mit dem Browser interagiert (Dateien, State, Navigation).

### 5.2 `AnnotatedText.tsx` (Client-Komponente)

**Was sie tut:**
- Empfängt das `annotations`-Array als Prop.
- Rendert pro Annotation ein `<span>` mit:
  - dem Original-Text
  - einer Tailwind-Klasse für die Hintergrundfarbe je nach `bewertung`:
    - `gruen` → `bg-green-200 hover:bg-green-300`
    - `gelb`  → `bg-yellow-200 hover:bg-yellow-300`
    - `rot`   → `bg-red-200 hover:bg-red-300`
  - der `erklaerung` als `title`-Attribut (nativer Browser-Tooltip) ODER als kleines Pop-Up bei Hover (z. B. mit `group`/`group-hover` von Tailwind).
- Spannen folgen direkt aufeinander, damit der Lesefluss erhalten bleibt.
- Optional: kleine Legende oben auf der Seite ("Grün = korrekt, Gelb = unvollständig, Rot = falsch").

**Beispiel-Markup (vereinfacht):**
```tsx
<span className="bg-green-200 px-1 rounded" title={a.erklaerung}>
  {a.text}
</span>
```

---

## 6. Environment Variables

In einer Datei namens `.env.local` (lokal) bzw. im Vercel-Dashboard (online) wird hinterlegt:

| Variable | Beschreibung | Woher? |
|----------|--------------|--------|
| `ANTHROPIC_API_KEY` | Geheimer Schlüssel für die Claude API | https://console.anthropic.com → Settings → API Keys → "Create Key" |

**Wichtig:**
- `.env.local` steht in `.gitignore` und landet **niemals** auf GitHub.
- Der Key wird **ausschliesslich** in `lib/claude.ts` (Server-Code) gelesen — niemals im Frontend.
- `.env.example` mit leerem Wert checken wir mit ein, damit klar ist welche Variablen existieren müssen.

**Beispiel `.env.example`:**
```
ANTHROPIC_API_KEY=
```

---

## 7. Deployment-Plan

So kommt die App ins Internet:

1. **GitHub-Repository erstellen**
   - Auf https://github.com neues Repo anlegen (z. B. `klausur-korrektor`).
   - Lokal: `git init`, `git add .`, `git commit -m "Initial commit"`, `git remote add origin ...`, `git push`.
   - Vorher prüfen: `.env.local` IST in `.gitignore` (sonst landet der API-Key öffentlich auf GitHub!).

2. **Vercel-Account verbinden**
   - Auf https://vercel.com mit GitHub einloggen.
   - "Add New Project" → das gerade erstellte Repo auswählen.
   - Framework: Next.js wird automatisch erkannt.
   - Build-Settings: Defaults beibehalten.

3. **Environment Variable in Vercel setzen**
   - Im Vercel-Projekt: Settings → Environment Variables.
   - Name: `ANTHROPIC_API_KEY`, Value: <der Key aus der Anthropic Console>.
   - Environment: Production + Preview + Development anhaken.

4. **Deploy auslösen**
   - "Deploy" klicken — Vercel baut und deployt automatisch.
   - Nach ca. 1-2 Minuten ist die App unter einer Vercel-URL erreichbar (z. B. `klausur-korrektor.vercel.app`).

5. **Smoke-Test**
   - URL im Browser öffnen.
   - Zwei Test-PDFs hochladen.
   - Prüfen ob das Ergebnis farbig angezeigt wird.

---

## 8. Wichtige Bibliotheken (Dependencies)

Diese Pakete werden via `npm install` installiert:

| Paket | Zweck |
|-------|-------|
| `next` (>= 14) | Web-Framework |
| `react`, `react-dom` | UI-Bibliothek (kommt mit Next.js) |
| `typescript` | Typsicherheit |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `@anthropic-ai/sdk` | Offizielles SDK für die Claude API |
| `pdf-parse` | PDF-Text-Extraktion (serverseitig) |
| `@types/pdf-parse` | TypeScript-Typen für pdf-parse |
| `@react-pdf/renderer` | PDF-Generierung serverseitig (farbige Annotationen als Download) |

---

## 9. Architektur-Entscheidungen (Trade-offs)

Kurze Begründungen für die wichtigsten Entscheidungen — damit später nachvollziehbar ist, warum es so gebaut ist.

| Entscheidung | Warum? | Trade-off |
|--------------|--------|-----------|
| Nur EINE API-Route | Maximal einfach, kein Overhead | Bei Wachstum müssten wir aufteilen |
| `sessionStorage` statt URL-Parameter für Annotations | Annotations können sehr lang sein, passen nicht in eine URL | State geht verloren bei Refresh — fürs MVP okay |
| Server-side PDF-Parsing | Sicher (kein Code im Browser) + zuverlässig | Etwas langsamer als reines Client-Parsing |
| `pdf-parse` statt `pdfjs-dist` | Schlanker, serverseitig bewährt | Keine Bilder/Layout, nur Text — genau was wir brauchen |
| Kein Streaming | Einfacher zu implementieren | Bei langen Klausuren wartet die Lehrerin bis zu 30 s |
| Kein State-Management (Redux/Zustand) | Wir haben kaum State | Bei mehr Features später nachholen |
| Tooltips via `title`-Attribut | Null Aufwand | Weniger schön als Custom-Tooltip — für MVP okay |

---

## 10. Was NICHT gebaut wird (zur Sicherheit nochmal)

Gemäss PRD Abschnitt 6 explizit **out of scope**:
- Kein Login, keine User-Accounts
- Keine Datenbank, keine Persistierung
- Kein OCR für gescannte PDFs
- Keine Batch-Verarbeitung
- Kein Mobile-Optimierung (Desktop reicht)
- Keine Mehrsprachigkeit (nur Deutsch)

---

*Erstellt von Winston (BMAD Architect) — 2026-05-21*
