import { NextRequest, NextResponse } from "next/server";
import { analyzeKlausur } from "@/lib/claude";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const erwartungshorizontFile = formData.get("erwartungshorizont");
    const klausurFile = formData.get("klausur");

    if (
      !(erwartungshorizontFile instanceof File) ||
      !(klausurFile instanceof File)
    ) {
      return NextResponse.json(
        { success: false, error: "Bitte beide PDF-Dateien hochladen." },
        { status: 400 }
      );
    }

    const erwartungsBase64 = await fileToBase64(erwartungshorizontFile);
    const klausurBase64 = await fileToBase64(klausurFile);

    const annotations = await analyzeKlausur(erwartungsBase64, klausurBase64);
    return NextResponse.json({ success: true, annotations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(""));
}
