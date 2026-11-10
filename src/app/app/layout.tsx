import Link from "next/link";
import { BookOpenText, Inbox, PenLine, Settings } from "lucide-react";
import { Logo } from "@/components/brand";
import { requireMember } from "@/lib/session";
import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/app", label: "Inbox", icon: Inbox },
  { href: "/app/policies", label: "Policies", icon: BookOpenText },
  { href: "/app/new", label: "Log a ticket", icon: PenLine },
  { href: "/app/settings", label: "Workspace", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-sunk/50 p-4 md:w-60 md:border-b-0 md:border-r">
        <Logo />
        <div>
          <p className="k">Workspace</p>
          <p className="mt-1 truncate font-medium">{m.workspaceName}</p>
          <p className="text-xs text-muted">{m.role} · approves up to ₹{(m.authorityCents / 100).toLocaleString("en-IN")}</p>
        </div>
        <nav aria-label="App" className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="btn-quiet shrink-0 justify-start px-3"><Icon aria-hidden className="size-4" />{label}</Link>
          ))}
        </nav>
        <form action={signOutAction} className="mt-auto hidden md:block">
          <p className="mb-2 truncate text-xs text-muted">{m.name}</p>
          <SubmitButton pendingLabel="Signing out" className="btn-secondary w-full">Sign out</SubmitButton>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
