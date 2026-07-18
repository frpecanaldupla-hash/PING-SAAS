"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PingMark } from "@/components/shared/PingMark";

// Login real via Supabase Auth (email + senha). O papel do usuário
// (dono/gerente/profissional) vem de `business_members.role` depois do
// login — decide o que aparece na Sidebar numa fase futura.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError("E-mail ou senha incorretos.");
      return;
    }

    // Cobre o cadastro que exigiu confirmação de e-mail: nesse caso o
    // negócio ainda não existe (não havia sessão no momento do signUp para
    // chamar a função de criação). No primeiro login com sucesso, criamos
    // o negócio agora, usando o nome guardado em user_metadata no cadastro.
    // A função é idempotente — se o negócio já existe, só retorna o id dele.
    const businessName =
      (data.user?.user_metadata as { business_name?: string } | undefined)
        ?.business_name || "Meu negócio";
    await supabase.rpc("create_business_and_owner", { business_name: businessName });

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={72} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Entre para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="ping-card p-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs text-paper-500 mb-1.5 block">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
              placeholder="voce@barbearia.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs text-paper-500 mb-1.5 block">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-paper-500 mt-5">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-signal-500 font-semibold">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
