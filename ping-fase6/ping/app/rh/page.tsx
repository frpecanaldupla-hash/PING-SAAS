import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeamRoster } from "@/components/shared/TeamRoster";
import { MOCK_PROFESSIONALS, MOCK_APPOINTMENTS } from "@/lib/mock/data";

// TODO(fase seguinte): CRUD de profissionais (convite por e-mail, definição
// de comissão, horários de trabalho) — hoje só leitura, a partir do mock.
export default function RhPage() {
  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Equipe</h1>
          <p className="text-xs text-paper-500 mt-1">Barbearia Central</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-5xl mx-auto">
        <TeamRoster professionals={MOCK_PROFESSIONALS} appointments={MOCK_APPOINTMENTS} />
      </main>
    </div>
  );
}
