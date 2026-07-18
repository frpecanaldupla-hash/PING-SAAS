import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export function ModuleCard({
  href,
  label,
  description,
  icon: Icon,
  metric,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  metric?: string;
}) {
  return (
    <Link
      href={href}
      className="group ping-card p-5 flex flex-col justify-between min-h-[148px] hover:border-signal-500/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xs bg-ink-800 flex items-center justify-center">
          <Icon size={18} strokeWidth={1.75} className="text-brass-400" />
        </div>
        <ArrowUpRight
          size={16}
          className="text-paper-500 group-hover:text-signal-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
        />
      </div>
      <div>
        {metric && <p className="ping-figure text-2xl mb-1">{metric}</p>}
        <p className="font-semibold text-paper-50">{label}</p>
        <p className="text-xs text-paper-500 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
