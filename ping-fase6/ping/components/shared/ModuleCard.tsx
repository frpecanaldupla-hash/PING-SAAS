import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
    <Link href={href} className="group block h-full">
      <Card interactive className="h-full p-5">
        <div className="flex h-full min-h-[108px] flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xs flex items-center justify-center bg-gradient-to-b from-ink-800 to-ink-900 border border-steel-800 shadow-[inset_0_1px_0_rgba(247,244,238,0.05)] transition-colors group-hover:border-signal-400/50">
              <Icon size={18} strokeWidth={1.75} className="text-brass-400" />
            </div>
            <ArrowUpRight
              size={16}
              className="text-paper-500 group-hover:text-signal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div>
            {metric && <p className="ping-figure text-2xl mb-1">{metric}</p>}
            <p className="font-semibold text-paper-50">{label}</p>
            <p className="text-xs text-paper-500 mt-0.5">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
