"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PingMark } from "@/components/shared/PingMark";
import { registerClientForBusiness } from "@/app/b/[slug]/actions";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

// Campo de PIN — mesmo padrão de components/cliente/LoginFlow.tsx.
const PIN_INPUT_CLASSES = "text-center text-2xl tracking-[0.5em]";

// Cadastro autoatendido do cliente, direto num negócio conhecido pelo slug
// (ver app/b/[slug]/page.tsx) — diferente do LoginFlow, que resolve QUEM é
// o cliente por telefone entre vários negócios possíveis. Aqui não tem
// ambiguidade nenhuma: já se sabe o negócio, só falta criar a conta.
export function RegisterForm({ slug, businessName }: { slug: string; businessName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin !== pinConfirm) {
      setError("As senhas digitadas são diferentes.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await registerClientForBusiness({ slug, name, phone, pin });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/cliente");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ink-950 text-paper-50 px-6 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-sm py-12">
        <div className="flex flex-col items-center mb-8 animate-rise">
          <Link href={`/b/${slug}`} className="flex flex-col items-center">
            <PingMark size={88} />
            <h1 className="font-display text-3xl tracking-wide mt-2 text-center leading-tight">
              {businessName}
            </h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Criar minha conta</p>
        </div>

        <Card className="animate-rise">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="Seu nome"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como você quer ser chamado"
            />
            <Input
              label="Telefone"
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              hint="É por aqui que você entra da próxima vez."
            />
            <Input
              label="Crie uma senha (4 números)"
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className={PIN_INPUT_CLASSES}
            />
            <Input
              label="Confirme a senha"
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className={PIN_INPUT_CLASSES}
            />

            {error && (
              <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading || pin.length < 4 || pinConfirm.length < 4}
              className="w-full"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </Card>

        <p
          className="text-center text-sm text-paper-500 mt-5 animate-rise"
          style={{ animationDelay: "0.12s" }}
        >
          Já tem conta aqui?{" "}
          <Link
            href="/cliente/entrar"
            className="text-signal-400 font-semibold hover:text-signal-300 transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
