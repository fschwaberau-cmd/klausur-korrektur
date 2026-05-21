"use client";

import type { Annotation } from "@/lib/types";

const bewertungToBg: Record<Annotation["bewertung"], string> = {
  gruen: "bg-green-200 dark:bg-green-900/60",
  gelb: "bg-yellow-200 dark:bg-yellow-900/60",
  rot: "bg-red-200 dark:bg-red-900/60",
};

export default function AnnotatedText({
  annotations,
}: {
  annotations: Annotation[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900/60" />
          Grün = korrekt
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-yellow-200 dark:bg-yellow-900/60" />
          Gelb = unvollständig
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-200 dark:bg-red-900/60" />
          Rot = falsch
        </span>
      </div>

      <p className="text-base leading-8 text-zinc-900 dark:text-zinc-100">
        {annotations.map((a, i) => (
          <span
            key={i}
            title={a.erklaerung}
            className={`${bewertungToBg[a.bewertung]} rounded px-1 py-0.5 mx-0.5 cursor-help`}
          >
            {a.text}
          </span>
        ))}
      </p>
    </div>
  );
}
