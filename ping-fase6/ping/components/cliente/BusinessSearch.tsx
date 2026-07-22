"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PingMark } from "@/components/shared/PingMark";
import { searchBusinesses } from "@/app/cliente/buscar/actions";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function BusinessSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; slug: string }[]>([]);
  const [isSearching, startSearch] = useTransition();

  // Mesmo padrão de debounce das outras buscas ao vivo do app (ver
  // CheckinScanner, FidelityManager) — evita disparar a Server Action a
  // cada tecla digitada.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const { businesses } = await searchBusinesses(query);
        setResults(businesses);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ink-950 text-paper-50 px-6 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-sm py-12">
        <div className="flex flex-col items-center mb-8 animate-rise">
          <PingMark size={88} />
          <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          <p className="text-paper-500 text-sm mt-1">Encontre sua barbearia</p>
        </div>

        <Card className="animate-rise">
          <div className="p-6 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome da barbearia"
                className="pl-9"
              />
            </div>

            {isSearching && <p className="text-xs text-paper-500">Buscando...</p>}

            {results.length > 0 && (
              <ul className="space-y-1.5">
                {results.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/b/${b.slug}`}
                      className="block px-4 py-3 ping-card hover:border-signal-400/40 transition-all text-sm font-medium"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {query.trim().length >= 2 && !isSearching && results.length === 0 && (
              <p className="text-xs text-paper-500">Nenhuma barbearia encontrada com esse nome.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
