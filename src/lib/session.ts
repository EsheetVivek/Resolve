import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { ensureWorkspace, type Member } from "@/lib/workspace";

/** For pages under /app: signed in, with a workspace (created on first visit). */
export async function requireMember(path = "/app"): Promise<Member & { name: string | null }> {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  const m = await ensureWorkspace(db, { id: session.user.id, name: session.user.name });
  return { ...m, name: session.user.name ?? session.user.email ?? null };
}
