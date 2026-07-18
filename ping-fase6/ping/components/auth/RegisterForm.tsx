"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PingMark } from "@/components/shared/PingMark";

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
export function RegisterForm() {
  const router = useRouter();
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
        data: { business_name: businessName, owner_name: ownerName },
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
      <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center">
            <Link href="/">
              <PingMark size={72} />
            </Link>
          </div>
          <h1 className="font-display text-3xl tracking-wide mt-4 mb-2">Quase lá</h1>
          <p className="text-paper-400 text-sm leading-relaxed">
            Enviamos um link de confirmação para{" "}
            <strong className="text-paper-50">{email}</strong>. Clique nele e
            depois volte aqui para entrar.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-signal-500 text-sm font-semibold"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={72} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Crie a conta do seu negócio</p>
        </div>

        <form onSubmit={handleSubmit} className="ping-card p-6 space-y-4">
          <div>
            <label htmlFor="businessName" className="text-xs text-paper-500 mb-1.5 block">
              Nome do negócio
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
              placeholder="Ex: Barbearia Central"
            />
          </div>

          <div>
            <label htmlFor="ownerName" className="text-xs text-paper-500 mb-1.5 block">
              Seu nome
            </label>
            <input
              id="ownerName"
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
              placeholder="Ex: Zé"
            />
            <p className="text-[11px] text-paper-500 mt-1.5">
              É assim que você vai aparecer na Agenda como profissional. Dá pra editar depois.
            </p>
          </div>

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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-xs text-paper-500 mb-1.5 block">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
              placeholder="Repita a senha"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-center text-sm text-paper-500 mt-5">
          Já tem conta?{" "}
          <Link href="/login" className="text-signal-500 font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
