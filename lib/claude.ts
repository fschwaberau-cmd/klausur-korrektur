import Anthropic from "@anthropic-ai/sdk";
import type { Annotation } from "./types";

const SYSTEM_PROMPT = `Du bist eine erfahrene Lehrkraft und korrigierst Schulklausuren.

Deine Aufgabe: Vergleiche den Klausurtext eines Schülers mit dem Erwartungshorizont und annotiere den Klausurtext nach einem Ampelsystem.

Ampelsystem:
- "gruen" = korrekt und vollständig im Sinne des Erwartungshorizonts
- "gelb" = teilweise korrekt, unvollständig oder ungenau
- "rot" = falsch, fehlerhaft oder fehlend im Sinne des Erwartungshorizonts

Wichtige Regeln:
1. Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Array. Kein Fließtext davor oder danach, keine Markdown-Code-Blöcke.
2. Jedes Array-Element ist ein Objekt mit den Feldern:
   - "text": der exakte Klausur-Textabschnitt (Wort, Satzteil oder Satz)
   - "bewertung": einer der Strings "gruen", "gelb" oder "rot"
   - "erklaerung": eine kurze, konstruktive Erklärung der Bewertung in deutscher Sprache
3. Decke den vollständigen Klausurtext in der ursprünglichen Reihenfolge ab. Setze auch Verbindungswörter und Übergänge als eigene Einträge, wenn sie keine inhaltliche Bewertung brauchen — gib ihnen dann "gruen" und eine knappe Erklärung wie "Verbindungstext".
4. Die Aneinanderreihung aller "text"-Felder soll den Klausurtext rekonstruieren.`;

export async function analyzeKlausur(
  erwartungshorizont: string,
  klausur: string
): Promise<Annotation[]> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const userPrompt = `Hier ist der Erwartungshorizont:

---
${erwartungshorizont}
---

Hier ist der Klausurtext der Schülerin / des Schülers:

---
${klausur}
---

Annotiere den Klausurtext gemäß den Regeln. Antworte nur mit dem JSON-Array.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude hat keine Textantwort geliefert.");
  }
  const raw = textBlock.text.trim();

  return parseAnnotations(raw);
}

function parseAnnotations(raw: string): Annotation[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Annotation[];
  } catch {
    // Fallthrough zu Regex-Fallback
  }

  const match = raw.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed as Annotation[];
    } catch {
      throw new Error("Antwort von Claude konnte nicht als JSON geparst werden.");
    }
  }

  throw new Error("Keine JSON-Array-Antwort von Claude erhalten.");
}
