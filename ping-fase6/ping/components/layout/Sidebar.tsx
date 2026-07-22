import Link from "next/link";
import {
  LayoutDashboard, CalendarDays, ScanLine, Scissors,
  Gift, Users, Wallet, Megaphone, Share2, QrCode, Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/checkin", label: "Check-in", icon: ScanLine },
  { href: "/servicos", label: "Serviços", icon: Scissors },
  { href: "/fidelidade", label: "Fidelidade", icon: Gift },
  { href: "/rh", label: "Equipe", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/indicacoes", label: "Indicações", icon: Share2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

// Fundo translúcido de propósito: nas telas que têm <Atmosphere /> atrás
// (dashboard hoje, o resto conforme for migrando), as luzes volumétricas
// vazam de leve pela sidebar; nas telas ainda sem atmosfera, ink-950/70
// sobre ink-950 fica idêntico ao opaco de antes.
export function Sidebar({ businessName = "Sua barbearia" }: { businessName?: string }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-ink-800/80 bg-ink-950/70 backdrop-blur-md px-4 py-6">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
        <span className="w-2.5 h-2.5 rounded-full bg-signal-400 shadow-[0_0_10px_3px_rgba(255,91,61,0.7)]" />
        <span className="font-display text-2xl tracking-wide leading-none">PING</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-paper-400 hover:text-paper-50 hover:bg-ink-800 transition-colors"
          >
            <item.icon
              size={18}
              strokeWidth={1.75}
              className="text-steel-400 transition-colors group-hover:text-signal-300"
            />
            {item.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/cliente"
        className="group flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-paper-400 hover:text-paper-50 hover:bg-ink-800 transition-colors border-t border-ink-800 pt-4 mt-2"
      >
        <QrCode
          size={18}
          strokeWidth={1.75}
          className="text-steel-400 transition-colors group-hover:text-signal-300"
        />
        Área do cliente
      </Link>

      <div className="px-3 pt-4 mt-2 border-t border-ink-800">
        <p className="text-xs text-paper-500 truncate">{businessName}</p>
      </div>
    </aside>
  );
}
