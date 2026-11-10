import type { Metadata } from "next";
import { NewTicketForm } from "@/components/new-ticket-form";

export const metadata: Metadata = { title: "Log a ticket" };

export default function NewTicket() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <h1 className="serif text-4xl">Log a ticket</h1>
      <p className="mt-1 text-sm text-muted">For phone calls and walk-ins. Personal details in the message are hidden from the AI automatically.</p>
      <NewTicketForm />
    </main>
  );
}
