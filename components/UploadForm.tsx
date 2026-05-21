"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [erwartungshorizont, setErwartungshorizont] = useState<File | null>(
    null
  );
  const [klausur, setKlausur] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!erwartungshorizont || !klausur) {
      setError("Bitte beide PDF-Dateien auswählen.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("erwartungshorizont", erwartungshorizont);
      formData.append("klausur", klausur);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let data: { success: boolean; error?: string; annotations?: unknown[] };
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server-Fehler (${res.status}): ${rawText.slice(0, 200)}`);
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Analyse fehlgeschlagen.");
      }

      sessionStorage.setItem(
        "annotations",
        JSON.stringify(data.annotations)
      );
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Erwartungshorizont (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setErwartungshorizont(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Klausur (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setKlausur(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-900 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "KI analysiert..." : "Analysieren"}
      </button>
    </form>
  );
}
