import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-2xl flex-col gap-10 py-20 px-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Klausur-Korrektor
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Lade den Erwartungshorizont und die Schüler-Klausur als PDF hoch.
            Die KI vergleicht beide Texte und markiert den Klausurtext mit einem
            Ampelsystem.
          </p>
        </header>

        <UploadForm />
      </main>
    </div>
  );
}
