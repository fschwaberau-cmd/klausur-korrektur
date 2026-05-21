export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic require inside function so import errors are caught by the API route try/catch
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return (data?.text ?? "").trim();
}
