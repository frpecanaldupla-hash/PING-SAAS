"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PingMark } from "@/components/shared/PingMark";
import { findClientsByPhone, loginWithPin, setupPin } from "@/app/cliente/actions";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type ClientMatch = { id: string; name: string; hasPin: boolean; businessName: string };
type Step = "phone" | "choose" | "setup" | "pin";

// Campo de PIN — o Input do design system com dígitos grandes e espaçados.
const PIN_INPUT_CLASSES = "text-center text-2xl tracking-[0.5em]";

// `slug` (opcional): veio de /b/[slug] via /cliente/entrar?negocio=slug —
// restringe a busca a esse negócio (ver findClientsByPhone).
export function LoginFlow({ slug }: { slug?: string } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [matches, setMatches] = useState<ClientMatch[]>([]);
  const [selected, setSelected] = useState<ClientMatch | null>(null);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await findClientsByPhone(phone, slug);
    setLoading(false);

    if (result.error || !result.matches) {
      setError(result.error ?? "Não foi possível continuar.");
      return;
    }

    if (result.matches.length === 1) {
      const only = result.matches[0];
      setSelected(only);
      setStep(only.hasPin ? "pin" : "setup");
      return;
    }

    setMatches(result.matches);
    setStep("choose");
  }

  function chooseMatch(match: ClientMatch) {
    setSelected(match);
    setError(null);
    setStep(match.hasPin ? "pin" : "setup");
  }

  async function handleSetupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (pin !== pinConfirm) {
      setError("As senhas digitadas são diferentes.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await setupPin(selected.id, pin);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/cliente");
    router.refresh();
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    setError(null);
    const result = await loginWithPin(selected.id, pin);
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
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={88} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Sua área de cliente</p>
        </div>

        {step === "phone" && (
          <Card className="animate-rise">
            <form onSubmit={handlePhoneSubmit} className="p-6 space-y-4">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                label="Seu telefone"
                autoFocus
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                hint="O mesmo telefone que você deu na hora de agendar."
              />

              {error && (
                <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" disabled={loading} className="w-full">
                {loading ? "Buscando..." : "Continuar"}
              </Button>
            </form>
          </Card>
        )}

        {step === "phone" && (
          <p
            className="text-center text-sm text-paper-500 mt-5 animate-rise"
            style={{ animationDelay: "0.12s" }}
          >
            Ainda não é cliente em lugar nenhum?{" "}
            <Link
              href="/cliente/buscar"
              className="text-signal-400 font-semibold hover:text-signal-300 transition-colors"
            >
              Encontre sua barbearia
            </Link>
          </p>
        )}

        {step === "choose" && (
          <Card className="animate-rise">
            <div className="p-6 space-y-3">
              <p className="text-xs text-paper-500">Encontramos mais de um cadastro. Qual é o seu?</p>
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => chooseMatch(m)}
                  className="w-full text-left px-4 py-3 rounded-sm border border-ink-700 hover:border-signal-400/40 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{m.businessName}</span>
                  <span className="text-xs text-paper-500">{m.name}</span>
                </button>
              ))}
              <button
                onClick={() => setStep("phone")}
                className="text-signal-400 hover:text-signal-300 transition-colors text-sm font-semibold pt-1"
              >
                Voltar
              </button>
            </div>
          </Card>
        )}

        {step === "setup" && selected && (
          <Card className="animate-rise">
            <form onSubmit={handleSetupSubmit} className="p-6 space-y-4">
              <p className="text-sm">
                Oi, <strong>{selected.name}</strong>! Primeiro acesso — crie uma senha de 4 números
                pra usar da próxima vez.
              </p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                label="Senha (4 números)"
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className={PIN_INPUT_CLASSES}
              />
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                label="Confirme a senha"
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
                {loading ? "Salvando..." : "Criar senha e entrar"}
              </Button>
            </form>
          </Card>
        )}

        {step === "pin" && selected && (
          <Card className="animate-rise">
            <form onSubmit={handlePinSubmit} className="p-6 space-y-4">
              <p className="text-sm">
                Oi de novo, <strong>{selected.name}</strong>! Digite sua senha.
              </p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
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
                disabled={loading || pin.length < 4}
                className="w-full"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
