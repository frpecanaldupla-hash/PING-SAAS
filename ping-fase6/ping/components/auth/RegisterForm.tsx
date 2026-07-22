"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PingMark } from "@/components/shared/PingMark";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PlanPicker } from "@/components/billing/PlanPicker";
import type { PlanId } from "@/lib/billing/plans";

// Cadastro real via Supabase Auth. O negócio (tabela `businesses`) e o
// vínculo de dono (`business_members`) são criados pela função de banco
// `create_business_and_owner` (ver supabase/migrations/0002_signup.sql) —
// nunca por INSERT direto do cliente, que não tem policy de escrita nessas
// tabelas de propósito.
//
// Dois caminhos possíveis depois do signUp, dependendo de "Confirm email"
// estar ligado no projeto Supabase (Authentication → Providers → Email):
// - Desligado: `session` já vem preenchida -> cria o negócio na hora e
//   manda pro dashboard.
// - Ligado: sem sessão ainda -> mostramos "confira seu e-mail" e o negócio
//   só é criado no primeiro login bem-sucedido (ver LoginForm.tsx), usando
//   o nome do negócio guardado em user_metadata durante o signUp.
export function RegisterForm({ referralCode }: { referralCode?: string } = {}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId>("mensal");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
          owner_name: ownerName,
          referral_code: referralCode ?? null,
          plan,
        },
        // Sem isso, o Supabase manda o link padrão dele (ConfirmationURL),
        // que verifica o token assim que qualquer requisição bate nele —
        // inclusive o pré-carregamento de segurança do Gmail/Outlook. Ver
        // app/auth/confirm/route.ts para o porquê disso resolver o
        // "Email link is invalid or has expired".
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("already exists")
          ? "Já existe uma conta com esse e-mail."
          : "Não foi possível criar a conta. Tente novamente."
      );
      return;
    }

    if (data.session) {
      const { error: rpcError } = await supabase.rpc("create_business_and_owner", {
        business_name: businessName,
        owner_name: ownerName,
        p_referral_code: referralCode ?? null,
        p_plan: plan,
      });
      setLoading(false);
      if (rpcError) {
        setError(
          "Conta criada, mas houve um problema ao configurar o negócio. Tente entrar novamente em instantes."
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setPendingConfirmation(true);
  }

  if (pendingConfirmation) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-ink-950 text-paper-50 px-6 overflow-x-hidden">
        <Atmosphere />

        <div className="relative z-10 w-full max-w-sm text-center animate-rise">
          <div className="flex justify-center">
            <Link href="/">
              <PingMark size={88} />
            </Link>
          </div>
          <h1 className="font-display text-3xl tracking-wide mt-4 mb-2">Quase lá</h1>
          <p className="text-paper-400 text-sm leading-relaxed">
            Enviamos um link de confirmação para{" "}
            <strong className="text-paper-50">{email}</strong>. Clique nele e
            depois volte aqui para entrar.
          </p>
          <ButtonLink href="/login" variant="outline" className="mt-6">
            Ir para o login
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ink-950 text-paper-50 px-6 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-2xl py-12">
        <div className="flex flex-col items-center mb-8 animate-rise">
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={88} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Crie a conta do seu negócio</p>
        </div>

        <div className="mb-6 animate-rise">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3 text-center">
            Escolha seu plano — 7 dias grátis, sem cartão agora
          </p>
          <PlanPicker value={plan} onChange={setPlan} />
        </div>

        <Card className="animate-rise max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              id="businessName"
              type="text"
              label="Nome do negócio"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Barbearia Central"
            />

            <Input
              id="ownerName"
              type="text"
              label="Seu nome"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ex: Zé"
              hint="É assim que você vai aparecer na Agenda como profissional. Dá pra editar depois."
            />

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
              placeholder="Mínimo 6 caracteres"
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirmar senha"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />

            {error && (
              <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </Button>
          </form>
        </Card>

        <p
          className="text-center text-sm text-paper-500 mt-5 animate-rise"
          style={{ animationDelay: "0.12s" }}
        >
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-signal-400 font-semibold hover:text-signal-300 transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
