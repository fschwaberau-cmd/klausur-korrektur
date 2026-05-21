import { NextRequest, NextResponse } from "next/server";
import { generateCorrectionPdf } from "@/lib/generatePdf";
import type { Annotation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { annotations?: Annotation[] };
    const annotations = body.annotations;

    if (!Array.isArray(annotations) || annotations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Keine Annotations übergeben." },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateCorrectionPdf(annotations);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="korrektur.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler.";
    console.error("[/api/generate-pdf]", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
