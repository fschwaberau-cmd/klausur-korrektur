"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnnotatedText from "@/components/AnnotatedText";
import DownloadButton from "@/components/DownloadButton";
import type { Annotation } from "@/lib/types";

export default function ResultsPage() {
  const [annotations, setAnnotations] = useState<Annotation[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("annotations");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Annotation[];
        setAnnotations(parsed);
      } catch {
        setAnnotations(null);
      }
    }
    setLoaded(true);
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-16 px-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Korrektur-Ergebnis
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Bewegen Sie die Maus über farbige Stellen, um die Erklärung zu sehen.
          </p>
        </header>

        {!loaded && (
          <p className="text-zinc-500">Lade Ergebnis...</p>
        )}

        {loaded && (!annotations || annotations.length === 0) && (
          <div className="flex flex-col gap-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              Keine Annotations gefunden. Bitte zuerst eine Klausur analysieren.
            </p>
            <Link
              href="/"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 w-fit"
            >
              Zur Startseite
            </Link>
          </div>
        )}

        {loaded && annotations && annotations.length > 0 && (
          <>
            <AnnotatedText annotations={annotations} />
            <div className="flex flex-wrap gap-3 mt-4">
              <DownloadButton annotations={annotations} />
              <Link
                href="/"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Neue Klausur analysieren
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
