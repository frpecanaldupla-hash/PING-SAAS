import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { BookingDrawer } from "@/components/agenda/BookingDrawer";
import {
  MOCK_APPOINTMENTS, MOCK_CLIENTS, MOCK_PROFESSIONALS, MOCK_SERVICES,
} from "@/lib/mock/data";

// TODO(fase seguinte): trocar os MOCK_* por queries Supabase com Realtime
// (`.channel("appointments").on("postgres_changes", ...)`) para os blocos
// atualizarem sozinhos quando outro profissional confirma um check-in.
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { novo } = await searchParams;

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-3xl tracking-wide leading-none">Agenda</h1>
            <p className="text-xs text-paper-500 mt-1">Hoje · Barbearia Central</p>
          </div>
        </div>
        <BookingDrawer
          services={MOCK_SERVICES}
          professionals={MOCK_PROFESSIONALS}
          autoOpen={novo === "1"}
        />
      </header>

      <main className="px-5 lg:px-10 py-6 max-w-6xl mx-auto">
        <AgendaGrid
          professionals={MOCK_PROFESSIONALS}
          appointments={MOCK_APPOINTMENTS}
          clients={MOCK_CLIENTS}
          services={MOCK_SERVICES}
        />
      </main>
    </div>
  );
}
