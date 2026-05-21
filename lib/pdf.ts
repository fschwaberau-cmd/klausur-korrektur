export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use internal module directly — skips test-file loading that crashes on Vercel
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  return (data?.text ?? "").trim();
}
