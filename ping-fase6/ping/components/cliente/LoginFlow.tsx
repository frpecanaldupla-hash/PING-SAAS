"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PingMark } from "@/components/shared/PingMark";
import { findClientsByPhone, loginWithPin, setupPin } from "@/app/cliente/actions";

type ClientMatch = { id: string; name: string; hasPin: boolean; businessName: string };
type Step = "phone" | "choose" | "setup" | "pin";

export function LoginFlow() {
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

    const result = await findClientsByPhone(phone);
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
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center">
            <PingMark size={72} />
            <h1 className="font-display text-4xl tracking-wide mt-2">PING</h1>
          </Link>
          <p className="text-paper-500 text-sm mt-1">Sua área de cliente</p>
        </div>

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="ping-card p-6 space-y-4">
            <div>
              <label htmlFor="phone" className="text-xs text-paper-500 mb-1.5 block">
                Seu telefone
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoFocus
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
                placeholder="(00) 00000-0000"
              />
              <p className="text-xs text-paper-500 mt-2">
                O mesmo telefone que você deu na hora de agendar.
              </p>
            </div>

            {error && <p className="text-danger text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
            >
              {loading ? "Buscando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === "choose" && (
          <div className="ping-card p-6 space-y-3">
            <p className="text-xs text-paper-500">Encontramos mais de um cadastro. Qual é o seu?</p>
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => chooseMatch(m)}
                className="w-full text-left px-4 py-3 rounded-sm border border-ink-700 hover:border-signal-500/50 transition-colors flex justify-between items-center"
              >
                <span className="text-sm font-medium">{m.businessName}</span>
                <span className="text-xs text-paper-500">{m.name}</span>
              </button>
            ))}
            <button
              onClick={() => setStep("phone")}
              className="text-signal-500 text-sm font-semibold pt-1"
            >
              Voltar
            </button>
          </div>
        )}

        {step === "setup" && selected && (
          <form onSubmit={handleSetupSubmit} className="ping-card p-6 space-y-4">
            <p className="text-sm">
              Oi, <strong>{selected.name}</strong>! Primeiro acesso — crie uma senha de 4 números
              pra usar da próxima vez.
            </p>
            <div>
              <label className="text-xs text-paper-500 mb-1.5 block">Senha (4 números)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-signal-500 outline-none"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-xs text-paper-500 mb-1.5 block">Confirme a senha</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-signal-500 outline-none"
                placeholder="••••"
              />
            </div>

            {error && <p className="text-danger text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || pin.length < 4 || pinConfirm.length < 4}
              className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
            >
              {loading ? "Salvando..." : "Criar senha e entrar"}
            </button>
          </form>
        )}

        {step === "pin" && selected && (
          <form onSubmit={handlePinSubmit} className="ping-card p-6 space-y-4">
            <p className="text-sm">
              Oi de novo, <strong>{selected.name}</strong>! Digite sua senha.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-signal-500 outline-none"
              placeholder="••••"
            />

            {error && <p className="text-danger text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
