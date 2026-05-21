import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/pdf";
import { analyzeKlausur } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const erwartungsBuffer = Buffer.from(
      await erwartungshorizontFile.arrayBuffer()
    );
    const klausurBuffer = Buffer.from(await klausurFile.arrayBuffer());

    const erwartungshorizontText = await extractTextFromPdf(erwartungsBuffer);
    const klausurText = await extractTextFromPdf(klausurBuffer);

    if (!erwartungshorizontText || !klausurText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aus mindestens einer PDF konnte kein Text extrahiert werden.",
        },
        { status: 400 }
      );
    }

    const annotations = await analyzeKlausur(
      erwartungshorizontText,
      klausurText
    );

    return NextResponse.json({ success: true, annotations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler.";
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
