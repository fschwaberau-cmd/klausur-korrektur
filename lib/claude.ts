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
   - "text": der exakte Klausur-Textabschnitt (Satz oder Satzteil)
   - "bewertung": einer der Strings "gruen", "gelb" oder "rot"
   - "erklaerung": eine kurze, konstruktive Erklärung der Bewertung auf Deutsch
3. Decke den vollständigen Klausurtext in der ursprünglichen Reihenfolge ab.
4. Die Aneinanderreihung aller "text"-Felder soll den Klausurtext rekonstruieren.`;

export async function analyzeKlausur(
  erwartungshorizontBuffer: Buffer,
  klausurBuffer: Buffer
): Promise<Annotation[]> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Send PDFs directly to Claude — no PDF parsing library needed
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Hier ist der Erwartungshorizont:" },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: erwartungshorizontBuffer.toString("base64"),
            },
          } as never,
          { type: "text", text: "Hier ist die Schülerklausur:" },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: klausurBuffer.toString("base64"),
            },
          } as never,
          {
            type: "text",
            text: "Analysiere die Schülerklausur gegen den Erwartungshorizont und gib das Ergebnis als JSON-Array zurück. Antworte nur mit dem JSON-Array.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude hat keine Textantwort geliefert.");
  }

  return parseAnnotations(textBlock.text.trim());
}

function parseAnnotations(raw: string): Annotation[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Annotation[];
  } catch {
    // Fallback: JSON-Block per Regex suchen
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
