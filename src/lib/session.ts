import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { ensureWorkspace, type Member } from "@/lib/workspace";

// The layout and the page both need the member; cache() makes it one lookup per request.
const currentMember = cache(async (): Promise<(Member & { name: string | null }) | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const m = await ensureWorkspace(db, { id: session.user.id, name: session.user.name });
  return { ...m, name: session.user.name ?? session.user.email ?? null };
});

/** For pages under /app: signed in, with a workspace (created on first visit). */
export async function requireMember(path = "/app"): Promise<Member & { name: string | null }> {
  const m = await currentMember();
  if (!m) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  return m;
}
