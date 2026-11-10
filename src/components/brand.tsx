import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2">
      <span aria-hidden className="grid size-7 place-items-center rounded-full bg-ink text-paper">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg>
      </span>
      <span className="serif text-2xl">Resolve</span>
    </Link>
  );
}

export const REPO = "https://github.com/EsheetVivek/Resolve";
