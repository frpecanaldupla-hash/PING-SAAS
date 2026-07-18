import Link from "next/link";
import { LayoutDashboard, CalendarDays, ScanLine, Wallet, Menu } from "lucide-react";

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/checkin", label: "Check-in", icon: ScanLine },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/mais", label: "Mais", icon: Menu },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur border-t border-ink-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {MOBILE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 py-2.5 text-paper-400 active:text-signal-500"
          >
            <item.icon size={20} strokeWidth={1.75} />
            <span className="text-[11px]">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
