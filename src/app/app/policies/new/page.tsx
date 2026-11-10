import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canPublish } from "@/lib/policies";
import { requireMember } from "@/lib/session";
import { PolicyEditor } from "@/components/policy-editor";

export const metadata: Metadata = { title: "New policy" };

export default async function NewPolicy() {
  const m = await requireMember("/app/policies/new");
  if (!canPublish(m)) notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="serif text-4xl">New policy</h1>
      <div className="mt-8"><PolicyEditor /></div>
    </main>
  );
}
