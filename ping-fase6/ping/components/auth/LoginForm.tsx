"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PingMark } from "@/components/shared/PingMark";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

// Login real via Supabase Auth (email + senha). O papel do usuário
// (dono/gerente/profissional) vem de `business_members.role` depois do
// login — decide o que aparece na Sidebar numa fase futura.
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // app/auth/confirm/route.ts redireciona pra cá com esse parâmetro quando o
  // link de confirmação de e-mail expirou ou já foi usado.
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirmacao"
      ? "Esse link de confirmação expirou ou já foi usado. Tente entrar com sua senha."
      : null
  );

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
    const metadata = data.user?.user_metadata as
      | { business_name?: string; owner_name?: string; referral_code?: string; plan?: string }
      | undefined;
    const businessName = metadata?.business_name || "Meu negócio";
    const ownerName = metadata?.owner_name || "";
    await supabase.rpc("create_business_and_owner", {
      business_name: businessName,
      owner_name: ownerName,
      p_referral_code: metadata?.referral_code ?? null,
      p_plan: metadata?.plan ?? "mensal",
    });

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ink-950 text-paper-50 px-6 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-sm py-12">
        <div className="flex flex-col items-center mb-8 animate-rise">
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={88} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Entre para continuar</p>
        </div>

        <Card className="animate-rise">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              id="email"
              type="email"
              label="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@barbearia.com"
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>

        <p
          className="text-center text-sm text-paper-500 mt-5 animate-rise"
          style={{ animationDelay: "0.12s" }}
        >
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-signal-400 font-semibold hover:text-signal-300 transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
