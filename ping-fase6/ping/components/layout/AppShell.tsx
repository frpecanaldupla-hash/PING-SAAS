import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Atmosphere } from "@/components/ui/Atmosphere";

// Casca comum das telas internas (Agenda, Financeiro, RH...): sidebar fixa
// no desktop e barra inferior no mobile. Antes só o Dashboard montava
// Sidebar/BottomNav — as outras telas ficavam sem nenhum jeito de navegar
// que não fosse a seta de voltar do PageHeader direto pro Dashboard.
export function AppShell({
  businessName,
  children,
}: {
  businessName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar businessName={businessName} />
        <div className="flex-1 flex flex-col pb-20 lg:pb-0">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
